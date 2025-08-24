from django import forms
from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import (
    authenticate, get_user_model, login, logout
)
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.core.mail import (
    send_mass_mail, send_mail, EmailMessage
)
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.db.models import Q, Prefetch, Count, Sum
from django.forms import (
    modelformset_factory, inlineformset_factory
)
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.dateformat import format as dformat
from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_encode, urlsafe_base64_decode
)
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import *
from .forms import *
from users.models import UserProfile as UsersUserProfile

import base64
import csv
import datetime
import hashlib
import hmac
import io
import json
import pdfkit
import qrcode
import razorpay
import tempfile
import uuid
from io import BytesIO
from PIL import Image
from xhtml2pdf import pisa


@login_required
def admin_notifications(request):
    admin_notifications = AdminNotification.objects.all().order_by('-created_at')
    return render(request, 'portfolio/admin/notifications.html', {
        'admin_notifications': admin_notifications
    })


@staff_member_required
def admin_agent_students(request, agent_id):
    agent = get_object_or_404(UserProfile, id=agent_id, user_type='agent')
    students = UserProfile.objects.filter(
        created_by=agent, user_type='student').order_by('-created_at')
    week_start = request.GET.get('week_start')
    week_end = request.GET.get('week_end')
    if week_start and week_end:
        from datetime import datetime
        week_start = datetime.strptime(week_start, '%Y-%m-%d').date()
        week_end = datetime.strptime(week_end, '%Y-%m-%d').date()
        students = students.filter(
            created_at__date__gte=week_start, created_at__date__lte=week_end)
    context = {
        'agent': agent,
        'students': students,
        'week_start': week_start,
        'week_end': week_end,
    }
    if request.GET.get('download') == 'pdf':
        from django.template.loader import render_to_string
        from xhtml2pdf import pisa
        html = render_to_string(
            'portfolio/admin/agent_students_pdf.html', context)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="students_{agent.user.username}.pdf"'
        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return HttpResponse("Error generating PDF", status=500)
        return response
    return render(request, 'portfolio/admin/agent_students.html', context)

# Admin Portfolio Actions


@login_required
def admin_portfolio_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)
    return render(request, 'portfolio/admin/portfolio_view.html', {'portfolio': portfolio})


@login_required
def admin_portfolio_edit(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)
    if request.method == 'POST':
        portfolio.status = request.POST.get('status', portfolio.status)
        # Add more fields as needed
        portfolio.save()
        messages.success(request, "Portfolio updated successfully.")
        return redirect('admin_portfolio_list')
    return render(request, 'portfolio/admin/portfolio_edit.html', {'portfolio': portfolio})


@login_required
def admin_portfolio_delete(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)
    if request.method == 'POST':
        portfolio.delete()
        messages.success(request, "Portfolio deleted successfully.")
        return redirect('admin_portfolio_list')
    return render(request, 'portfolio/admin/portfolio_confirm_delete.html', {'portfolio': portfolio})


# generate_agent_qr function is defined in this file below
# Import admin views for monitoring
try:
    from .admin_views import (
        monitoring_dashboard, security_logs, performance_metrics,
        api_monitoring_data, block_ip, unblock_ip, clear_logs, export_monitoring_data
    )
except ImportError as e:
    print(f"Warning: Could not import admin_views: {e}")
    # Create dummy functions to prevent errors

    def monitoring_dashboard(request):
        from django.http import HttpResponse
        return HttpResponse("Monitoring dashboard not available")

    def security_logs(request):
        from django.http import HttpResponse
        return HttpResponse("Security logs not available")

    def performance_metrics(request):
        from django.http import HttpResponse
        return HttpResponse("Performance metrics not available")

    def api_monitoring_data(request):
        from django.http import JsonResponse
        return JsonResponse({"error": "Monitoring not available"})

    def block_ip(request):
        from django.http import JsonResponse
        return JsonResponse({"error": "IP blocking not available"})

    def unblock_ip(request):
        from django.http import JsonResponse
        return JsonResponse({"error": "IP unblocking not available"})

    def clear_logs(request):
        from django.http import JsonResponse
        return JsonResponse({"error": "Log clearing not available"})

    def export_monitoring_data(request):
        from django.http import HttpResponse
        return HttpResponse("Export not available")


# Simple test view for monitoring
@login_required
@user_passes_test(lambda u: u.is_staff)
def test_monitoring(request):
    """Simple test view for monitoring dashboard."""
    from django.shortcuts import render
    from django.http import JsonResponse

    if request.headers.get('Accept') == 'application/json':
        return JsonResponse({
            'status': 'success',
            'message': 'Monitoring system is working',
            'security_metrics': {
                'blocked_ips': 0,
                'suspicious_activities': 0,
                'failed_login_attempts': 0,
            },
            'performance_metrics': {
                'slow_queries': 0,
                'total_queries': 0,
            },
            'error_metrics': {
                'total_errors': 0,
                'error_counts': {},
            }
        })

    context = {
        'security_metrics': {
            'blocked_ips': 0,
            'suspicious_activities': 0,
            'failed_login_attempts': 0,
        },
        'performance_report': {
            'slow_queries': [],
            'performance_metrics': {},
            'database_stats': {
                'total_queries': 0,
                'slow_queries': 0,
                'average_query_time': 0,
            }
        },
        'error_metrics': {
            'total_errors': 0,
            'error_counts': {},
        },
        'recent_activities': [],
        'db_stats': {
            'total_queries': 0,
            'slow_queries': 0,
            'average_query_time': 0,
        },
    }

    return render(request, 'portfolio/admin/simple_monitoring.html', context)


@login_required
def admin_add_student(request):
    if not request.user.is_superuser:
        messages.error(request, "Admin access required.")
        return redirect('admin_dashboard')

    if request.method == 'POST':
        form = AgentAddStudentForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            from django.utils.crypto import get_random_string
            password = get_random_string(10)
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            # Create UserProfile as student
            UserProfile.objects.create(
                user=user,
                user_type='student',
                first_name=first_name,
                last_name=last_name,
                email=email,
                terms_accepted=False,  # Admin-created users need to accept terms on first login
                terms_accepted_at=None
            )
            messages.success(
                request, f"Student '{username}' created successfully. Temporary password: {password}")
            form = AgentAddStudentForm()
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = AgentAddStudentForm()

    return render(request, 'portfolio/admin_add_student.html', {'form': form})


def get_or_create_user_profile(user):
    """
    Get or create a UserProfile for a user with proper defaults.
    This prevents DoesNotExist exceptions throughout the application.
    """
    try:
        return user.userprofile
    except UserProfile.DoesNotExist:
        # Create profile with sensible defaults
        return UserProfile.objects.create(
            user=user,
            first_name=user.first_name or '',
            last_name=user.last_name or '',
            email=user.email or '',
            address='',
            contact='',
            pin_code='',
            terms_accepted=False,  # Default to False for safety
            terms_accepted_at=None
        )


@login_required
@require_POST
def suggest_hobby_view(request, pk):
    """
    Returns a set of hobby suggestions for the user based on most common hobbies or user input.
    This is a free, template-based suggestion (no paid AI).
    """
    import json
    from django.http import JsonResponse
    import random

    # Get the portfolio to verify ownership
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    COMMON_HOBBIES = [
        "Reading", "Traveling", "Music", "Sports", "Cooking", "Photography", "Drawing", "Gardening",
        "Dancing", "Writing", "Cycling", "Hiking", "Gaming", "Yoga", "Painting", "Swimming", "Volunteering",
        "Crafting", "Meditation", "Blogging", "Fishing", "Running", "Chess", "Movies", "Board Games"
    ]

    try:
        data = json.loads(request.body.decode('utf-8'))
        content = data.get('content', '').strip().lower()

        # If user typed something, suggest up to 5 matching hobbies
        if content:
            matches = [
                hobby for hobby in COMMON_HOBBIES if content in hobby.lower()]
            if matches:
                suggestions = matches[:5]
            else:
                suggestions = random.sample(
                    COMMON_HOBBIES, min(5, len(COMMON_HOBBIES)))
        else:
            suggestions = random.sample(
                COMMON_HOBBIES, min(5, len(COMMON_HOBBIES)))

        return JsonResponse({'suggestions': suggestions})
    except Exception as e:
        return JsonResponse({'error': 'Could not generate hobby suggestions.'}, status=400)


# Make sure UserProfile is imported


# In your views.py
User = get_user_model()  # Uses CustomUser if AUTH_USER_MODEL is set


def register(request):
    if request.method == "POST":
        form = RegistrationForm(request.POST)
        if form.is_valid():
            try:
                user = User.objects.create_user(
                    username=form.cleaned_data['username'],
                    email=form.cleaned_data['email'],
                    password=form.cleaned_data['password'],
                    is_active=False  # Disabled until email verification
                )

                # Create associated profile
                user_profile = UserProfile.objects.create(
                    user=user,
                    user_type='normal',
                    email=form.cleaned_data['email'],
                    first_name='',
                    last_name='',
                    terms_accepted=True,  # Normal users accept terms during registration
                    terms_accepted_at=timezone.now()
                )

                # Referral handling
                agent_id = request.session.get('referrer_agent_id')
                if agent_id:
                    try:
                        agent = User.objects.get(id=agent_id)
                        if hasattr(agent, 'userprofile') and agent.userprofile.user_type == 'agent':
                            Referral.objects.create(
                                referrer=agent, referred=user)
                    except User.DoesNotExist:
                        pass
                    del request.session['referrer_agent_id']

                # TODO: Email verification - temporarily disabled for testing
                # user.is_active = False  # Keep inactive until email verified
                # user.save()

                # # Send verification email
                # try:
                #     token = default_token_generator.make_token(user)
                #     uid = urlsafe_base64_encode(force_bytes(user.pk))
                #     current_site = get_current_site(request)
                #     verification_link = f"http://{current_site.domain}/activate/{uid}/{token}/"

                #     send_mail(
                #         subject="Verify Your Email - Academeo",
                #         message=f"Hello {user_profile.first_name},\n\nPlease click the link below to verify your email and activate your account:\n{verification_link}\n\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nAcademeo Team",
                #         from_email=settings.DEFAULT_FROM_EMAIL,
                #         recipient_list=[user.email],
                #         fail_silently=False,
                #     )

                #     messages.success(
                #         request, "Registration successful! Please check your email to verify your account.")

                # except Exception as e:
                #     print(f"Email sending failed: {e}")
                #     messages.warning(
                #         request, "Registration successful but verification email could not be sent. Please contact support.")

                # TEMPORARY: Direct activation for testing
                user.is_active = True
                user.save()
                messages.success(
                    request, "Registration successful! You can now log in.")

                return redirect('login')

            except Exception as e:
                messages.error(request, f"Registration failed: {str(e)}")
                if 'user' in locals() and user.pk:
                    user.delete()
    else:
        form = RegistrationForm()

    # Set a cookie to mark this user as a returning user
    response = render(request, 'portfolio/register.html', {'form': form})
    response.set_cookie('returning_user', 'true',
                        max_age=365*24*60*60)  # 1 year
    return response


def terms_view(request):
    return render(request, 'portfolio/terms.html')


def activate_account(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = get_object_or_404(User, pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    from django import forms

    class SetPasswordForm(forms.Form):
        password1 = forms.CharField(
            label="Password", widget=forms.PasswordInput(attrs={'class': 'form-control'}))
        password2 = forms.CharField(label="Confirm Password", widget=forms.PasswordInput(
            attrs={'class': 'form-control'}))

        def clean(self):
            cleaned_data = super().clean()
            p1 = cleaned_data.get('password1')
            p2 = cleaned_data.get('password2')
            if p1 and p2 and p1 != p2:
                raise forms.ValidationError("Passwords do not match.")
            return cleaned_data

    if user and token_generator.check_token(user, token):
        if request.method == 'POST':
            form = SetPasswordForm(request.POST)
            if form.is_valid():
                user.set_password(form.cleaned_data['password1'])
                user.is_active = True
                user.save()
                messages.success(
                    request, "Account activated! You can now log in.")
                return redirect('login')
        else:
            form = SetPasswordForm()
        return render(request, 'portfolio/set_password.html', {'form': form})
    else:
        messages.error(request, "Activation link is invalid!")
        return redirect('register')


# views.py


def register_with_referral(request, agent_id):
    agent = get_object_or_404(User, pk=agent_id)

    # Ensure the user is an agent
    if hasattr(agent, 'userprofile') and agent.userprofile.user_type == 'agent':
        request.session['referrer_agent_id'] = agent_id

    return redirect('register')


def unified_login(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        # DEBUG: Print authentication attempt
        print(
            f"🔍 Login attempt - Username: '{username}', Password length: {len(password) if password else 0}")

        # Check if user exists
        try:
            from django.contrib.auth.models import User
            user_exists = User.objects.get(username=username)
            print(
                f"✅ User exists: {user_exists.username}, Active: {user_exists.is_active}")
            print(
                f"   Email: {user_exists.email}, Date joined: {user_exists.date_joined}")
        except User.DoesNotExist:
            print(f"❌ User '{username}' does not exist in database")
            messages.error(request, f"User '{username}' does not exist!")
            response = render(request, 'portfolio/login.html')
            response.set_cookie('returning_user', 'true',
                                max_age=365*24*60*60)  # 1 year
            return response

        user = authenticate(request, username=username, password=password)
        print(f"🔐 Authentication result: {user}")

        if user:
            if not user.is_active:
                print(f"⚠️ User is inactive")
                messages.error(
                    request, "Your account is inactive. Please contact support or check for email verification.")
                return redirect('login')

            login(request, user)

            if user.is_superuser:
                return redirect('admin_dashboard')

            if not hasattr(user, 'userprofile'):
                print(f"❌ User profile missing for {username}")
                messages.error(
                    request, "Profile missing. Please contact support.")
                return redirect('login')

            if user.userprofile.user_type == 'agent':
                return redirect('agent_dashboard')

            return redirect('home')

        else:
            print(f"❌ Authentication failed for username: '{username}'")
            # Check if it's a password issue
            try:
                user_check = User.objects.get(username=username)
                if user_check.is_active:
                    messages.error(
                        request, "Invalid password! Please check your password.")
                else:
                    messages.error(
                        request, "Your account is not activated. Please contact support.")
            except User.DoesNotExist:
                messages.error(request, "Invalid username!")

    # Set a cookie to mark this user as a returning user
    response = render(request, 'portfolio/login.html')
    response.set_cookie('returning_user', 'true',
                        max_age=365*24*60*60)  # 1 year
    return response


def user_logout(request):
    logout(request)
    return redirect('home')




@login_required
def agent_dashboard(request):
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        messages.error(request, "Agent access required")
        return redirect('home')

    # NEW: Get student invitations data

    pending_invitations_qs = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='pending'
    )
    pending_invitations = pending_invitations_qs.count()

    approved_students = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='approved'
    ).count()

    # Students approved by admin but agent hasn't paid yet
    students_needing_payment = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='approved'
    ).exclude(
        agent_payments__status='completed'
    ).count()

    payment_amount_needed = students_needing_payment * 699

    recent_invitations = StudentInvitation.objects.filter(
        agent=user.userprofile
    ).select_related('student_user__userprofile').order_by('-created_at')[:10]

    # Referral tracking (existing code)
    referrals = Referral.objects.filter(referrer=user)
    converted = referrals.filter(is_converted=True)

    # Agent ranking based on total referrals
    all_agents = Referral.objects.values('referrer').annotate(
        count=Count('id')).order_by('-count')
    rank = next((i + 1 for i, a in enumerate(all_agents)
                if a['referrer'] == user.id), None)

    qr_path, referral_url = generate_agent_qr(user)
    referred_users = referrals.select_related(
        'referred').order_by('-registered_on')

    # Calculate conversion rate
    conversion_rate = (converted.count() / referrals.count()
                       * 100) if referrals.count() > 0 else 0

    return render(request, 'portfolio/agent_dashboard_new.html', {
        'user': user,
        'qr_path': qr_path,
        'referral_url': referral_url,
        'referral_count': referrals.count(),
        'conversion_count': converted.count(),
        'conversion_rate': round(conversion_rate, 1),
        'referred_users': referred_users,
        'rank': rank,
        'total_agents': len(all_agents),
        # NEW: Student invitation data
        'pending_invitations_count': pending_invitations,
        'approved_students_count': approved_students,
        'students_needing_payment': students_needing_payment,
        'payment_amount_needed': payment_amount_needed,
        'recent_invitations': recent_invitations,
        'total_earnings': f"₹{user.userprofile.agent_total_earnings}",
    })


@login_required
def agent_add_student(request):
    """NEW: Agent creates student invitation (pending admin approval)"""
    user = request.user
    if not hasattr(user, 'userprofile') or not user.userprofile.is_agent:
        messages.error(request, "Agent access required")
        return redirect('home')

    if request.method == 'POST':
        form = StudentInvitationForm(request.POST, agent=user)
        if form.is_valid():
            # Create student invitation (not actual user yet)
            invitation = form.save(commit=False)
            invitation.agent = user.userprofile
            invitation.save()

            # Create admin notification
            AdminNotification.objects.create(
                notification_type='student_invitation',
                title=f'New Student Invitation from {user.userprofile.first_name}',
                message=f'Agent {user.username} ({user.userprofile.first_name}) has added student "{invitation.student_first_name} {invitation.student_last_name}" ({invitation.student_email}) for approval.',
                student_invitation=invitation
            )

            messages.success(
                request, f"Student invitation for '{invitation.student_username}' has been sent to admin for approval. You will be notified once approved.")
            form = StudentInvitationForm(agent=user)  # Reset form
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = StudentInvitationForm(agent=user)

    # Get pending invitations for this agent
    pending_invitations = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='pending'
    ).order_by('-created_at')

    return render(request, 'portfolio/agent_add_student.html', {
        'form': form,
        'pending_invitations': pending_invitations
    })


def generate_agent_qr(agent_id):
    url = f"https://yourdomain.com/register/?ref={agent_id}"
    qr = qrcode.make(url)
    buffer = BytesIO()
    qr.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    return qr_base64, url


@login_required
def export_referred_users_csv(request):
    user = request.user
    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        return HttpResponse("Not authorized", status=403)

    referrals = Referral.objects.filter(
        referrer=user).select_related('referred')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="referred_users.csv"'

    writer = csv.writer(response)
    writer.writerow(['Username', 'Email', 'Registered On', 'Converted'])

    for ref in referrals:
        writer.writerow([
            ref.referred.username,
            ref.referred.email,
            ref.registered_on.strftime('%Y-%m-%d %H:%M'),
            'Yes' if ref.is_converted else 'No'
        ])

    return response


@login_required
def export_invited_students_csv(request):
    user = request.user
    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        return HttpResponse("Not authorized", status=403)

    invited_students = UserProfile.objects.filter(
        created_by=user.userprofile,
        user_type='student'
    ).select_related('user').order_by('-user__date_joined')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="invited_students.csv"'

    writer = csv.writer(response)
    writer.writerow(['Name', 'Email', 'Status',
                    'Invitation Date', 'Profile Status'])

    for student in invited_students:
        name = f"{student.first_name} {student.last_name}"
        email = student.email
        status = 'Accepted' if student.user.is_active else 'Pending'
        invitation_date = student.user.date_joined.strftime('%Y-%m-%d %H:%M')
        profile_status = 'Complete' if (
            student.first_name and student.last_name and student.contact and student.address) else 'Incomplete'
        writer.writerow([name, email, status, invitation_date, profile_status])

    return response


@login_required
def edit_user_profile(request):
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        form = UserProfileForm(
            request.POST, request.FILES, instance=user_profile)
        if form.is_valid():
            form.save()
            return redirect('user_profile')
    else:
        form = UserProfileForm(instance=user_profile)

    return render(request, 'portfolio/edit_profile.html', {'form': form})


def home(request):
    context = {}

    # Real-time stats
    from django.contrib.auth.models import User
    active_users = User.objects.filter(is_active=True).count()
    portfolios_created = StudentPortfolio.objects.count()
    success_stories_count = SuccessStory.objects.filter(
        is_approved=True).count()
    # Example satisfaction rate calculation (customize as needed)
    satisfaction_rate = 98  # Static or calculate from feedback model if available

    # Get portfolio templates for showcase
    portfolio_templates = PortfolioTemplate.objects.filter(
        is_pdf=False)[:6]  # Show first 6 templates

    context.update({
        'active_users': active_users,
        'portfolios_created': portfolios_created,
        'success_stories_count': success_stories_count,
        'satisfaction_rate': satisfaction_rate,
        'portfolio_templates': portfolio_templates,
    })

    if request.user.is_authenticated:
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            portfolio = StudentPortfolio.objects.filter(
                user=request.user).first()
            context.update({
                'user_profile': user_profile,
                'portfolio': portfolio,
            })

            # Add agent-specific data if user is an agent
            if user_profile.user_type == 'agent':
                from django.db.models import Count, Sum
                from django.utils import timezone
                from datetime import timedelta

                # Get agent's students and invitations
                invited_students = StudentInvitation.objects.filter(
                    agent=user_profile)
                pending_invitations = invited_students.filter(
                    status='pending').count()
                approved_students = invited_students.filter(
                    status='approved').count()
                activated_students = invited_students.filter(
                    status='activated').count()

                # Get agent's earnings
                total_earnings = AgentPayment.objects.filter(
                    agent=user_profile,
                    status='completed'
                ).aggregate(total=Sum('amount'))['total'] or 0

                # Get recent activity (last 7 days)
                week_ago = timezone.now() - timedelta(days=7)
                recent_invitations = invited_students.filter(
                    created_at__gte=week_ago).count()

                # Get agent's rank
                all_agents = UserProfile.objects.filter(user_type='agent')
                agent_rank = 1
                for agent in all_agents:
                    agent_earnings = AgentPayment.objects.filter(
                        agent=agent,
                        status='completed'
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    if agent_earnings > total_earnings:
                        agent_rank += 1

                context.update({
                    'agent_stats': {
                        'pending_invitations': pending_invitations,
                        'approved_students': approved_students,
                        'activated_students': activated_students,
                        'total_earnings': total_earnings,
                        'recent_invitations': recent_invitations,
                        'agent_rank': agent_rank,
                        'total_agents': all_agents.count(),
                    }
                })

        except UserProfile.DoesNotExist:
            pass

    # Approved success stories (limit to 12 for homepage carousel)
    success_stories = SuccessStory.objects.filter(
        is_approved=True).order_by('-created_at')[:12]
    context['success_stories'] = success_stories

    return render(request, 'portfolio/home.html', context)


@login_required
def select_template(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)
    user_profile = portfolio.user_profile

    # Check if user has paid (for normal users)
    has_paid = False
    if user_profile.user_type in ['agent', 'student']:
        has_paid = True
    else:
        has_paid = Payment.objects.filter(user=request.user).exists()

    # For normal users, require payment before template selection
    if user_profile.user_type == 'normal' and not has_paid:
        messages.info(
            request, "Please purchase the portfolio package to select templates.")
        return redirect('initiate_payment')

    print("Is Paid:", portfolio.is_paid)
    print("Change Count:", user_profile.template_change_count)
    print("Max Changes:", user_profile.max_template_changes)

    # ✅ Corrected condition using user_profile limits
    if not portfolio.is_paid and user_profile.template_change_count >= user_profile.max_template_changes:
        messages.error(
            request, "You've used all allowed template changes. Please purchase to unlock more.")
        return redirect('initiate_payment')

    if request.method == 'POST':
        web_template_id = request.POST.get('web_template_id')

        if not web_template_id:
            return render(request, 'portfolio/templates_list.html', {
                'web_templates': PortfolioTemplate.objects.filter(is_pdf=False),
                'error': "Please select a web portfolio template.",
                'portfolio': portfolio
            })

        web_template = get_object_or_404(
            PortfolioTemplate, id=web_template_id, is_pdf=False)

        # Count as a change only if template actually changed
        if portfolio.template != web_template:
            # FIXED: Check limit before allowing change
            if not portfolio.is_paid and user_profile.template_change_count >= user_profile.max_template_changes:
                messages.error(
                    request, f"You've reached your template change limit ({user_profile.max_template_changes}). Please purchase to unlock more changes.")
                return redirect('initiate_payment')

            user_profile.template_change_count += 1
            user_profile.save(update_fields=['template_change_count'])

        portfolio.template = web_template
        portfolio.save()
        messages.success(request, "Template changed successfully!")
        return redirect('portfolio_preview', slug=portfolio.slug)

    return render(request, 'portfolio/templates_list.html', {
        'web_templates': PortfolioTemplate.objects.filter(is_pdf=False),
        'portfolio': portfolio
    })


def public_portfolio(request, slug):
    portfolio = get_object_or_404(StudentPortfolio, slug=slug)
    user_profile = portfolio.user_profile

    # Get all portfolio data - ensure we load everything
    education = Education.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    experience = Experience.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    skills = Skill.objects.filter(portfolio=portfolio).order_by('name')
    projects = Project.objects.filter(portfolio=portfolio).order_by('-id')
    certifications = Certification.objects.filter(
        portfolio=portfolio).order_by('-issue_year')
    languages = Language.objects.filter(portfolio=portfolio).order_by('name')
    hobbies = Hobby.objects.filter(portfolio=portfolio).order_by('name')
    summary = Summary.objects.filter(portfolio=portfolio).first()

    # Process projects to split technologies for template
    processed_projects = []
    for project in projects:
        project_dict = {
            'title': project.title,
            'description': project.description,
            'link': project.link,
            'technologies_used': project.technologies_used,
            'technologies_list': [tech.strip() for tech in project.technologies_used.split(',')] if project.technologies_used else [],
            'project_type': project.project_type,
        }
        processed_projects.append(project_dict)

    context = {
        'portfolio': portfolio,
        'user': portfolio.user,  # Add user object for template access
        'user_profile': user_profile,
        'education': education,
        'experience': experience,
        'skills': skills,
        'projects': processed_projects,
        'certifications': certifications,
        'languages': languages,
        'hobbies': hobbies,
        'summary': summary,
        # Add alternative names for template compatibility
        'education_items': education,
        'experience_items': experience,
        'skill_items': skills,
        'project_items': processed_projects,
        'certification_items': certifications,
        'language_items': languages,
        'hobby_items': hobbies,
        # Public view - no navigation
        'is_preview': False,
        'show_navigation': False,
    }

    # Use the direct template that we know works
    if portfolio.template and portfolio.template.template_file:
        template_name = f"portfolio/templates/{portfolio.template.template_file}"
    else:
        # Fallback to default template if no template is set
        template_name = 'portfolio/templates/portfolio1.html'

    return render(request, template_name, context)


# Create Portfolio


@login_required
def create_portfolio(request):
    # Use get_or_create to handle missing profiles gracefully
    user_profile = get_or_create_user_profile(request.user)

    # Check if user has paid (for normal users only)
    has_paid = False
    if user_profile.user_type in ['agent', 'student']:
        has_paid = True
    else:
        # For normal users, check payment status
        has_paid = Payment.objects.filter(user=request.user).exists()

    # If normal user hasn't paid, redirect to payment
    if user_profile.user_type == 'normal' and not has_paid:
        messages.info(
            request, "Please purchase the portfolio package for ₹1499 to continue.")
        return redirect('initiate_payment')

    # FIXED: Enforce portfolio slot limits
    if user_profile.portfolios_remaining <= 0:
        messages.error(request, "You need to purchase more portfolio slots.")
        return redirect('initiate_payment')

    # Check if a portfolio already exists for this user
    portfolio = StudentPortfolio.objects.filter(user=request.user).first()
    if portfolio:
        # Optionally update the portfolio fields if needed
        portfolio.user_profile = user_profile
        portfolio.is_paid = has_paid
        portfolio.status = 'in_progress'
        portfolio.save()
        return redirect('personal_info1', pk=portfolio.pk)
    else:
        slug = slugify(f"{request.user.username}-{uuid.uuid4().hex[:8]}")
        portfolio = StudentPortfolio.objects.create(
            user=request.user,
            user_profile=user_profile,
            is_paid=has_paid,  # Set based on payment status
            status='in_progress',
            slug=slug
        )
        # FIXED: Decrement portfolios_remaining
        user_profile.portfolios_remaining -= 1
        user_profile.save(update_fields=["portfolios_remaining"])
        return redirect('personal_info1', pk=portfolio.pk)


@login_required
def personal_info1_view(request, pk=None):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    if portfolio.status == 'completed':
        messages.warning(request, "You are editing a completed portfolio.")

    user_profile = portfolio.user_profile

    if request.method == 'POST':
        form = PersonalInfoForm1(
            request.POST, request.FILES, instance=user_profile)
        if form.is_valid():
            form.save()
            return redirect('add_education', pk=portfolio.pk)
    else:
        form = PersonalInfoForm1(instance=user_profile)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/personal_info1.html', {
        'form': form,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'personal_info1',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


def is_form_empty(form):
    return all(not field for name, field in form.cleaned_data.items() if name != 'DELETE')


def calculate_portfolio_progress(portfolio):
    """
    Calculate the completion status and progress for all portfolio forms.
    Returns a dictionary with completion status and progress information.
    """
    completed_steps = 0
    total_steps = 11

    # Track individual step completion status
    step_completion = {
        1: False,  # Personal Info 1
        2: False,  # Education
        3: False,  # Projects
        4: False,  # Experience
        5: False,  # Certifications
        6: False,  # Skills
        7: False,  # Languages
        8: False,  # Hobbies
        9: False,  # Extras
        10: False,  # Summary
        11: False,  # Personal Info 2
    }

    # Step 1: Personal Info 1 (Basic Info)
    if (portfolio.user_profile.first_name and
        portfolio.user_profile.last_name and
        portfolio.user_profile.email and
        portfolio.user_profile.contact and
        portfolio.user_profile.address and
            portfolio.user_profile.pin_code):
        completed_steps += 1
        step_completion[1] = True

    # Step 2: Education
    if Education.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[2] = True

    # Step 3: Projects
    if Project.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[3] = True

    # Step 4: Experience
    if Experience.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[4] = True

    # Step 5: Certifications
    if Certification.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[5] = True

    # Step 6: Skills
    if Skill.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[6] = True

    # Step 7: Languages
    if Language.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[7] = True

    # Step 8: Hobbies
    if Hobby.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[8] = True

    # Step 9: Extras (Extracurricular activities)
    if portfolio.user_profile.extracurricular:
        completed_steps += 1
        step_completion[9] = True

    # Step 10: Summary
    if Summary.objects.filter(portfolio=portfolio).exists():
        completed_steps += 1
        step_completion[10] = True

    # Step 11: Personal Info 2 (Social Links)
    if (portfolio.user_profile.github_link or
        portfolio.user_profile.facebook_link or
        portfolio.user_profile.instagram_link or
            portfolio.user_profile.other_social_link):
        completed_steps += 1
        step_completion[11] = True

    # Calculate progress percentage
    progress_percentage = int((completed_steps / total_steps) * 100)

    # Calculate progress width for the connecting line
    progress_width = int((completed_steps / total_steps) * 100)

    return {
        'completed_steps': completed_steps,
        'total_steps': total_steps,
        'progress_percentage': progress_percentage,
        'progress_width': progress_width,
        'step_completion': step_completion
    }


@login_required
def add_education_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing education for this portfolio
    existing_education = Education.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing education, 0 if there are existing ones
    extra_forms = 1 if not existing_education.exists() else 0

    formset_class = inlineformset_factory(
        StudentPortfolio, Education, form=EducationForm, extra=extra_forms, can_delete=False
    )

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_project', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Education section skipped.")
                return redirect('edit_portfolio_simple')

        formset = formset_class(request.POST, instance=portfolio)
        if formset.is_valid():
            formset.save()

            if 'save' in request.POST:
                messages.success(
                    request, "Education saved successfully. You can add more.")
                # Create new formset for additional forms
                extra_forms = 1  # Always show one extra form when adding more
                new_formset_class = inlineformset_factory(
                    StudentPortfolio, Education, form=EducationForm, extra=extra_forms, can_delete=False
                )
                formset = new_formset_class(instance=portfolio)
                # Calculate progress
                progress_data = calculate_portfolio_progress(portfolio)

                return render(request, 'portfolio/education_formset.html', {
                    'formset': formset,
                    'portfolio': portfolio,
                    'show_sidebar': True,
                    'current_step': 'add_education',
                    'progress_percentage': progress_data['progress_percentage'],
                    'completed_steps': progress_data['completed_steps'],
                    'progress_width': progress_data['progress_width'],
                    'step_completion': progress_data['step_completion']
                })

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_project', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Education updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please fill all required fields.")
    else:
        formset = formset_class(instance=portfolio)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/education_formset.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_education',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def add_project_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing projects for this portfolio
    existing_projects = Project.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing projects, 0 if there are existing ones
    extra_forms = 1 if not existing_projects.exists() else 0

    # Always use the correct formset
    ProjectFormSet = inlineformset_factory(
        StudentPortfolio,
        Project,
        form=ProjectForm,
        extra=extra_forms,
        can_delete=False
    )

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_experience', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Projects section skipped.")
                return redirect('edit_portfolio_simple')

        formset = ProjectFormSet(request.POST, instance=portfolio)

        if formset.is_valid():
            formset.save()

            if 'save' in request.POST:
                messages.success(
                    request, "Project saved successfully. You can add another.")
                # Create new formset for additional forms
                extra_forms = 1  # Always show one extra form when adding more
                new_formset = inlineformset_factory(
                    StudentPortfolio, Project, form=ProjectForm, extra=extra_forms, can_delete=True
                )
                formset = new_formset(instance=portfolio)
                return render(request, 'portfolio/project_formset.html', {
                    'formset': formset,
                    'portfolio': portfolio
                })

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_experience', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Projects updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(
                request, "Please fill out all required fields correctly.")
    else:
        formset = ProjectFormSet(instance=portfolio)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/project_formset.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_project',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def add_experience_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing experience for this portfolio
    existing_experience = Experience.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing experience, 0 if there are existing ones
    extra_forms = 1 if not existing_experience.exists() else 0

    formset_class = inlineformset_factory(
        StudentPortfolio, Experience, form=ExperienceForm, extra=extra_forms, can_delete=False
    )

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_certification', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Experience section skipped.")
                return redirect('edit_portfolio_simple')

        formset = formset_class(request.POST, instance=portfolio)
        if formset.is_valid():
            formset.save()

            if 'save' in request.POST:
                messages.success(
                    request, "Experience saved. You can add another.")
                # Create new formset for additional forms
                extra_forms = 1  # Always show one extra form when adding more
                new_formset_class = inlineformset_factory(
                    StudentPortfolio, Experience, form=ExperienceForm, extra=extra_forms, can_delete=False
                )
                formset = new_formset_class(instance=portfolio)
                # Calculate progress
                progress_data = calculate_portfolio_progress(portfolio)
                return render(request, 'portfolio/experience_form.html', {
                    'formset': formset,
                    'portfolio': portfolio,
                    'show_sidebar': True,
                    'current_step': 'add_experience',
                    'progress_percentage': progress_data['progress_percentage'],
                    'completed_steps': progress_data['completed_steps'],
                    'progress_width': progress_data['progress_width'],
                    'step_completion': progress_data['step_completion']
                })

            elif 'save_and_preview' in request.POST:
                if not portfolio.slug:
                    portfolio.slug = slugify(
                        f"{portfolio.user.username}-{portfolio.pk}")
                    portfolio.save()
                return redirect('portfolio_preview', slug=portfolio.slug)

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_certification', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Experience updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        formset = formset_class(instance=portfolio)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/experience_form.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_experience',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def add_certification_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing certifications for this portfolio
    existing_certifications = Certification.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing certifications, 0 if there are existing ones
    extra_forms = 1 if not existing_certifications.exists() else 0

    CertificationFormSet = modelformset_factory(
        Certification, form=CertificationForm, extra=extra_forms, can_delete=False)

    formset = CertificationFormSet(
        request.POST or None, queryset=existing_certifications, prefix='form')

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_skill', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Certifications section skipped.")
                return redirect('edit_portfolio_simple')

        if formset.is_valid():
            instances = formset.save(commit=False)
            for instance in instances:
                # Only save instances that have a name
                if instance.name and instance.name.strip():
                    instance.portfolio = portfolio
                    instance.save()
            for obj in formset.deleted_objects:
                obj.delete()

            if 'save' in request.POST:
                # reload same page to add another
                messages.success(
                    request, "Certification saved successfully. You can add more.")
                return redirect('add_certification', pk=pk)

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_skill', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(
                    request, "Certifications updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/add_certification.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_certification',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def add_skill_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing skills for this portfolio
    existing_skills = Skill.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing skills, 0 if there are existing ones
    extra_forms = 1 if not existing_skills.exists() else 0

    formset_class = inlineformset_factory(
        StudentPortfolio, Skill, form=SkillForm, extra=extra_forms, can_delete=False)

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_language', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Skills section skipped.")
                return redirect('edit_portfolio_simple')

        formset = formset_class(request.POST, instance=portfolio)
        if formset.is_valid():
            # Save the formset but only save instances with actual data
            instances = formset.save(commit=False)
            for instance in instances:
                # Only save instances that have both name and level
                if instance.name and instance.name.strip() and instance.level:
                    instance.save()
                    print(
                        f"DEBUG: Saved skill - Name: {instance.name}, Level: {instance.level}")
            for obj in formset.deleted_objects:
                obj.delete()

            if 'save' in request.POST:
                messages.success(request, "Skill saved. You can add another.")
                # Create new formset for additional forms
                extra_forms = 1  # Always show one extra form when adding more
                new_formset_class = inlineformset_factory(
                    StudentPortfolio, Skill, form=SkillForm, extra=extra_forms, can_delete=False)
                formset = new_formset_class(instance=portfolio)
                return render(request, 'portfolio/skill_formset.html', {
                    'formset': formset,
                    'portfolio': portfolio
                })
            else:
                # Check if this is creation flow or editing flow
                if portfolio.status == 'in_progress':
                    # Creation flow - continue to next step
                    return redirect('add_language', pk=portfolio.pk)
                else:
                    # Editing flow - return to edit page
                    messages.success(request, "Skills updated successfully!")
                    return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        formset = formset_class(instance=portfolio)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/skill_formset.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_skill',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


# views.py


@login_required
def add_language_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing languages for this portfolio
    existing_languages = Language.objects.filter(portfolio=portfolio)

    # Always show at least one empty form if none exist
    LanguageFormSet = modelformset_factory(
        Language, form=LanguageForm, extra=1, can_delete=False)

    if request.method == 'POST':
        formset = LanguageFormSet(
            request.POST, queryset=existing_languages, prefix='languages')
    else:
        if existing_languages.exists():
            formset = LanguageFormSet(
                queryset=existing_languages, prefix='languages')
        else:
            formset = LanguageFormSet(
                queryset=Language.objects.none(), prefix='languages')

    LANGUAGE_CHOICES = [
        "English", "Hindi", "Mandarin", "Spanish", "French", "Arabic", "Bengali", "Russian", "Portuguese",
        "Urdu", "German", "Japanese", "Punjabi", "Javanese", "Korean", "Italian", "Turkish", "Telugu",
        "Marathi", "Tamil", "Vietnamese", "Persian", "Gujarati", "Polish", "Ukrainian", "Malayalam", "Kannada"
    ]

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_hobby', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Languages section skipped.")
                return redirect('edit_portfolio_simple')

        if formset.is_valid():
            # Check if all forms are empty after validation
            all_empty = True
            for form in formset.forms:
                # Check if the form has actual data (not just empty or marked for deletion)
                if (form.cleaned_data and
                    not form.cleaned_data.get('DELETE', False) and
                        any(form.cleaned_data.get(field) for field in ['name', 'proficiency'] if form.cleaned_data.get(field))):
                    all_empty = False
                    break

            if all_empty:
                # Check if this is creation flow or editing flow
                if portfolio.status == 'in_progress':
                    # Creation flow - continue to next step
                    return redirect('add_hobby', pk=portfolio.pk)
                else:
                    # Editing flow - return to edit page
                    messages.info(request, "No languages added.")
                    return redirect('edit_portfolio_simple')

            instances = formset.save(commit=False)
            for instance in instances:
                # Only save instances that have both name and proficiency
                if instance.name and instance.proficiency:
                    instance.portfolio = portfolio
                    instance.save()
            for obj in formset.deleted_objects:
                obj.delete()

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_hobby', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Languages updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/add_language.html', {
        'formset': formset,
        'portfolio': portfolio,
        'languages': LANGUAGE_CHOICES,
        'show_sidebar': True,
        'current_step': 'add_language',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def add_hobby_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response

    # Get existing hobbies for this portfolio
    existing_hobbies = Hobby.objects.filter(portfolio=portfolio)

    # Set extra forms: 1 if no existing hobbies, 0 if there are existing ones
    extra_forms = 1 if not existing_hobbies.exists() else 0

    HobbyFormSet = modelformset_factory(
        Hobby, form=HobbyForm, extra=extra_forms, can_delete=False)

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('extras', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Hobbies section skipped.")
                return redirect('edit_portfolio_simple')

        formset = HobbyFormSet(
            request.POST, queryset=existing_hobbies, prefix='hobbies')

        if formset.is_valid():
            instances = formset.save(commit=False)
            for instance in instances:
                # Only save instances that have a name
                if instance.name and instance.name.strip():
                    instance.portfolio = portfolio
                    instance.save()
            for obj in formset.deleted_objects:
                obj.delete()

            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('extras', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Hobbies updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        formset = HobbyFormSet(queryset=existing_hobbies, prefix='hobbies')

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/add_hobby.html', {
        'formset': formset,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_hobby',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def extras_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response
    user_profile = portfolio.user_profile
    form = ExtrasForm(request.POST or None,
                      request.FILES or None, instance=user_profile)

    if request.method == 'POST':
        if 'skip' in request.POST:
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_summary', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.info(request, "Extras section skipped.")
                return redirect('edit_portfolio_simple')

        if form.is_valid():
            form.save()
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('add_summary', pk=portfolio.pk)
            else:
                # Editing flow - return to edit page
                messages.success(
                    request, "Additional information updated successfully!")
                return redirect('edit_portfolio_simple')
        else:
            messages.error(request, "Please correct the errors below.")

    resume_url = None
    if hasattr(user_profile, 'resume') and user_profile.resume:
        try:
            resume_url = user_profile.resume.url
        except Exception:
            resume_url = None
    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/extras.html', {
        'form': form,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'extras',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion'],
        'resume_url': resume_url
    })


@login_required
@require_POST
def suggest_summary_view(request, pk):
    """
    Returns a summary suggestion for the user based on their current input or portfolio info.
    This is a free, template-based suggestion (no paid AI).
    """
    import json
    from django.http import JsonResponse
    from .models import StudentPortfolio
    import random

    try:
        data = json.loads(request.body.decode('utf-8'))
        content = data.get('content', '').strip()
        portfolio = get_object_or_404(
            StudentPortfolio, pk=pk, user=request.user)

        # Example: Use portfolio info for a better suggestion if available
        from .models import Education, Experience
        name = getattr(portfolio, 'full_name', None) or getattr(
            request.user, 'first_name', '')
        # Try to get highest degree/qualification
        educations = Education.objects.filter(portfolio=portfolio)
        degree = None
        if educations.exists():
            # Try to get the most recent or highest degree
            degree = sorted(educations, key=lambda e: (
                e.end_year or 0, e.degree), reverse=True)[0].degree.strip().lower()
        # Try to get most recent experience
        experiences = Experience.objects.filter(portfolio=portfolio)
        job_title = None
        if experiences.exists():
            job_title = sorted(experiences, key=lambda e: (
                e.end_year or 0, e.job_title), reverse=True)[0].job_title.strip().lower()

        # Qualification-based suggestions (expanded)
        qual_suggestions = []
        if degree:
            if 'btech' in degree or 'b.e' in degree or 'bachelor of technology' in degree:
                qual_suggestions.append(
                    "B.Tech graduate with a strong foundation in engineering principles and hands-on project experience. Passionate about applying technical skills to solve real-world problems.")
                qual_suggestions.append(
                    "Recent B.Tech graduate eager to contribute technical expertise and innovative thinking to a dynamic organization.")
                qual_suggestions.append(
                    "Engineering graduate with a focus on innovation, teamwork, and continuous learning.")
            elif 'mtech' in degree or 'm.tech' in degree or 'master of technology' in degree:
                qual_suggestions.append(
                    "M.Tech graduate with specialized knowledge in engineering and research, ready to drive technological advancements.")
                qual_suggestions.append(
                    "M.Tech holder passionate about research, development, and applying advanced engineering concepts.")
            elif 'bcom' in degree or 'b.com' in degree or 'bachelor of commerce' in degree:
                qual_suggestions.append(
                    "B.Com graduate with a solid background in accounting, finance, and business management. Detail-oriented and ready to support organizational growth.")
                qual_suggestions.append(
                    "Motivated B.Com graduate seeking opportunities to apply financial and analytical skills in a professional environment.")
                qual_suggestions.append(
                    "Commerce graduate with a keen interest in business analytics and financial planning.")
            elif 'mcom' in degree or 'm.com' in degree or 'master of commerce' in degree:
                qual_suggestions.append(
                    "M.Com graduate with advanced expertise in commerce, finance, and analytics, eager to contribute to business success.")
                qual_suggestions.append(
                    "M.Com holder with a passion for research, teaching, and financial management.")
            elif 'mba' in degree:
                qual_suggestions.append(
                    "MBA graduate with strong leadership, strategic planning, and business development skills. Ready to drive results in a fast-paced environment.")
                qual_suggestions.append(
                    "MBA holder with a focus on innovation, entrepreneurship, and organizational growth.")
            elif 'mca' in degree:
                qual_suggestions.append(
                    "MCA graduate with expertise in software development, programming, and IT solutions. Passionate about leveraging technology for business success.")
                qual_suggestions.append(
                    "MCA holder skilled in full-stack development, cloud computing, and emerging technologies.")
            elif 'bsc' in degree or 'b.sc' in degree or 'bachelor of science' in degree:
                qual_suggestions.append(
                    "B.Sc graduate with a solid foundation in scientific principles and research. Eager to contribute analytical and problem-solving skills.")
                qual_suggestions.append(
                    "Science graduate with a passion for research, innovation, and continuous learning.")
            elif 'msc' in degree or 'm.sc' in degree or 'master of science' in degree:
                qual_suggestions.append(
                    "M.Sc graduate with advanced knowledge in scientific research and analysis, ready to contribute to innovative projects.")
                qual_suggestions.append(
                    "M.Sc holder passionate about laboratory work, data analysis, and scientific discovery.")
            elif 'ba' in degree or 'b.a' in degree or 'bachelor of arts' in degree:
                qual_suggestions.append(
                    "BA graduate with strong communication, critical thinking, and creative skills. Ready to contribute to diverse professional settings.")
                qual_suggestions.append(
                    "Arts graduate with a passion for writing, research, and cultural studies.")
            elif 'ma' in degree or 'm.a' in degree or 'master of arts' in degree:
                qual_suggestions.append(
                    "MA graduate with expertise in humanities, research, and communication. Eager to contribute to academic and professional fields.")
                qual_suggestions.append(
                    "MA holder with a focus on critical analysis, teaching, and creative expression.")
            elif 'diploma' in degree:
                qual_suggestions.append(
                    "Diploma holder with practical skills and hands-on training in the chosen field. Committed to continuous learning and professional growth.")
                qual_suggestions.append(
                    "Diploma graduate with a focus on technical proficiency and real-world application.")
            elif 'phd' in degree or 'doctor' in degree:
                qual_suggestions.append(
                    "PhD holder with a strong background in research, analysis, and academic excellence. Ready to contribute to innovation and knowledge advancement.")
                qual_suggestions.append(
                    "Doctorate graduate passionate about research, teaching, and thought leadership in the field.")
            else:
                qual_suggestions.append(
                    f"Graduate with a background in {degree.title()}. Ready to apply academic knowledge and skills in a professional environment.")

        # Experience-based suggestions
        exp_suggestions = []
        if job_title:
            exp_suggestions.append(
                f"Experienced {job_title.title()} with a proven track record in the field. Adept at delivering results and contributing to team success.")
            exp_suggestions.append(
                f"Professional {job_title.title()} skilled in adapting to new challenges and driving organizational goals.")

        # General suggestions
        base_suggestions = [
            f"Motivated and detail-oriented student seeking opportunities to apply academic knowledge and develop professional skills.",
            f"Aspiring professional with a passion for learning and a commitment to excellence in all endeavors.",
            f"Driven individual eager to contribute positively to team goals and organizational success.",
            f"{name} is a proactive learner with strong communication and problem-solving abilities." if name else "Proactive learner with strong communication and problem-solving abilities.",
            f"Goal-oriented and adaptable, ready to take on new challenges and grow in a dynamic environment."
        ]

        suggestions = []
        if content and len(content) > 10:
            # Provide 2 refined versions of the user's input
            suggestions.append(
                f"{content[:1].upper() + content[1:]} (Refined: Consider making it concise and highlighting your strengths.)")
            suggestions.append(
                f"{content[:1].upper() + content[1:]} Passionate about continuous learning and growth.")
        # Add up to 2 qualification-based, 2 experience-based, and fill with general
        suggestions += qual_suggestions[:2]
        suggestions += exp_suggestions[:2]
        # Fill up to 5 suggestions
        if len(suggestions) < 5:
            needed = 5 - len(suggestions)
            suggestions += random.sample(base_suggestions,
                                         min(needed, len(base_suggestions)))
        return JsonResponse({'suggestions': suggestions[:5]})
    except Exception as e:
        return JsonResponse({'error': 'Could not generate suggestion.'}, status=400)


@login_required
def add_summary_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    # Enforce personal information completion
    redirect_response = enforce_personal_info_completion(request, portfolio)
    if redirect_response:
        return redirect_response
    summary, created = Summary.objects.get_or_create(portfolio=portfolio)

    if request.method == 'POST':
        form = SummaryForm(request.POST, instance=summary)
        if form.is_valid():
            form.save()
            # Check if this is creation flow or editing flow
            if portfolio.status == 'in_progress':
                # Creation flow - continue to next step
                return redirect('personal_info2', pk=pk)
            else:
                # Editing flow - return to edit page
                messages.success(request, "Summary updated successfully!")
                return redirect('edit_portfolio_simple')
    else:
        form = SummaryForm(instance=summary)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/add_summary.html', {
        'form': form,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'add_summary',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def personal_info2_view(request, pk):
    portfolio = get_object_or_404(StudentPortfolio, pk=pk)
    profile = portfolio.user_profile

    if request.method == 'POST':
        form = PersonalInfoForm2(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            portfolio.status = 'completed'
            portfolio.save()

            # Redirect to form data preview instead of template selection
            return redirect('form_data_preview', pk=portfolio.pk)

    else:
        form = PersonalInfoForm2(instance=profile)

    # Calculate progress
    progress_data = calculate_portfolio_progress(portfolio)

    return render(request, 'portfolio/personal_info2.html', {
        'form': form,
        'portfolio': portfolio,
        'show_sidebar': True,
        'current_step': 'personal_info2',
        'progress_percentage': progress_data['progress_percentage'],
        'completed_steps': progress_data['completed_steps'],
        'progress_width': progress_data['progress_width'],
        'step_completion': progress_data['step_completion']
    })


@login_required
def form_data_preview(request, pk):
    """
    Show a preview of user's form data (not the portfolio template)
    This is what users see after completing forms
    """
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    if portfolio.status != 'completed':
        messages.error(request, "Please complete your portfolio forms first.")
        return redirect('user_profile')

    user_profile = portfolio.user_profile

    # Check payment status
    has_paid = False
    if user_profile.user_type in ['agent', 'student']:
        has_paid = True
    else:
        has_paid = Payment.objects.filter(user=request.user).exists()

    # Load all form data
    education = Education.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    experience = Experience.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    skills = Skill.objects.filter(portfolio=portfolio).order_by('name')
    projects = Project.objects.filter(portfolio=portfolio).order_by('-id')
    certifications = Certification.objects.filter(
        portfolio=portfolio).order_by('-issue_year')
    languages = Language.objects.filter(portfolio=portfolio).order_by('name')
    hobbies = Hobby.objects.filter(portfolio=portfolio).order_by('name')
    summary = Summary.objects.filter(portfolio=portfolio).first()

    context = {
        'portfolio': portfolio,
        'user_profile': user_profile,
        'has_paid': has_paid,
        'education': education,
        'experience': experience,
        'skills': skills,
        'projects': projects,
        'certifications': certifications,
        'languages': languages,
        'hobbies': hobbies,
        'summary': summary,
    }

    return render(request, 'portfolio/form_data_preview.html', context)


@login_required
@login_required
@require_POST
def delete_portfolio(request):
    portfolio = StudentPortfolio.objects.filter(user=request.user).first()
    if portfolio:
        portfolio.delete()
        messages.success(request, "Your portfolio has been deleted.")
    else:
        messages.warning(request, "You don't have a portfolio to delete.")

    # Optional: clear slug from session or redirect to safe page
    return redirect('user_profile')  # or dashboard


@login_required
def edit_portfolio_simple(request):
    """
    Simplified portfolio editing - shows all forms in one page with pre-filled data
    """
    # Clear old messages to prevent accumulation
    storage = messages.get_messages(request)
    storage.used = True

    # Get the user's portfolio (completed or in-progress)
    portfolio = StudentPortfolio.objects.filter(
        user=request.user
    ).first()

    if not portfolio:
        messages.error(request, "You need to create a portfolio first.")
        return redirect('create_portfolio')

    user_profile = portfolio.user_profile

    if request.method == 'POST':
        # Handle form submissions
        if 'personal_info' in request.POST:
            personal_form = PersonalInfoForm1(
                request.POST, request.FILES, instance=user_profile)
            if personal_form.is_valid():
                personal_form.save()
                messages.success(
                    request, "Personal information updated successfully!")
                return redirect('edit_portfolio_simple')
            else:
                messages.error(
                    request, "Please correct the errors in the personal information form.")
                # Keep the form with errors for display

        elif 'social_info' in request.POST:
            social_form = PersonalInfoForm2(
                request.POST, instance=user_profile)
            if social_form.is_valid():
                social_form.save()
                messages.success(
                    request, "Social information updated successfully!")
                return redirect('edit_portfolio_simple')
            else:
                messages.error(
                    request, "Please correct the errors in the social information form.")

        elif 'extras' in request.POST:
            extras_form = ExtrasForm(
                request.POST, request.FILES, instance=user_profile)
            if extras_form.is_valid():
                # Save the model fields (extracurricular and resume)
                extras_form.save()

                # Handle additional fields that aren't in the model
                # You could save these to a user preferences model or session
                # For now, we'll just acknowledge them
                messages.success(
                    request, "Additional information updated successfully!")
                return redirect('edit_portfolio_simple')
            else:
                messages.error(
                    request, "Please correct the errors in the additional information form.")

        elif 'summary' in request.POST:
            summary, created = Summary.objects.get_or_create(
                portfolio=portfolio)
            summary_form = SummaryForm(request.POST, instance=summary)
            if summary_form.is_valid():
                summary_form.save()
                messages.success(request, "Summary updated successfully!")
                return redirect('edit_portfolio_simple')
            else:
                messages.error(
                    request, "Please correct the errors in the summary form.")

    # If we reach here, either it's a GET request or there were form errors
    # Prepare all forms with existing data - reload fresh instances to ensure we have latest data
    user_profile.refresh_from_db()
    portfolio.refresh_from_db()

    # Initialize forms - use forms with errors if they exist from POST
    if 'personal_form' not in locals():
        personal_form = PersonalInfoForm1(instance=user_profile)
    if 'social_form' not in locals():
        social_form = PersonalInfoForm2(instance=user_profile)
    if 'extras_form' not in locals():
        extras_form = ExtrasForm(instance=user_profile)

    # Get summary if it exists
    summary = Summary.objects.filter(portfolio=portfolio).first()
    if 'summary_form' not in locals():
        summary_form = SummaryForm(
            instance=summary) if summary else SummaryForm()

    # Get existing data for display - refresh from database with more explicit queries
    education_items = Education.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    experience_items = Experience.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    project_items = Project.objects.filter(portfolio=portfolio).order_by('-id')
    skill_items = Skill.objects.filter(portfolio=portfolio).order_by('name')
    certification_items = Certification.objects.filter(
        portfolio=portfolio).order_by('-issue_year')
    language_items = Language.objects.filter(
        portfolio=portfolio).order_by('name')
    hobby_items = Hobby.objects.filter(portfolio=portfolio).order_by('name')

    # Force refresh from database to get latest data
    from django.db import connection
    connection.queries_log.clear()  # Clear query cache

    # Debug: Print the data to console
    print(
        f"DEBUG EDIT VIEW: Found {skill_items.count()} skills for user {request.user.username}")
    print(
        f"DEBUG EDIT VIEW: Portfolio ID: {portfolio.id}, Slug: {portfolio.slug}")
    for skill in skill_items:
        print(f"  - Skill: {skill.name} | Level: {skill.level}")

    print(
        f"DEBUG EDIT VIEW: Found {hobby_items.count()} hobbies for user {request.user.username}")
    for hobby in hobby_items:
        print(f"  - Hobby: {hobby.name}")

    print(
        f"DEBUG EDIT VIEW: Found {language_items.count()} languages for user {request.user.username}")
    for lang in language_items:
        print(f"  - Language: {lang.name} | Proficiency: {lang.proficiency}")

    context = {
        'portfolio': portfolio,
        'user_profile': user_profile,
        'personal_form': personal_form,
        'social_form': social_form,
        'extras_form': extras_form,
        'summary_form': summary_form,
        'education_items': education_items,
        'experience_items': experience_items,
        'project_items': project_items,
        'skill_items': skill_items,
        'certification_items': certification_items,
        'language_items': language_items,
        'hobby_items': hobby_items,
    }

    return render(request, 'portfolio/edit_portfolio_simple.html', context)


@login_required
def delete_portfolio_entry(request, portfolio_pk, model_name, entry_id):
    model_map = {
        'education': Education,
        'experience': Experience,
        'project': Project,
        'skill': Skill,
    }

    model = model_map.get(model_name.lower())
    if not model:
        messages.error(request, "Invalid entry type.")
        return redirect('user_profile')  # or some fallback

    instance = get_object_or_404(
        model, pk=entry_id, portfolio__pk=portfolio_pk, portfolio__user=request.user)
    instance.delete()
    messages.success(
        request, f"{model_name.capitalize()} entry deleted successfully.")

    # Redirect based on model
    redirect_map = {
        'education': 'add_education',
        'experience': 'add_experience',
        'project': 'add_projects',
        'skill': 'add_skill',
    }
    return redirect(redirect_map.get(model_name.lower()), pk=portfolio_pk)


class MyApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "You accessed the API!"})

# views.py


@staff_member_required
def referral_admin_dashboard(request):
    agents = User.objects.filter(userprofile__user_type='agent')
    agent_data = []

    for agent in agents:
        referrals = Referral.objects.filter(referrer=agent)
        converted = referrals.filter(is_converted=True)
        commission = converted.count() * 100  # ₹100 per referral

        agent_data.append({
            'agent': agent,
            'total_referrals': referrals.count(),
            'converted': converted.count(),
            'commission': commission
        })

    payouts = ReferralPayout.objects.all().order_by('-paid_on')

    return render(request, 'portfolio/admin_referrals.html', {
        'agent_data': agent_data,
        'payouts': payouts
    })


@login_required
def download_payout_invoice(request, payout_id):
    try:
        payout = ReferralPayout.objects.get(id=payout_id, agent=request.user)
    except ReferralPayout.DoesNotExist:
        messages.error(request, "Payout not found.")
        return redirect('agent_dashboard')

    context = {
        'agent': payout.agent,
        'payout': payout,
        'referrals': payout.referrals_paid.all(),
    }

    html = render_to_string('portfolio/payout_invoice.html', context)
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="payout_invoice_{payout.id}.pdf"'

    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
        return HttpResponse("Error generating PDF", status=500)

    return response


# admin


@login_required
@staff_member_required
def admin_dashboard(request):
    # --- Agent Weekly Summary ---
    from django.utils import timezone
    from datetime import timedelta
    start_of_week = timezone.now().date() - timedelta(days=timezone.now().weekday())
    start_of_last_week = start_of_week - timedelta(days=7)
    end_of_last_week = start_of_week - timedelta(seconds=1)

    agents = UserProfile.objects.filter(user_type='agent')
    agent_weekly_summary = []
    for agent in agents:
        # Students added this week
        students_this_week = UserProfile.objects.filter(
            created_by=agent,
            user_type='student',
            created_at__date__gte=start_of_week
        ).count()
        # Students added last week
        students_last_week = UserProfile.objects.filter(
            created_by=agent,
            user_type='student',
            created_at__date__gte=start_of_last_week,
            created_at__date__lte=end_of_last_week
        ).count()
        # Payments this week
        payments_this_week = StudentPayment.objects.filter(
            agent=agent,
            status='completed',
            created_at__date__gte=start_of_week
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        # Payments last week
        payments_last_week = StudentPayment.objects.filter(
            agent=agent,
            status='completed',
            created_at__date__gte=start_of_last_week,
            created_at__date__lte=end_of_last_week
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        agent_weekly_summary.append({
            'agent': agent,
            'students_this_week': students_this_week,
            'payments_this_week': payments_this_week,
            'students_last_week': students_last_week,
            'payments_last_week': payments_last_week,
        })

    try:
        recent_activities = UserActivity.objects.order_by('-timestamp')[:10]

        # Count all users - both Django users and UserProfile users
        total_django_users = User.objects.count()
        total_profile_users = UserProfile.objects.count()
        manageable_users = User.objects.exclude(is_superuser=True).count()
        total_users = manageable_users  # Show manageable users as primary count

        users_without_profile = User.objects.filter(
            userprofile__isnull=True).count()
        blocked_users = UserProfile.objects.filter(is_blocked=True).count()
        total_agents = UserProfile.objects.filter(user_type='agent').count()
        normal_users = UserProfile.objects.filter(user_type='normal').count()
        student_users = UserProfile.objects.filter(user_type='student').count()
        total_payments = Payment.objects.count()
        total_revenue = Payment.objects.aggregate(
            total=Sum('amount'))['total'] or 0
        total_referrals = Referral.objects.count()
        converted_referrals = Referral.objects.filter(
            is_converted=True).count()
        conversion_rate = (converted_referrals /
                           total_referrals * 100) if total_referrals else 0
        total_portfolios = StudentPortfolio.objects.count()
        failed_payments = Payment.objects.filter(
            razorpay_payment_id='')  # Assuming empty = failed
        incomplete_portfolios = StudentPortfolio.objects.filter(
            status='in_progress')

        # New business model: Pending student approvals
        pending_students = UserProfile.objects.filter(
            user_type='student',
            user__is_active=False
        ).select_related('user', 'created_by')

        blocked_users_list = UserProfile.objects.filter(
            is_blocked=True).select_related('user')

        pending_invitations = StudentInvitation.objects.filter(
            status='pending'
        ).select_related('agent', 'agent__user').order_by('-created_at')

        admin_notifications = AdminNotification.objects.filter(
            is_read=False
        ).order_by('-created_at')[:10]

        # ✅ NEW: Pending Success Stories
        pending_success_stories = SuccessStory.objects.filter(
            is_approved=False).select_related('user').order_by('-created_at')

        # Gather user info
        user_infos = []
        for user in User.objects.all():
            profile = getattr(user, 'userprofile', None)
            portfolios = StudentPortfolio.objects.filter(user=user)
            portfolio_views = sum([p.views for p in portfolios])
            member_since = user.date_joined
            last_active = user.last_login
            user_infos.append({
                'username': user.username,
                'email': user.email,
                'portfolio_views': portfolio_views,
                'member_since': member_since,
                'last_active': last_active,
            })

        recent_referrals = Referral.objects.select_related(
            'referrer', 'referred').order_by('-registered_on')[:10]
        context = {
            'agent_weekly_summary': agent_weekly_summary,
            'total_users': total_users,
            'total_django_users': total_django_users,
            'manageable_users': manageable_users,
            'total_profile_users': total_profile_users,
            'users_without_profile': users_without_profile,
            'normal_users': normal_users,
            'student_users': student_users,
            'blocked_users': blocked_users,
            'total_agents': total_agents,
            'total_payments': total_payments,
            'total_revenue': total_revenue / 100,  # Convert paise to ₹
            'conversion_rate': round(conversion_rate, 2),
            'total_portfolios': total_portfolios,
            'recent_activities': recent_activities,
            'recent_referrals': recent_referrals,
            'failed_payments': failed_payments,
            'incomplete_portfolios': incomplete_portfolios,
            'blocked_users_list': blocked_users_list,
            'pending_students': pending_students,
            'pending_students_count': pending_students.count(),
            'pending_invitations': pending_invitations,
            'pending_invitations_count': pending_invitations.count(),
            'admin_notifications': admin_notifications,
            'notifications_count': admin_notifications.count(),
            'user_infos': user_infos,
            'pending_success_stories': pending_success_stories,  # ✅ ADDED TO CONTEXT
        }

    except Exception as e:
        messages.error(request, f"Error loading dashboard: {str(e)}")
        context = {
            'total_users': 0,
            'blocked_users': 0,
            'total_agents': 0,
            'total_payments': 0,
            'total_revenue': 0,
            'conversion_rate': 0,
            'total_portfolios': 0,
            'recent_activities': [],
            'failed_payments': [],
            'incomplete_portfolios': [],
            'blocked_users_list': [],
            'pending_students': [],
            'pending_students_count': 0,
            'pending_success_stories': [],  # fallback
        }

    return render(request, 'portfolio/admin/dashboard.html', context)


@staff_member_required
def approve_success_story(request, story_id):
    story = get_object_or_404(SuccessStory, pk=story_id)
    story.is_approved = True
    story.save()
    messages.success(request, "Success story approved.")
    return redirect('admin_dashboard')


@staff_member_required
def reject_success_story(request, story_id):
    story = get_object_or_404(SuccessStory, pk=story_id)
    story.delete()
    messages.error(request, "Success story rejected and removed.")
    return redirect('admin_dashboard')


@login_required
@staff_member_required
def admin_review_success_stories(request):
    pending_stories = SuccessStory.objects.filter(
        is_approved=False).select_related('user')
    return render(request, 'portfolio/admin/review_success_stories.html', {
        'pending_stories': pending_stories
    })


@staff_member_required
def admin_reports(request):
    # Top 5 agents
    top_agents = (Referral.objects.values('referrer__username')
                  .annotate(total=Count('id'))
                  .order_by('-total')[:5])

    # Weekly payment totals
    today = now().date()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    payment_data = []

    for day in last_7_days:
        total = (Payment.objects
                 .filter(date__date=day)
                 .aggregate(sum=Sum('amount'))['sum'] or 0)
        payment_data.append({
            'date': day.strftime("%Y-%m-%d"),
            'amount': total
        })

    # Prepare chart data
    chart_labels = [item['date'] for item in payment_data]
    chart_values = [item['amount'] for item in payment_data]

    context = {
        'top_agents': top_agents,
        'chart_labels': json.dumps(chart_labels),
        'chart_values': json.dumps(chart_values),
    }

    return render(request, 'portfolio/admin/reports.html', context)


@staff_member_required
def export_top_agents_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="top_agents.csv"'

    writer = csv.writer(response)
    writer.writerow(['Agent Username', 'Total Referrals'])

    top_agents = Referral.objects.values('referrer__username').annotate(
        total=Count('id')).order_by('-total')[:5]

    for agent in top_agents:
        writer.writerow([agent['referrer__username'], agent['total']])

    return response


@staff_member_required
def admin_send_notification(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        message = request.POST.get('message')

        # Optional: Save to DB
        AdminNotification.objects.create(
            title=title,
            message=message,
            sent_by=request.user
        )

        # Email logic (if needed)
        recipients = User.objects.filter(
            is_active=True).values_list('email', flat=True)
        email_data = [(title, message, 'your@email.com', [email])
                      for email in recipients if email]
        send_mass_mail(email_data, fail_silently=True)

        messages.success(request, "Notification sent successfully!")
        return redirect('admin_send_notification')

    return render(request, 'portfolio/admin/send_notification.html')


@staff_member_required
def admin_settings(request):
    # You can later pull settings from the database here
    context = {
        "app_name": "Portfolio Builder",
        "version": "1.0.0",
        "maintenance_mode": False,
        "support_email": "admin@example.com",
    }
    return render(request, 'portfolio/admin/settings.html', context)


@staff_member_required
def admin_activity_log(request):
    logs = AdminLog.objects.all().order_by(
        '-timestamp')[:100]  # latest 100 entries
    return render(request, 'portfolio/admin/activity_log.html', {'logs': logs})


def admin_user_list(request):
    # Get all users except superusers, grouped by type
    all_users = User.objects.exclude(
        is_superuser=True).select_related('userprofile')

    # Separate users by type
    normal_users = []
    agent_users = []
    student_users = []

    for user in all_users:
        # First check for actual referral records using explicit query
        referral_obj = Referral.objects.filter(referred=user).first()
        user.display_referral_info = referral_obj

        # If no referral info but user is a student, check if they were created by an agent
        if not user.display_referral_info and hasattr(user, 'userprofile') and user.userprofile.user_type == 'student':
            if user.userprofile.created_by and user.userprofile.created_by.user_type == 'agent':
                # Create a mock referral info object for display purposes
                class MockReferralInfo:
                    def __init__(self, referrer):
                        self.referrer = referrer
                        self.is_referral = False  # Mark as created_by relationship

                user.display_referral_info = MockReferralInfo(
                    user.userprofile.created_by.user)

        if hasattr(user, 'userprofile'):
            if user.userprofile.user_type == 'normal':
                normal_users.append(user)
            elif user.userprofile.user_type == 'agent':
                agent_users.append(user)
            elif user.userprofile.user_type == 'student':
                student_users.append(user)
        else:
            # Users without profiles are considered normal
            normal_users.append(user)

    context = {
        'normal_users': normal_users,
        'agent_users': agent_users,
        'student_users': student_users,
        'total_users': len(normal_users) + len(agent_users) + len(student_users)
    }

    return render(request, 'portfolio/admin/users.html', context)


class AgentCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']


@login_required
def add_agent(request):
    if not request.user.is_superuser:
        messages.error(request, "Admin access required.")
        return redirect('admin_dashboard')

    if request.method == 'POST':
        form = AgentCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            user_profile = UserProfile.objects.create(
                user=user,
                user_type='agent',
                email=user.email,
                first_name='',
                last_name='',
                address='',
                contact='',
                pin_code=''
            )
            # ✅ Pass the user_profile here!
            StudentPortfolio.objects.create(
                user=user,
                user_profile=user_profile,
                status='in_progress'
            )
            messages.success(
                request, f"Agent {user.username} created successfully.")
            return redirect('admin_dashboard')

    else:
        form = AgentCreationForm()

    return render(request, 'portfolio/admin/add_agent.html', {'form': form})


@login_required
def export_users_csv(request):
    if not request.user.is_superuser:
        messages.error(request, "Admin access required.")
        return redirect('admin_dashboard')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="users.csv"'

    writer = csv.writer(response)
    writer.writerow(['Username', 'Email', 'User Type', 'Blocked'])

    profiles = UserProfile.objects.select_related('user')
    for profile in profiles:
        writer.writerow([
            profile.user.username,
            profile.user.email,
            profile.user_type,
            'Yes' if profile.is_blocked else 'No'
        ])

    return response


@login_required
def review_payouts(request):
    if not request.user.is_superuser:
        messages.error(request, "Admin access required.")
        return redirect('admin_dashboard')

    payouts = ReferralPayout.objects.select_related(

        'agent').prefetch_related('referrals_paid').order_by('-paid_on')
    return render(request, 'portfolio/admin/review_payouts.html', {'payouts': payouts})


def admin_agent_list(request):
    agents = User.objects.filter(userprofile__user_type='agent')
    for agent in agents:
        agent.referred_by = Referral.objects.filter(referrer=agent)
    return render(request, 'portfolio/admin/agents.html', {'agents': agents})


def edit_user_details(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user_profile = user.userprofile

    if request.method == "POST":
        form = UserProfileForm(request.POST, instance=user_profile)
        if form.is_valid():
            form.save()
            messages.success(request, "Agent details updated successfully.")
            return redirect('admin_agent_list')
    else:
        form = UserProfileForm(instance=user_profile)

    return render(request, 'portfolio/admin/edit_user.html', {'form': form, 'user': user})


def block_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile = user.userprofile

    if request.method == 'POST':
        form = BlockUserForm(request.POST)
        if form.is_valid():
            profile.is_blocked = True
            profile.blocked_since = timezone.now()
            profile.reason = form.cleaned_data['reason']
            profile.save()
            messages.warning(request, f"{user.username} has been blocked.")
            return redirect('admin_agent_list' if profile.user_type == 'agent' else 'admin_user_list')
    else:
        form = BlockUserForm()

    return render(request, 'portfolio/admin/block_user.html', {'form': form, 'user': user})


def unblock_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile = user.userprofile
    profile.is_blocked = False
    profile.reason = ""
    profile.blocked_since = None
    profile.save()
    messages.success(request, f"{user.username} has been unblocked.")
    return redirect('admin_user_list' if profile.user_type == 'normal' else 'admin_agent_list')


@user_passes_test(lambda u: u.is_superuser)
@login_required
def delete_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    username = user.username
    user_type = user.userprofile.user_type if hasattr(
        user, 'userprofile') else 'normal'

    # Prevent deletion of superusers
    if user.is_superuser:
        messages.error(request, "Cannot delete superuser accounts.")
        if user_type == 'agent':
            return redirect('admin_agent_list')
        else:
            return redirect('admin_user_list')

    # Prevent users from deleting themselves
    if user == request.user:
        messages.error(request, "You cannot delete your own account.")
        if user_type == 'agent':
            return redirect('admin_agent_list')
        else:
            return redirect('admin_user_list')

    # If GET request, show confirmation page
    if request.method == 'GET':
        # Collect information about what will be deleted for preview
        deletion_info = []

        if hasattr(user, 'userprofile') and user.userprofile.user_type == 'agent':
            # Count students created by this agent
            students_created = UserProfile.objects.filter(
                created_by=user.userprofile)
            student_count = students_created.count()
            if student_count > 0:
                deletion_info.append(
                    f"{student_count} student(s) will have their creator reference removed")

            # Count referrals made by this agent
            referrals_made = Referral.objects.filter(referrer=user)
            referral_count = referrals_made.count()
            if referral_count > 0:
                deletion_info.append(
                    f"{referral_count} referral(s) will be deleted")

            # Count payouts for this agent
            payouts = ReferralPayout.objects.filter(agent=user)
            payout_count = payouts.count()
            if payout_count > 0:
                deletion_info.append(
                    f"{payout_count} payout record(s) will be deleted")

        # Count portfolios
        portfolios = StudentPortfolio.objects.filter(user=user)
        portfolio_count = portfolios.count()
        if portfolio_count > 0:
            deletion_info.append(
                f"{portfolio_count} portfolio(s) will be deleted")

        # Count payments
        payments = Payment.objects.filter(user=user)
        payment_count = payments.count()
        if payment_count > 0:
            deletion_info.append(
                f"{payment_count} payment record(s) will be deleted")

        # Count user activities
        activities = UserActivity.objects.filter(user=user)
        activity_count = activities.count()
        if activity_count > 0:
            deletion_info.append(
                f"{activity_count} activity record(s) will be deleted")

        # Check if user was referred by someone
        try:
            referral_info = Referral.objects.get(referred=user)
            deletion_info.append(
                "Referral record (as referred user) will be deleted")
        except Referral.DoesNotExist:
            pass

        # Check for admin logs
        admin_logs = AdminLog.objects.filter(admin=user)
        admin_log_count = admin_logs.count()
        if admin_log_count > 0:
            deletion_info.append(
                f"{admin_log_count} admin log record(s) will be deleted")

        context = {
            'user_to_delete': user,
            'deletion_info': deletion_info,
            'user_type': user_type
        }
        return render(request, 'portfolio/admin/confirm_delete_user.html', context)

    # If POST request, actually delete the user
    elif request.method == 'POST':
        try:
            from django.db import connection
            print(
                f"[DEBUG] Starting deletion process for user: {username} (ID: {user_id})")

            # Step 1: Handle agent-specific cleanup (before disabling FK checks)
            if hasattr(user, 'userprofile') and user.userprofile.user_type == 'agent':
                # Set created_by to NULL for students created by this agent
                students_created = UserProfile.objects.filter(
                    created_by=user.userprofile)
                if students_created.exists():
                    print(
                        f"[DEBUG] Setting created_by to NULL for {students_created.count()} students")
                    students_created.update(created_by=None)

            # Step 2: Handle admin notifications (before disabling FK checks)
            # Note: AdminNotification doesn't have a sent_by field, so we skip this
            # try:
            #     admin_notifications = AdminNotification.objects.filter(sent_by=user)
            #     if admin_notifications.exists():
            #         print(f"[DEBUG] Updating {admin_notifications.count()} admin notifications")
            #         admin_notifications.update(sent_by=None)
            # except Exception as e:
            #     print(f"[DEBUG] Error updating admin notifications: {e}")

            # Step 3: Disable foreign key checks for SQLite and delete user
            # Use atomic transaction with FK checks disabled
            with transaction.atomic():
                print("[DEBUG] Disabling foreign key checks")
                # Disable foreign key checks (SQLite specific)
                with connection.cursor() as cursor:
                    cursor.execute("PRAGMA foreign_keys=OFF;")

                print(f"[DEBUG] Deleting user {username}")
                # Delete the user - Django's CASCADE should work now without constraint errors
                user.delete()
                print(f"[DEBUG] User {username} deleted successfully")

                # Re-enable foreign key checks
                print("[DEBUG] Re-enabling foreign key checks")
                with connection.cursor() as cursor:
                    cursor.execute("PRAGMA foreign_keys=ON;")

            messages.success(
                request, f"User {username} has been deleted successfully.")

        except Exception as e:
            import traceback
            print(f"[DEBUG] Error deleting user {username}: {str(e)}")
            print(f"[DEBUG] Traceback: {traceback.format_exc()}")

            # Re-enable foreign key checks even if there's an error
            try:
                with connection.cursor() as cursor:
                    cursor.execute("PRAGMA foreign_keys=ON;")
            except:
                pass

            messages.error(
                request, f"Failed to delete user {username}: {str(e)}")

        # Redirect based on user type
        if user_type == 'agent':
            return redirect('admin_agent_list')
        else:
            return redirect('admin_user_list')

    # For any other method, redirect back
    if user_type == 'agent':
        return redirect('admin_agent_list')
    else:
        return redirect('admin_user_list')


@user_passes_test(lambda u: u.is_superuser)  # Only superusers can impersonate
@login_required
def login_as_user(request, user_id):
    user = get_object_or_404(User, id=user_id)

    # Save original admin ID for switch back
    request.session['impersonated_by'] = request.user.id

    # Perform impersonation
    login(request, user)

    messages.success(request, f"You are now impersonating {user.username}.")

    # Redirect based on user type
    if hasattr(user, 'userprofile') and user.userprofile.user_type == 'agent':
        return redirect('agent_dashboard')
    else:
        return redirect('user_profile')  # or wherever normal users should go


# views.py

@login_required
def admin_portfolio_list(request):
    portfolios = StudentPortfolio.objects.all()
    return render(request, 'portfolio/admin/portfolios.html', {'portfolios': portfolios})


@login_required
def stop_impersonation(request):
    if 'impersonated_by' in request.session:
        original_admin = get_object_or_404(
            User, pk=request.session['impersonated_by'])
        del request.session['impersonated_by']
        login(request, original_admin)
    return redirect('admin_dashboard')


@login_required
def download_invoice(request, payment_id):
    payment = get_object_or_404(Payment, id=payment_id, user=request.user)

    context = {
        'payment': payment,
        'user': request.user,
        'amount_rupees': payment.amount / 100  # Convert paise to rupees
    }

    html = render_to_string('portfolio/invoice.html', context)

    # Windows path to wkhtmltopdf
    path_to_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'

    config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)

    pdf = pdfkit.from_string(html, False, configuration=config)

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="invoice_{payment.id}.pdf"'
    return response


@login_required
def resend_invoice(request, payment_id):
    payment = get_object_or_404(Payment, id=payment_id, user=request.user)

    context = {
        'payment': payment,
        'user': request.user,
        'amount_rupees': payment.amount / 100,
    }

    html = render_to_string('portfolio/invoice.html', context)
    config = pdfkit.configuration(
        wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe')
    pdf = pdfkit.from_string(html, False, configuration=config)

    email = EmailMessage(
        subject=f"Re-sent Invoice - {payment.invoice_number()}",
        body="Here's a copy of your invoice.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[request.user.email]
    )
    email.attach(f"invoice_{payment.id}.pdf", pdf, 'application/pdf')
    email.send()

    messages.success(request, "Invoice re-sent to your email.")
    return redirect('user_profile')


@login_required
def admin_payment_list(request):
    payments = Payment.objects.all().select_related('user')
    q = request.GET.get("q")
    if q:
        payments = payments.filter(
            Q(user__username__icontains=q) |
            Q(razorpay_payment_id__icontains=q)
        )

    date_filter = request.GET.get("date")
    if date_filter:
        payments = payments.filter(created_at__date=date_filter)

    return render(request, 'portfolio/admin/payments.html', {'payments': payments})


@require_POST
@login_required
def email_invoice(request, payment_id):
    payment = get_object_or_404(Payment, pk=payment_id)
    html = render_to_string('portfolio/invoice.html', {'payment': payment})
    pdf = pdfkit.from_string(html, False)

    email = EmailMessage(
        subject='Your Invoice from Academeo',
        body='Attached is your invoice.',
        from_email='noreply@academeo.com',
        to=[payment.user.email],
    )
    email.attach(f"Invoice-{payment.invoice_number()}.pdf",
                 pdf, "application/pdf")
    email.send()

    payment.invoice_emailed_on = timezone.now()
    payment.save()
    messages.success(request, "Invoice emailed successfully.")
    return redirect(request.META.get('HTTP_REFERER', '/'))


@login_required
def upload_profile_photo(request):
    if request.method == 'POST':
        # Check for both 'profile_photo' (from form) and 'cropped_image' (from cropper)
        image_file = request.FILES.get(
            'profile_photo') or request.FILES.get('cropped_image')

        if image_file:
            user_profile = get_or_create_user_profile(request.user)
            user_profile.profile_photo.save('profile.png', image_file)
            user_profile.save()

            # If it's an AJAX request, return JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success'})
            else:
                # Regular form submission, redirect back to profile
                from django.shortcuts import redirect
                return redirect('user_profile')

        # Handle error cases
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'status': 'failed', 'error': 'No image received'}, status=400)
        else:
            from django.contrib import messages
            from django.shortcuts import redirect
            messages.error(request, 'Please select an image to upload.')
            return redirect('user_profile')

    # Invalid request method
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'status': 'failed', 'error': 'Invalid request'}, status=400)
    else:
        from django.shortcuts import redirect
        return redirect('user_profile')


def check_availability(request):
    """Check if username or email is available for registration"""
    field = request.GET.get('field')
    value = request.GET.get('value')

    if not field or not value:
        return JsonResponse({'error': 'Missing field or value parameter'}, status=400)

    # Clean the value
    value = value.strip()

    if field == 'username':
        if len(value) < 3:
            return JsonResponse({'available': False, 'error': 'Username must be at least 3 characters'})
        exists = User.objects.filter(username=value).exists()
    elif field == 'email':
        if len(value) < 5 or '@' not in value:
            return JsonResponse({'available': False, 'error': 'Invalid email format'})
        exists = User.objects.filter(email=value).exists()
    else:
        return JsonResponse({'error': 'Invalid field parameter'}, status=400)

    return JsonResponse({
        'available': not exists,
        'field': field,
        'value': value
    })


def verify_razorpay_signature(order_id, payment_id, signature, secret):
    """Verify Razorpay payment signature for security"""
    try:
        # Create the signature string
        message = f"{order_id}|{payment_id}"

        # Generate expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        print(f"[RAZORPAY DEBUG] order_id: {order_id}")
        print(f"[RAZORPAY DEBUG] payment_id: {payment_id}")
        print(f"[RAZORPAY DEBUG] signature (from Razorpay): {signature}")
        print(
            f"[RAZORPAY DEBUG] expected_signature (calculated): {expected_signature}")
        print(f"[RAZORPAY DEBUG] secret used: {secret}")

        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        print(f"[RAZORPAY DEBUG] Exception in verify_razorpay_signature: {e}")
        return False


@csrf_exempt
@require_POST
@login_required
def payment_success(request):
    order_id = request.POST.get('razorpay_order_id')
    payment_id = request.POST.get('razorpay_payment_id')
    signature = request.POST.get('razorpay_signature')

    print(
        f"[RAZORPAY DEBUG] POST data: order_id={order_id}, payment_id={payment_id}, signature={signature}")
    print(
        f"[RAZORPAY DEBUG] Using secret: {getattr(settings, 'RAZORPAY_API_SECRET', None)}")

    # SECURITY FIX: Verify payment signature
    if not verify_razorpay_signature(order_id, payment_id, signature, settings.RAZORPAY_API_SECRET):
        print("[RAZORPAY DEBUG] Payment verification failed!")
        messages.error(
            request, "Payment verification failed. Please contact support.")
        return redirect('user_profile')

    # Determine amount based on user type
    user_profile = get_or_create_user_profile(request.user)
    if user_profile.user_type == 'agent':
        amount = 69900  # ₹699 for agents
    else:
        amount = 149900  # ₹1,499 for normal users

    # Save payment
    payment = Payment.objects.create(
        user=request.user,
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=signature,
        amount=amount
    )

    # Auto-send invoice
    context = {
        'payment': payment,
        'user': request.user,
        'amount_rupees': payment.amount / 100,
    }
    html = render_to_string('portfolio/invoice.html', context)

    try:
        # Try to generate PDF invoice (with fallback)
        if hasattr(settings, 'WKHTMLTOPDF_CMD'):
            config = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_CMD)
        else:
            # Fallback for different OS
            import platform
            if platform.system() == 'Windows':
                config = pdfkit.configuration(
                    wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe')
            else:
                config = None  # Use system default

        pdf = pdfkit.from_string(html, False, configuration=config)
    except Exception as e:
        # Fallback: send HTML email if PDF generation fails
        pdf = None
        print(f"PDF generation failed: {e}")

    email = EmailMessage(
        subject=f"Your Invoice - INV-{payment.id}",
        body="Thank you for your payment. Your invoice is attached." if pdf else html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[request.user.email]
    )

    if pdf:
        email.attach(f"invoice_{payment.id}.pdf", pdf, 'application/pdf')

    try:
        email.send()
        payment.invoice_emailed_on = timezone.now()
        payment.save()
    except Exception as e:
        print(f"Email sending failed: {e}")

    # REMOVED: Commission logic (no longer needed)
    # Track referral conversion only (no payment calculation)
    referral = Referral.objects.filter(
        referred=request.user, is_converted=False).first()
    if referral:
        referral.is_converted = True
        referral.converted_on = timezone.now()
        referral.save()

    # Mark portfolio as paid
    portfolio = StudentPortfolio.objects.filter(
        user=request.user, status='completed').first()
    if portfolio and not portfolio.is_paid:
        portfolio.is_paid = True
        portfolio.save()

    # Update user limits
    try:
        with transaction.atomic():
            profile = UserProfile.objects.select_for_update().get(user=request.user)
            profile.max_template_changes += 10  # Increase template changes
            profile.portfolios_remaining += 3   # Add portfolio slots
            profile.save(update_fields=[
                         "max_template_changes", "portfolios_remaining"])

    except UserProfile.DoesNotExist:
        messages.error(request, "User profile not found.")
        return redirect('home')

    messages.success(
        request, "Payment successful! Your portfolio is unlocked. Invoice sent to your email.")
    return redirect('user_profile')


@login_required
def initiate_payment(request):
    user_profile = get_or_create_user_profile(request.user)
    if user_profile.user_type == 'agent':
        amount = 69900
        display_amount = 699
    else:
        amount = 149900
        display_amount = 1499

    # Handle coupon POST
    if request.method == 'POST':
        coupon = request.POST.get('coupon_code', '').strip()
        if coupon == 'FREE100':
            # Directly unlock portfolio for free
            # Save a zero-amount payment record
            payment = Payment.objects.create(
                user=request.user,
                razorpay_order_id='COUPON-FREE100',
                razorpay_payment_id='COUPON-FREE100',
                razorpay_signature='COUPON-FREE100',
                amount=0
            )
            # Mark portfolio as paid
            portfolio = StudentPortfolio.objects.filter(
                user=request.user, status='completed').first()
            if portfolio and not portfolio.is_paid:
                portfolio.is_paid = True
                portfolio.save()
            # Update user limits
            try:
                with transaction.atomic():
                    profile = UserProfile.objects.select_for_update().get(user=request.user)
                    profile.max_template_changes += 10
                    profile.portfolios_remaining += 3
                    profile.save(update_fields=[
                                 "max_template_changes", "portfolios_remaining"])
            except UserProfile.DoesNotExist:
                messages.error(request, "User profile not found.")
                return redirect('home')
            messages.success(
                request, "Coupon applied! Your portfolio is unlocked for free.")
            return redirect('user_profile')
        else:
            messages.error(request, "Invalid coupon code.")

    client = razorpay.Client(
        auth=(settings.RAZORPAY_API_KEY, settings.RAZORPAY_API_SECRET))
    currency = "INR"
    payment_data = {
        "amount": amount,
        "currency": currency,
        "payment_capture": '1'
    }
    order = client.order.create(data=payment_data)
    context = {
        "order_id": order['id'],
        "amount": display_amount,
        "amount_paise": amount,
        "api_key": settings.RAZORPAY_API_KEY,
        "user": request.user,
        "user_type": user_profile.user_type,
    }
    return render(request, "portfolio/payment_page.html", context)


@login_required
def portfolio_preview_view(request, slug):
    portfolio = get_object_or_404(
        StudentPortfolio, slug=slug, user=request.user)

    # FIXED: Allow preview for completed portfolios, require payment only for download
    if portfolio.status != 'completed':
        messages.error(
            request, "Please complete your portfolio before previewing.")
        return redirect('user_profile')

    try:
        user_profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        user_profile = None

    # Load ALL portfolio data for preview
    education = Education.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    experience = Experience.objects.filter(
        portfolio=portfolio).order_by('-start_year')
    skills = Skill.objects.filter(portfolio=portfolio).order_by('name')
    projects = Project.objects.filter(portfolio=portfolio).order_by('-id')
    certifications = Certification.objects.filter(
        portfolio=portfolio).order_by('-issue_year')
    languages = Language.objects.filter(portfolio=portfolio).order_by('name')
    hobbies = Hobby.objects.filter(portfolio=portfolio).order_by('name')
    summary = Summary.objects.filter(portfolio=portfolio).first()

    # Debug: Print data to console to verify it's being loaded
    print(
        f"=== DEBUG: Portfolio preview data for {portfolio.user.username} ===")
    print(f"Template: {portfolio.template.template_file}")
    print(f"Education count: {education.count()}")
    print(f"Experience count: {experience.count()}")
    print(f"Skills count: {skills.count()}")
    for skill in skills:
        print(f"  - {skill.name} ({skill.level})")
    print(f"Projects count: {projects.count()}")
    print(f"Certifications count: {certifications.count()}")
    print(f"Languages count: {languages.count()}")
    for lang in languages:
        print(f"  - {lang.name} ({lang.proficiency})")
    print(f"Hobbies count: {hobbies.count()}")
    for hobby in hobbies:
        print(f"  - {hobby.name}")
    print(f"Summary: {summary.content if summary else 'None'}")
    print(f"=== END DEBUG ===")

    # Process projects to split technologies for template
    processed_projects = []
    for project in projects:
        project_dict = {
            'title': project.title,
            'description': project.description,
            'link': project.link,
            'technologies_used': project.technologies_used,
            'technologies_list': [tech.strip() for tech in project.technologies_used.split(',')] if project.technologies_used else [],
            'project_type': project.project_type,
        }
        processed_projects.append(project_dict)

    # Context for the portfolio template
    context = {
        'portfolio': portfolio,
        'user': request.user,  # Add user object for template access
        'user_profile': user_profile,
        'education': education,
        'experience': experience,
        'skills': skills,
        'projects': processed_projects,  # Use processed projects with split technologies
        'certifications': certifications,
        'languages': languages,
        'hobbies': hobbies,
        'summary': summary,
        # Add alternative names for template compatibility
        'education_items': education,
        'experience_items': experience,
        'skill_items': skills,
        'project_items': processed_projects,  # Use processed projects here too
        'certification_items': certifications,
        'language_items': languages,
        'hobby_items': hobbies,
        # Add preview context flag
        'is_preview': True,
        'show_navigation': True,
    }

    # Use the template file with proper path prefix
    if portfolio.template and portfolio.template.template_file:
        template_name = f"portfolio/templates/{portfolio.template.template_file}"
    else:
        # Fallback to default template if no template is set
        template_name = 'portfolio/templates/portfolio1.html'

    return render(request, template_name, context)


@login_required
def user_profile(request):
    try:
        user_profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'first_name': request.user.first_name or '',
                'last_name': request.user.last_name or '',
                'email': request.user.email or '',
                'address': '',
                'contact': '',
                'pin_code': '',
            }
        )
        if created:
            messages.info(
                request, "Your profile has been created successfully")

        completed_portfolio = StudentPortfolio.objects.filter(
            user=request.user, status='completed').first()
        in_progress_portfolio = StudentPortfolio.objects.filter(
            user=request.user, status='in_progress').first()

        # Check if user has paid (either has payment record or is agent/student)
        has_paid = False
        if user_profile.user_type in ['agent', 'student']:
            has_paid = True
        else:
            # For normal users, check if they have any payment record
            has_paid = Payment.objects.filter(user=request.user).exists()

        template_changes_left = max(
            user_profile.max_template_changes - user_profile.template_change_count,
            0
        )

        fields_to_check = [
            user_profile.first_name,
            user_profile.last_name,
            user_profile.email,
            user_profile.contact,
            user_profile.address,
            user_profile.profile_photo,
            user_profile.resume,
        ]
        filled_fields = sum(1 for field in fields_to_check if field)
        total_fields = len(fields_to_check)
        profile_completion = int((filled_fields / total_fields) * 100)
        # Calculate dashoffset for template (fixes template math error)
        profile_completion_dashoffset = 176 - (profile_completion * 1.76)

        missing_fields = [
            name for name, field in zip(
                ['First Name', 'Last Name', 'Email', 'Contact',
                    'Address', 'Profile Photo', 'Resume'],
                fields_to_check
            ) if not field
        ]

        # Create completion fields for modern template
        completion_fields = []
        field_data = [
            ('First Name', user_profile.first_name,
             'fa-check-circle' if user_profile.first_name else 'fa-times-circle'),
            ('Last Name', user_profile.last_name,
             'fa-check-circle' if user_profile.last_name else 'fa-times-circle'),
            ('Email', user_profile.email,
             'fa-check-circle' if user_profile.email else 'fa-times-circle'),
            ('Contact', user_profile.contact,
             'fa-check-circle' if user_profile.contact else 'fa-times-circle'),
            ('Address', user_profile.address,
             'fa-check-circle' if user_profile.address else 'fa-times-circle'),
            ('Profile Photo', user_profile.profile_photo,
             'fa-check-circle' if user_profile.profile_photo else 'fa-times-circle'),
            ('Resume', user_profile.resume,
             'fa-check-circle' if user_profile.resume else 'fa-times-circle'),
        ]

        for name, value, icon in field_data:
            completion_fields.append({
                'name': name,
                'status': 'completed' if value else 'incomplete',
                'icon': icon
            })

        # Get payment history
        payments = Payment.objects.filter(
            user=request.user).order_by('-created_at')

        form1 = PersonalInfoForm1(instance=user_profile)
        form2 = PersonalInfoForm2(instance=user_profile)

        # Calculate profile update time for display
        from django.utils import timezone
        from datetime import timedelta

        profile_update_time = user_profile.updated_at or user_profile.created_at
        if profile_update_time:
            now = timezone.now()
            time_diff = now - profile_update_time

            if time_diff.days > 0:
                if time_diff.days == 1:
                    profile_update_text = "1 day ago"
                else:
                    profile_update_text = f"{time_diff.days} days ago"
            elif time_diff.seconds >= 3600:  # More than 1 hour
                hours = time_diff.seconds // 3600
                if hours == 1:
                    profile_update_text = "1 hour ago"
                else:
                    profile_update_text = f"{hours} hours ago"
            elif time_diff.seconds >= 60:  # More than 1 minute
                minutes = time_diff.seconds // 60
                if minutes == 1:
                    profile_update_text = "1 minute ago"
                else:
                    profile_update_text = f"{minutes} minutes ago"
            else:
                profile_update_text = "Just now"
        else:
            profile_update_text = "Recently"

        context = {
            'user_profile': user_profile,
            'portfolio': completed_portfolio,
            'in_progress_portfolio': in_progress_portfolio,
            'form1': form1,
            'form2': form2,
            'template_changes_left': template_changes_left,
            'has_portfolio': bool(completed_portfolio or in_progress_portfolio),
            'has_paid': has_paid,
            'profile_completion': profile_completion,
            'filled_fields': filled_fields,
            'total_fields': total_fields,
            'missing_fields': missing_fields,
            'completion_fields': completion_fields,
            'payments': payments,
            'profile_completion_dashoffset': profile_completion_dashoffset,
            'profile_update_text': profile_update_text,
        }

        return render(request, 'portfolio/modern_profile.html', context)

    except Exception as e:
        # Log the full exception details for debugging
        import traceback
        print(f"========== EXCEPTION IN USER_PROFILE VIEW ==========")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        print(f"Full traceback:")
        print(traceback.format_exc())
        print(f"User: {request.user}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"========== END EXCEPTION DEBUG ==========")

        messages.error(request, f"Error loading your profile: {str(e)}")
        return redirect('home')


@login_required
@user_passes_test(lambda u: u.is_staff)
def create_missing_profiles(request):
    """
    Create UserProfile objects for any User objects that don't have profiles.
    This is useful for fixing cases where Django User objects exist but UserProfile objects are missing.
    """
    users_without_profiles = User.objects.filter(userprofile__isnull=True)
    created_count = 0

    for user in users_without_profiles:
        try:
            # Create a basic UserProfile for the user
            UserProfile.objects.create(
                user=user,
                first_name=user.first_name or '',
                last_name=user.last_name or '',
                email=user.email or '',
                address='',
                contact='',
                pin_code='',
                user_type='normal'  # Default to normal user type
            )
            created_count += 1
        except Exception as e:
            # Log any errors but continue with other users
            messages.error(
                request, f"Error creating profile for user {user.username}: {str(e)}")

    if created_count > 0:
        messages.success(
            request, f"Successfully created {created_count} missing user profiles.")
    else:
        messages.info(
            request, "No missing user profiles found. All users already have profiles.")

    return redirect('admin_dashboard')


@login_required
def complete_purchase(request):
    """Handle purchase completion for simulation/testing purposes"""
    if request.method == 'POST':
        # Create a payment record for simulation
        from .models import Payment
        import uuid

        payment = Payment.objects.create(
            user=request.user,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
            razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}",
            razorpay_signature=f"sig_{uuid.uuid4().hex[:12]}",
            amount=149900  # ₹499 in paise
        )

        messages.success(request, 'Purchase completed successfully!')
        return redirect('user_profile')

    return redirect('user_profile')


# Agent approval system views
@login_required
@user_passes_test(lambda u: u.is_staff)
def admin_student_approvals(request):
    """Admin view to see and approve student invitations from agents"""
    pending_invitations = StudentInvitation.objects.filter(
        status='pending'
    ).select_related('agent__user').order_by('-created_at')

    approved_invitations = StudentInvitation.objects.filter(
        status='approved'
    ).select_related('agent__user', 'admin_approved_by').order_by('-admin_approved_at')[:10]

    context = {
        'pending_invitations': pending_invitations,
        'approved_invitations': approved_invitations,
    }

    return render(request, 'portfolio/admin/admin_student_approvals.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def admin_approve_student(request, invitation_id):
    """Admin action to approve or reject a student invitation"""
    invitation = get_object_or_404(StudentInvitation, id=invitation_id)

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'approve':
            # Create the student user account
            try:
                # Generate a random password for the student
                temp_password = get_random_string(12)

                # Create the user account
                student_user = User.objects.create_user(
                    username=invitation.student_username,
                    email=invitation.student_email,
                    password=temp_password,
                    first_name=invitation.student_first_name,
                    last_name=invitation.student_last_name,
                    is_active=True
                )

                # Create student profile
                student_profile = UserProfile.objects.create(
                    user=student_user,
                    email=invitation.student_email,
                    first_name=invitation.student_first_name,
                    last_name=invitation.student_last_name,
                    user_type='student',
                    created_by=invitation.agent,
                    terms_accepted=False,  # Agent-created users need to accept terms on first login
                    terms_accepted_at=None
                )

                # Update invitation status
                invitation.status = 'approved'
                invitation.admin_approved_at = timezone.now()
                invitation.admin_approved_by = request.user
                invitation.student_user = student_user
                invitation.save()

                # Send email to student with login details
                try:
                    send_mail(
                        subject='Your Student Account Has Been Approved',
                        message=f'''Hello {invitation.student_first_name},

Your student account has been approved by our admin team.

Login Details:
Username: {invitation.student_username}
Temporary Password: {temp_password}

Please log in at: http://your-domain.com/login/
Please change your password after first login.

Best regards,
PortfolioPro Team''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[invitation.student_email],
                        fail_silently=False,
                    )
                except Exception as e:
                    messages.warning(
                        request, f"Student approved but email failed: {str(e)}")

                messages.success(
                    request, f'Student {invitation.student_first_name} {invitation.student_last_name} has been approved successfully!')

            except IntegrityError:
                messages.error(
                    request, f'Username {invitation.student_username} already exists. Please ask the agent to use a different username.')
            except Exception as e:
                messages.error(
                    request, f'Error creating student account: {str(e)}')

        elif action == 'reject':
            rejection_reason = request.POST.get('rejection_reason', '')
            invitation.status = 'rejected'
            invitation.rejection_reason = rejection_reason
            invitation.save()

            messages.success(
                request, f'Student invitation for {invitation.student_first_name} {invitation.student_last_name} has been rejected.')

    return redirect('admin_student_approvals')


@login_required
def agent_bulk_payment(request):
    """Agent view to make bulk payment for approved students"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        messages.error(request, "Agent access required")
        return redirect('home')

    # Get approved students that haven't been paid for
    approved_invitations = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='approved'
    ).exclude(
        agent_payments__status='completed'
    )

    if request.method == 'POST':
        form = AgentBulkPaymentForm(request.POST)
        if form.is_valid() and approved_invitations.exists():
            student_count = approved_invitations.count()
            total_amount = student_count * 699  # ₹699 per student

            # Create payment record
            payment = AgentPayment.objects.create(
                agent=user.userprofile,
                amount=total_amount,
                student_count=student_count,
                per_student_cost=699.00,
                status='pending'
            )

            # Here you would integrate with Razorpay for actual payment
            # For now, we'll simulate successful payment
            payment.status = 'completed'
            payment.razorpay_order_id = f"order_{uuid.uuid4().hex[:12]}"
            payment.razorpay_payment_id = f"pay_{uuid.uuid4().hex[:12]}"
            payment.save()

            messages.success(
                request, f'Payment of ₹{total_amount} completed successfully for {student_count} students!')
            return redirect('agent_payment_success')
    else:
        form = AgentBulkPaymentForm()

    student_count = approved_invitations.count()
    total_amount = student_count * 699

    context = {
        'form': form,
        'approved_invitations': approved_invitations,
        'student_count': student_count,
        'total_amount': total_amount,
        'per_student_cost': 699,
    }

    return render(request, 'portfolio/agent_bulk_payment.html', context)


@login_required
def agent_payment_success(request):
    """Agent payment success page"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        messages.error(request, "Agent access required")
        return redirect('home')

    # Get recent successful payments
    recent_payments = AgentPayment.objects.filter(
        agent=user.userprofile,
        status='completed'
    ).order_by('-created_at')[:5]

    context = {
        'recent_payments': recent_payments,
    }

    return render(request, 'portfolio/agent_payment_success.html', context)


@login_required
def submit_success_story(request):
    if request.method == 'POST':
        form = SuccessStoryForm(request.POST)
        if form.is_valid():
            story = form.save(commit=False)
            story.user = request.user
            story.save()
            return redirect('success_story_thankyou')  # Add this template
    else:
        form = SuccessStoryForm()
    return render(request, 'portfolio/submit_success_story.html', {'form': form})


@user_passes_test(lambda u: u.is_superuser)
def approve_success_stories(request):
    stories = SuccessStory.objects.all().order_by('-created_at')
    return render(request, 'portfolio/admin_approve_stories.html', {'stories': stories})


@user_passes_test(lambda u: u.is_superuser)
def toggle_story_approval(request, story_id):
    story = SuccessStory.objects.get(id=story_id)
    story.is_approved = not story.is_approved
    story.save()
    return redirect('approve_success_stories')


def template_preview(request, template_id):
    """Show a portfolio template with dummy data for preview"""
    template = get_object_or_404(
        PortfolioTemplate, id=template_id, is_pdf=False)

    # Create dummy data for preview
    dummy_user_profile = {
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john.doe@example.com',
        'contact': '+91 98765 43210',
        'address': 'Mumbai, Maharashtra, India',
        'pin_code': '400001',
        'github_link': 'https://github.com/johndoe',
        'facebook_link': 'https://facebook.com/johndoe',
        'instagram_link': 'https://instagram.com/johndoe',
        'other_social_link': 'https://linkedin.com/in/johndoe',
        'certifications': 'AWS Certified Developer, Google Cloud Professional',
        'languages': 'English (Fluent), Hindi (Native), Spanish (Intermediate)',
        'hobbies': 'Photography, Hiking, Reading Tech Blogs',
        'summary': 'Passionate software developer with 3+ years of experience in web development. Specialized in React, Node.js, and Python. Always eager to learn new technologies and solve complex problems.',
        'extracurricular': 'Tech Blog Writer, Open Source Contributor, Coding Competition Winner'
    }

    dummy_education = [
        {
            'institution': 'Mumbai University',
            'degree': 'Bachelor of Engineering in Computer Science',
            'field_of_study': 'Computer Science',
            'start_date': '2019-08-01',
            'end_date': '2023-05-30',
            'grade': '8.5/10',
            'description': 'Focused on software engineering, algorithms, and web technologies. Graduated with distinction.'
        },
        {
            'institution': 'St. Xavier\'s College',
            'degree': 'Higher Secondary Education',
            'field_of_study': 'Science',
            'start_date': '2017-06-01',
            'end_date': '2019-05-30',
            'grade': '85%',
            'description': 'Specialized in Physics, Chemistry, and Mathematics.'
        }
    ]

    dummy_experience = [
        {
            'company': 'TechCorp Solutions',
            'position': 'Senior Software Developer',
            'location': 'Mumbai, India',
            'start_date': '2023-06-01',
            'end_date': None,
            'currently_working': True,
            'description': 'Leading development of enterprise web applications using React and Node.js. Mentoring junior developers and implementing best practices.'
        },
        {
            'company': 'StartUp Innovations',
            'position': 'Full Stack Developer',
            'location': 'Bangalore, India',
            'start_date': '2022-01-15',
            'end_date': '2023-05-30',
            'currently_working': False,
            'description': 'Developed and maintained multiple web applications. Worked with React, Python Django, and PostgreSQL.'
        }
    ]

    dummy_projects = [
        {
            'title': 'E-Commerce Platform',
            'description': 'A full-stack e-commerce platform built with React, Node.js, and MongoDB. Features include user authentication, product management, payment integration, and admin dashboard.',
            'link': 'https://github.com/johndoe/ecommerce-platform',
            'technologies_used': 'React, Node.js, MongoDB, Express, Stripe',
            'project_type': 'personal',
            'currently_working': False
        },
        {
            'title': 'Task Management App',
            'description': 'A collaborative task management application with real-time updates, team collaboration, and progress tracking.',
            'link': 'https://github.com/johndoe/task-manager',
            'technologies_used': 'React, Firebase, Material-UI',
            'project_type': 'personal',
            'currently_working': True
        },
        {
            'title': 'Weather Dashboard',
            'description': 'A weather application that displays current weather and forecasts using OpenWeatherMap API.',
            'link': 'https://github.com/johndoe/weather-app',
            'technologies_used': 'JavaScript, HTML, CSS, OpenWeatherMap API',
            'project_type': 'academic',
            'currently_working': False
        }
    ]

    dummy_skills = [
        {'name': 'JavaScript', 'level': 'Advanced'},
        {'name': 'React', 'level': 'Advanced'},
        {'name': 'Node.js', 'level': 'Intermediate'},
        {'name': 'Python', 'level': 'Intermediate'},
        {'name': 'HTML/CSS', 'level': 'Advanced'},
        {'name': 'MongoDB', 'level': 'Intermediate'},
        {'name': 'Git', 'level': 'Advanced'},
        {'name': 'Docker', 'level': 'Beginner'}
    ]

    # Create context with dummy data
    context = {
        'portfolio': None,  # No actual portfolio for preview
        'user': None,  # No actual user for preview
        'user_profile': dummy_user_profile,
        'education': dummy_education,
        'experience': dummy_experience,
        'skills': dummy_skills,
        'projects': dummy_projects,
        'certifications': dummy_user_profile['certifications'],
        'languages': dummy_user_profile['languages'],
        'hobbies': dummy_user_profile['hobbies'],
        'summary': dummy_user_profile['summary'],
        # Add alternative names for template compatibility
        'education_items': dummy_education,
        'experience_items': dummy_experience,
        'skill_items': dummy_skills,
        'project_items': dummy_projects,
        'certification_items': dummy_user_profile['certifications'],
        'language_items': dummy_user_profile['languages'],
        'hobby_items': dummy_user_profile['hobbies'],
        # Preview mode
        'is_preview': True,
        'show_navigation': False,
        'template': template,
    }

    # Use the template file
    template_name = f"portfolio/templates/{template.template_file}"

    return render(request, template_name, context)


def success_stories_page(request):
    """Dedicated page to display all approved success stories"""
    from django.core.paginator import Paginator

    # Get all approved success stories, ordered by most recent first
    success_stories = SuccessStory.objects.filter(
        is_approved=True).order_by('-created_at')

    # Paginate the stories (12 per page)
    paginator = Paginator(success_stories, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'success_stories': page_obj,
        'total_stories': success_stories.count(),
    }

    return render(request, 'portfolio/success_stories_page.html', context)


@login_required
def agent_notifications_api(request):
    """API endpoint for real-time agent notifications"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    # Get unread notifications
    notifications = AdminNotification.objects.filter(
        is_read=False,
        notification_type__in=['student_invitation',
                               'agent_payment', 'student_payment']
    ).filter(
        Q(student_invitation__agent=user.userprofile) |
        Q(agent_payment__agent=user.userprofile) |
        Q(student_payment__agent=user.userprofile)
    ).order_by('-created_at')[:10]

    # Get dashboard stats
    pending_invitations = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='pending'
    ).count()

    students_needing_payment = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status='approved'
    ).exclude(
        agent_payments__status='completed'
    ).count()

    return JsonResponse({
        'notifications': [{
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'created_at': n.created_at.isoformat(),
        } for n in notifications],
        'dashboard_stats': {
            'pending_invitations': pending_invitations,
            'students_needing_payment': students_needing_payment,
        }
    })


@login_required
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    try:
        notification = AdminNotification.objects.get(
            id=notification_id,
            student_invitation__agent=user.userprofile
        )
        notification.is_read = True
        notification.save()
        return JsonResponse({'success': True})
    except AdminNotification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)


@login_required
def agent_analytics(request):
    """Enhanced analytics dashboard for agents"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        messages.error(request, "Agent access required")
        return redirect('home')

    # Date range filtering
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')

    # Base querysets
    invitations = StudentInvitation.objects.filter(agent=user.userprofile)
    payments = AgentPayment.objects.filter(agent=user.userprofile)
    referrals = Referral.objects.filter(referrer=user)

    # Apply date filters if provided
    if from_date:
        invitations = invitations.filter(created_at__date__gte=from_date)
        payments = payments.filter(created_at__date__gte=from_date)
        referrals = referrals.filter(registered_on__date__gte=from_date)

    if to_date:
        invitations = invitations.filter(created_at__date__lte=to_date)
        payments = payments.filter(created_at__date__lte=to_date)
        referrals = referrals.filter(registered_on__date__lte=to_date)

    # Monthly trends
    from django.db.models import Count, Sum
    from django.db.models.functions import TruncMonth

    monthly_invitations = invitations.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')

    monthly_payments = payments.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('month')

    # Performance metrics
    total_invitations = invitations.count()
    approved_invitations = invitations.filter(status='approved').count()
    conversion_rate = (approved_invitations /
                       total_invitations * 100) if total_invitations > 0 else 0

    total_payments = payments.filter(status='completed').aggregate(
        total=Sum('amount')
    )['total'] or 0

    avg_approval_time = invitations.filter(
        status='approved',
        admin_approved_at__isnull=False
    ).aggregate(
        avg_time=Avg(F('admin_approved_at') - F('created_at'))
    )['avg_time']

    context = {
        'user': user,
        'monthly_invitations': list(monthly_invitations),
        'monthly_payments': list(monthly_payments),
        'total_invitations': total_invitations,
        'approved_invitations': approved_invitations,
        'conversion_rate': round(conversion_rate, 1),
        'total_payments': total_payments,
        'avg_approval_time': avg_approval_time,
        'from_date': from_date,
        'to_date': to_date,
    }

    return render(request, 'portfolio/agent_analytics.html', context)


@login_required
def agent_student_communication(request):
    """Agent communication center for managing student interactions"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        messages.error(request, "Agent access required")
        return redirect('home')

    # Get all students managed by this agent
    students = StudentInvitation.objects.filter(
        agent=user.userprofile,
        status__in=['approved', 'activated']
    ).select_related('student_user__userprofile')

    # Get student portfolios for tracking progress
    student_portfolios = StudentPortfolio.objects.filter(
        user__userprofile__created_by=user.userprofile
    ).select_related('user__userprofile')

    # Group students by status
    active_students = students.filter(status='activated')
    approved_students = students.filter(status='approved')

    # Get recent activities
    from django.utils import timezone
    from datetime import timedelta

    recent_activities = []

    # Portfolio updates in last 7 days
    recent_portfolios = student_portfolios.filter(
        updated_at__gte=timezone.now() - timedelta(days=7)
    )

    for portfolio in recent_portfolios:
        recent_activities.append({
            'type': 'portfolio_update',
            'student': portfolio.user.userprofile,
            'message': f'Updated portfolio section: {portfolio.get_status_display()}',
            'timestamp': portfolio.updated_at,
        })

    # Sort activities by timestamp
    recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)

    context = {
        'user': user,
        'active_students': active_students,
        'approved_students': approved_students,
        'student_portfolios': student_portfolios,
        'recent_activities': recent_activities[:10],
        'total_students': students.count(),
        'active_students_count': active_students.count(),
        'portfolios_completed': student_portfolios.filter(status='completed').count(),
    }

    return render(request, 'portfolio/agent_student_communication.html', context)


@login_required
def agent_send_bulk_message(request):
    """Send bulk messages to students"""
    user = request.user

    if not hasattr(user, 'userprofile') or user.userprofile.user_type != 'agent':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    if request.method == 'POST':
        message = request.POST.get('message')
        student_ids = request.POST.getlist('student_ids')

        if not message or not student_ids:
            return JsonResponse({'error': 'Message and students required'}, status=400)

        # Get students
        students = StudentInvitation.objects.filter(
            id__in=student_ids,
            agent=user.userprofile,
            status__in=['approved', 'activated']
        )

        # Send messages (implement your messaging system here)
        sent_count = 0
        for student in students:
            if student.student_user and student.student_user.email:
                try:
                    # Send email notification
                    send_mail(
                        subject=f'Message from your Agent - {user.userprofile.first_name}',
                        message=f'''Hello {student.student_first_name},

{message}

Best regards,
{user.userprofile.first_name}
Your Portfolio Agent''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[student.student_user.email],
                        fail_silently=True,
                    )
                    sent_count += 1
                except Exception as e:
                    print(
                        f"Failed to send message to {student.student_user.email}: {e}")

        return JsonResponse({
            'success': True,
            'message': f'Message sent to {sent_count} students',
            'sent_count': sent_count
        })

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@login_required
def accept_terms(request):
    """
    View for users to accept terms and conditions.
    This is required for users created by agents who haven't seen the terms during registration.
    """
    if request.method == "POST":
        # Mark terms as accepted
        user_profile = request.user.userprofile
        user_profile.terms_accepted = True
        user_profile.terms_accepted_at = timezone.now()
        user_profile.save()

        # Redirect to home page or dashboard
        messages.success(
            request, "Terms and conditions accepted successfully!")
        # or wherever you want to redirect after acceptance
        return redirect('home')

    return render(request, "portfolio/accept_terms.html")


@login_required
@require_POST
def suggest_project_description_view(request, pk):
    """
    Returns intelligent project description suggestions based on project type and technologies.
    This is a free, template-based suggestion system.
    """
    import json
    from django.http import JsonResponse
    import random

    # Get the portfolio to verify ownership
    portfolio = get_object_or_404(StudentPortfolio, pk=pk, user=request.user)

    try:
        data = json.loads(request.body.decode('utf-8'))
        project_title = data.get('title', '').strip()
        project_type = data.get('project_type', '').strip()
        technologies = data.get('technologies', '').strip()
        current_description = data.get('description', '').strip()

        # Technology-based templates
        tech_templates = {
            'python': [
                "Developed a {project_type} using Python, implementing {features}. The project demonstrates proficiency in Python programming and software development best practices.",
                "Built a {project_type} with Python, featuring {features}. This project showcases problem-solving skills and technical implementation capabilities.",
                "Created a scalable {project_type} using Python, incorporating {features}. Demonstrates expertise in backend development and system architecture."
            ],
            'javascript': [
                "Created a {project_type} using JavaScript, incorporating {features}. The project highlights front-end development skills and user experience design.",
                "Developed an interactive {project_type} with JavaScript, featuring {features}. Demonstrates modern web development practices and responsive design.",
                "Built a dynamic {project_type} using JavaScript, implementing {features}. Shows proficiency in client-side programming and user interface development."
            ],
            'react': [
                "Built a {project_type} using React.js, implementing {features}. The project showcases modern front-end development and component-based architecture.",
                "Developed a responsive {project_type} with React, featuring {features}. Demonstrates proficiency in modern JavaScript frameworks and UI/UX design.",
                "Created a user-friendly {project_type} using React, incorporating {features}. Highlights expertise in state management and modern web applications."
            ],
            'node': [
                "Created a {project_type} using Node.js, implementing {features}. The project demonstrates full-stack development capabilities and server-side programming.",
                "Built a scalable {project_type} with Node.js, featuring {features}. Shows expertise in backend development and API design.",
                "Developed a high-performance {project_type} using Node.js, incorporating {features}. Demonstrates server-side optimization and microservices architecture."
            ],
            'django': [
                "Developed a {project_type} using Django framework, implementing {features}. The project demonstrates web development skills and database management.",
                "Built a robust {project_type} with Django, featuring {features}. Shows proficiency in Python web frameworks and MVC architecture.",
                "Created a secure {project_type} using Django, incorporating {features}. Highlights expertise in web security and rapid application development."
            ],
            'sql': [
                "Created a {project_type} with SQL database integration, implementing {features}. Demonstrates database design and data management skills.",
                "Built a {project_type} using SQL for data handling, featuring {features}. Shows expertise in database operations and data analysis.",
                "Developed a data-driven {project_type} with SQL, incorporating {features}. Highlights proficiency in data modeling and query optimization."
            ],
            'html': [
                "Developed a {project_type} using HTML/CSS, implementing {features}. The project demonstrates web design skills and front-end development.",
                "Created a responsive {project_type} with HTML/CSS, featuring {features}. Shows proficiency in web standards and user interface design.",
                "Built a cross-browser compatible {project_type} using HTML/CSS, incorporating {features}. Demonstrates attention to detail and accessibility standards."
            ],
            'java': [
                "Developed a {project_type} using Java, implementing {features}. The project demonstrates object-oriented programming and enterprise development skills.",
                "Built a robust {project_type} with Java, featuring {features}. Shows expertise in Java frameworks and application development.",
                "Created a scalable {project_type} using Java, incorporating {features}. Highlights proficiency in enterprise software development and system architecture."
            ],
            'c++': [
                "Developed a {project_type} using C++, implementing {features}. The project demonstrates system programming and performance optimization skills.",
                "Built a high-performance {project_type} with C++, featuring {features}. Shows expertise in memory management and low-level programming.",
                "Created an efficient {project_type} using C++, incorporating {features}. Highlights proficiency in algorithm optimization and system-level development."
            ],
            'php': [
                "Developed a {project_type} using PHP, implementing {features}. The project demonstrates web development skills and server-side scripting.",
                "Built a dynamic {project_type} with PHP, featuring {features}. Shows expertise in content management systems and web applications.",
                "Created a feature-rich {project_type} using PHP, incorporating {features}. Highlights proficiency in web development frameworks and database integration."
            ],
            'angular': [
                "Developed a {project_type} using Angular, implementing {features}. The project demonstrates enterprise-level front-end development and TypeScript proficiency.",
                "Built a scalable {project_type} with Angular, featuring {features}. Shows expertise in component-based architecture and dependency injection.",
                "Created a maintainable {project_type} using Angular, incorporating {features}. Highlights proficiency in modern web frameworks and enterprise applications."
            ],
            'vue': [
                "Developed a {project_type} using Vue.js, implementing {features}. The project demonstrates progressive web framework development and component reusability.",
                "Built a user-friendly {project_type} with Vue.js, featuring {features}. Shows expertise in reactive data binding and modern web development.",
                "Created an intuitive {project_type} using Vue.js, incorporating {features}. Highlights proficiency in front-end frameworks and user experience design."
            ]
        }

        # Project type specific suggestions
        type_suggestions = {
            'personal': [
                "Personal project demonstrating {skills}. Built from concept to completion, showcasing initiative and self-directed learning.",
                "Self-initiated project that showcases {skills}. Developed independently to explore new technologies and solve real-world problems.",
                "Passion project highlighting {skills}. Created to solve a specific problem and demonstrate technical capabilities."
            ],
            'academic': [
                "Academic project completed as part of coursework, demonstrating {skills}. Received positive feedback for technical implementation and documentation.",
                "University project showcasing {skills}. Collaborated with team members to deliver a comprehensive solution within project constraints.",
                "Research project exploring {skills}. Conducted thorough analysis and presented findings to academic community."
            ],
            'freelance': [
                "Freelance project delivered for client, demonstrating {skills}. Successfully met client requirements and delivered on time and within budget.",
                "Client project showcasing {skills}. Worked directly with stakeholders to understand requirements and deliver a professional solution.",
                "Consulting project highlighting {skills}. Provided expert guidance and delivered measurable results for client objectives."
            ],
            'contribution': [
                "Open source contribution to {project_name}, demonstrating {skills}. Actively participated in community development and code review processes.",
                "Contributed to open source project, showcasing {skills}. Collaborated with global developers to improve software quality and functionality.",
                "Community project involving {skills}. Worked with diverse team to create solutions benefiting the broader developer community."
            ],
            'hackathon': [
                "Hackathon project demonstrating {skills}. Developed innovative solution within time constraints, showcasing rapid prototyping abilities.",
                "Competition project showcasing {skills}. Collaborated with team to create winning solution under pressure.",
                "Innovation challenge project highlighting {skills}. Created novel approach to solve complex problem in limited timeframe."
            ],
            'research': [
                "Research project exploring {skills}. Conducted comprehensive analysis and developed novel solutions to complex problems.",
                "Innovation project demonstrating {skills}. Pioneered new approaches and methodologies in the field.",
                "Experimental project showcasing {skills}. Pushed boundaries and explored cutting-edge technologies and concepts."
            ],
            'enterprise': [
                "Enterprise project implementing {skills}. Developed scalable solution for large organization, handling complex business requirements.",
                "Corporate project showcasing {skills}. Worked with cross-functional teams to deliver mission-critical applications.",
                "Business solution project highlighting {skills}. Created robust systems designed for enterprise-level deployment and maintenance."
            ]
        }

        suggestions = []

        # Generate technology-based suggestions
        if technologies:
            tech_list = [tech.strip().lower()
                         for tech in technologies.split(',')]
            for tech in tech_list:
                if tech in tech_templates:
                    features = "modern features and best practices"
                    if len(tech_list) > 1:
                        features = f"integration with {', '.join(tech_list[:3])}"

                    # Take first 2 templates per tech
                    for template in tech_templates[tech][:2]:
                        suggestion = template.format(
                            project_type=project_type or "web application",
                            features=features
                        )
                        suggestions.append(suggestion)

        # Generate project type specific suggestions
        if project_type and project_type in type_suggestions:
            skills = "technical skills and problem-solving abilities"
            if technologies:
                skills = f"proficiency in {', '.join(tech_list[:3])}"

            for template in type_suggestions[project_type]:
                suggestion = template.format(
                    skills=skills,
                    project_name=project_title or "open source project"
                )
                suggestions.append(suggestion)

        # Generate general suggestions
        general_suggestions = [
            f"Developed {project_title or 'a comprehensive project'} that demonstrates technical skills and problem-solving abilities. The project showcases proficiency in modern development practices and attention to detail.",
            f"Built {project_title or 'an innovative solution'} using current technologies and best practices. This project highlights the ability to work independently and deliver high-quality results.",
            f"Created {project_title or 'a functional application'} that addresses real-world challenges. The project demonstrates strong analytical skills and technical implementation capabilities."
        ]

        # Combine and limit suggestions
        all_suggestions = suggestions + general_suggestions
        final_suggestions = list(dict.fromkeys(
            all_suggestions))  # Remove duplicates
        final_suggestions = final_suggestions[:5]  # Limit to 5 suggestions

        # If user has existing description, provide improvement suggestions
        if current_description and len(current_description) > 20:
            improvement_suggestions = [
                f"Enhanced version: {current_description[:1].upper() + current_description[1:]} The project demonstrates strong technical skills and professional development practices.",
                f"Improved description: {current_description[:1].upper() + current_description[1:]} This work showcases problem-solving abilities and attention to detail."
            ]
            final_suggestions = improvement_suggestions[:2] + \
                final_suggestions[:3]

        return JsonResponse({'suggestions': final_suggestions})

    except Exception as e:
        return JsonResponse({'error': 'Could not generate project suggestions.'}, status=400)


@login_required
@require_POST
def ai_chatbot_view(request):
    """
    Enhanced AI Chatbot for portfolio creation help and guidance.
    This is a free, rule-based chatbot system with comprehensive features.
    """
    import json
    from django.http import JsonResponse
    import random

    try:
        data = json.loads(request.body.decode('utf-8'))
        user_message = data.get('message', '').strip().lower()
        current_step = data.get('current_step', '').strip()
        portfolio_id = data.get('portfolio_id', '')

        # Get user's portfolio for context
        portfolio = None
        if portfolio_id:
            try:
                portfolio = StudentPortfolio.objects.get(
                    pk=portfolio_id, user=request.user)
            except StudentPortfolio.DoesNotExist:
                pass

        # Define help responses based on current step
        step_help = {
            'personal_info1': [
                "This is where you enter your basic personal information. Make sure to provide accurate contact details as they'll be visible on your portfolio.",
                "Fill in your name, email, and contact information. These details will be prominently displayed on your portfolio.",
                "Your personal information is the first thing visitors see. Use a professional email address and ensure your contact number is current."
            ],
            'personal_info2': [
                "Add your social media links and additional information. This helps create a complete professional profile.",
                "Include relevant social media profiles like LinkedIn, GitHub, or professional websites.",
                "Social links help recruiters and visitors connect with you professionally. Only include relevant, active profiles."
            ],
            'add_education': [
                "List your educational background in reverse chronological order (most recent first).",
                "Include your degree, institution, and graduation year. You can add multiple education entries.",
                "Education shows your academic foundation. Include relevant certifications and achievements."
            ],
            'add_experience': [
                "Add your work experience, internships, or relevant projects. Focus on achievements and responsibilities.",
                "List experiences in reverse chronological order. Include job titles, companies, and key accomplishments.",
                "Experience demonstrates your practical skills. Use action verbs and quantify achievements when possible."
            ],
            'add_project': [
                "Showcase your technical projects, academic work, or personal initiatives. Include links to live demos or code.",
                "Projects demonstrate your skills in action. Include technologies used, challenges solved, and outcomes achieved.",
                "Choose projects that highlight your best work and relevant skills for your target industry."
            ],
            'add_skill': [
                "List your technical and soft skills. Be honest about proficiency levels - it's better to be accurate than overstate.",
                "Include both technical skills (programming languages, tools) and soft skills (communication, leadership).",
                "Skills should align with your career goals and the positions you're targeting."
            ],
            'add_certification': [
                "Add relevant certifications, courses, or training programs that enhance your qualifications.",
                "Certifications show continuous learning and specialized knowledge in your field.",
                "Include certification dates and issuing organizations for credibility."
            ],
            'add_language': [
                "List languages you speak and your proficiency level. This is valuable for international opportunities.",
                "Be honest about your language proficiency. Include both native and learned languages.",
                "Language skills can be a significant advantage in many industries and roles."
            ],
            'add_hobby': [
                "Share your interests and hobbies that might be relevant to your professional life or show your personality.",
                "Hobbies can demonstrate soft skills like teamwork, creativity, or discipline.",
                "Choose hobbies that complement your professional profile or show well-roundedness."
            ],
            'add_summary': [
                "Write a compelling professional summary that highlights your key strengths and career objectives.",
                "Your summary should be concise (2-3 sentences) and capture what makes you unique.",
                "Focus on your value proposition and what you can bring to potential employers or clients."
            ]
        }

        # Template-specific guidance
        template_guidance = {
            'template1': {
                'name': 'Modern Professional',
                'tips': [
                    "This template is perfect for corporate roles. Use professional photos and formal language.",
                    "The Modern Professional template emphasizes clean design. Keep content concise and impactful.",
                    "This template works best with structured content. Use bullet points and clear sections."
                ],
                'best_for': ['Business', 'Finance', 'Consulting', 'Corporate']
            },
            'template2': {
                'name': 'Creative Portfolio',
                'tips': [
                    "The Creative template is ideal for designers and artists. Showcase visual work prominently.",
                    "Use high-quality images and creative descriptions. Let your personality shine through.",
                    "This template supports multimedia content. Include videos, galleries, and interactive elements."
                ],
                'best_for': ['Design', 'Art', 'Photography', 'Creative']
            },
            'template3': {
                'name': 'Tech Developer',
                'tips': [
                    "Perfect for developers and tech professionals. Highlight technical skills and projects.",
                    "Include code snippets, GitHub links, and technical achievements.",
                    "Focus on problem-solving and technical implementation in your descriptions."
                ],
                'best_for': ['Software Development', 'IT', 'Engineering', 'Data Science']
            }
        }

        # Industry-specific suggestions
        industry_guidance = {
            'technology': {
                'summary': "Tech professionals should highlight technical skills, problem-solving abilities, and project outcomes.",
                'skills': "Focus on programming languages, frameworks, tools, and methodologies.",
                'projects': "Include GitHub links, live demos, and technical challenges solved.",
                'keywords': ['software', 'development', 'programming', 'coding', 'tech', 'it', 'engineering']
            },
            'design': {
                'summary': "Designers should showcase creativity, visual skills, and design thinking process.",
                'skills': "Highlight design tools, creative software, and artistic abilities.",
                'projects': "Include portfolio galleries, case studies, and design process explanations.",
                'keywords': ['design', 'creative', 'art', 'ui', 'ux', 'graphic', 'visual']
            },
            'business': {
                'summary': "Business professionals should emphasize leadership, strategy, and measurable results.",
                'skills': "Focus on management, analysis, communication, and strategic thinking.",
                'projects': "Include business cases, strategic initiatives, and ROI achievements.",
                'keywords': ['business', 'management', 'strategy', 'finance', 'consulting', 'corporate']
            },
            'marketing': {
                'summary': "Marketers should showcase campaign results, audience growth, and brand development.",
                'skills': "Highlight digital marketing, analytics, content creation, and campaign management.",
                'projects': "Include campaign metrics, growth statistics, and brand success stories.",
                'keywords': ['marketing', 'digital', 'campaign', 'brand', 'social media', 'seo']
            },
            'healthcare': {
                'summary': "Healthcare professionals should emphasize patient care, medical expertise, and certifications.",
                'skills': "Focus on medical procedures, patient care, and healthcare technologies.",
                'projects': "Include case studies, research, and patient outcomes.",
                'keywords': ['healthcare', 'medical', 'patient', 'clinical', 'nursing', 'doctor']
            }
        }

        # Resume optimization tips
        resume_optimization = {
            'general': [
                "Use action verbs to start bullet points (e.g., 'Developed', 'Implemented', 'Led')",
                "Quantify achievements with numbers and percentages when possible",
                "Keep descriptions concise but impactful - aim for 1-2 lines per bullet point",
                "Use industry-specific keywords that match job descriptions",
                "Ensure consistent formatting and professional presentation"
            ],
            'technical': [
                "Include specific technologies, frameworks, and tools used",
                "Mention project scale, team size, and technical challenges overcome",
                "Add links to live demos, GitHub repositories, or technical documentation",
                "Highlight problem-solving approaches and innovative solutions",
                "Include performance metrics and optimization results"
            ],
            'creative': [
                "Showcase visual work with high-quality images and galleries",
                "Include design process explanations and creative thinking",
                "Highlight brand development and visual identity work",
                "Add testimonials or client feedback when available",
                "Demonstrate versatility across different design styles and mediums"
            ]
        }

        # SEO and visibility advice
        seo_guidance = {
            'keywords': [
                "Include relevant industry keywords in your summary and project descriptions",
                "Use location-based keywords if targeting specific geographic areas",
                "Include job title variations and industry-specific terms",
                "Add skills and technologies as keywords naturally in content",
                "Use long-tail keywords for specific roles or specializations"
            ],
            'content': [
                "Write detailed project descriptions with relevant keywords",
                "Include industry-specific terminology and buzzwords",
                "Add meta descriptions and titles for each section",
                "Use header tags (H1, H2) to structure content properly",
                "Include internal links between related sections"
            ],
            'technical': [
                "Optimize images with descriptive alt text and file names",
                "Ensure fast loading times by compressing images and optimizing code",
                "Make your portfolio mobile-friendly and responsive",
                "Use clean URLs and proper site structure",
                "Include schema markup for better search engine understanding"
            ]
        }

        # Interview preparation
        interview_prep = {
            'portfolio_discussion': [
                "Prepare to walk through 2-3 key projects in detail",
                "Be ready to explain your role, challenges faced, and solutions implemented",
                "Have specific metrics and results ready to share",
                "Practice explaining technical concepts in simple terms",
                "Prepare questions about the company's projects and technology stack"
            ],
            'common_questions': [
                "What was your biggest challenge in this project?",
                "How did you handle team conflicts or disagreements?",
                "What would you do differently if you could start over?",
                "How do you stay updated with industry trends?",
                "What are your career goals for the next 2-3 years?"
            ],
            'presentation_tips': [
                "Start with a brief overview of your background and expertise",
                "Focus on problem-solving and results rather than just listing features",
                "Use the STAR method (Situation, Task, Action, Result) for project descriptions",
                "Be honest about challenges and what you learned from them",
                "End with your value proposition and what you can bring to the team"
            ]
        }

        # Portfolio analytics understanding
        analytics_guidance = {
            'metrics': [
                "Page views show overall interest in your portfolio",
                "Time on page indicates engagement with your content",
                "Bounce rate shows if visitors leave quickly (aim for under 50%)",
                "Traffic sources help understand how people find you",
                "Popular pages indicate which content resonates most"
            ],
            'optimization': [
                "High bounce rate? Improve your summary and first impressions",
                "Low time on page? Add more engaging content and visuals",
                "Few page views? Focus on SEO and sharing strategies",
                "No contact form submissions? Make your contact information more prominent",
                "Mobile traffic low? Ensure mobile optimization"
            ]
        }

        # Collaboration features guidance
        collaboration_guidance = {
            'team_projects': [
                "Clearly define your role and contributions in team projects",
                "Highlight collaboration skills and team leadership experience",
                "Include team size and your specific responsibilities",
                "Mention tools used for team communication and project management",
                "Showcase how you handled team challenges and conflicts"
            ],
            'cross_functional': [
                "Demonstrate ability to work with different departments and stakeholders",
                "Highlight communication skills across technical and non-technical teams",
                "Include examples of translating technical concepts for business stakeholders",
                "Showcase project management and coordination skills",
                "Mention experience with agile methodologies and team processes"
            ]
        }

        # Portfolio sharing strategies
        sharing_strategies = {
            'social_media': [
                "Share on LinkedIn with a compelling post about your latest project",
                "Use Twitter to share portfolio updates and industry insights",
                "Post on Instagram with visual highlights from your work",
                "Join relevant Facebook groups and share your portfolio",
                "Use Pinterest to showcase visual work and design projects"
            ],
            'networking': [
                "Include portfolio link in your email signature",
                "Share during networking events and professional meetups",
                "Add to your business cards and professional materials",
                "Mention in conversations with industry professionals",
                "Include in job applications and cover letters"
            ],
            'online_presence': [
                "Add portfolio link to all social media profiles",
                "Include in online directories and professional platforms",
                "Share on relevant forums and community websites",
                "Use in guest posts and industry publications",
                "Include in speaking engagements and presentations"
            ]
        }

        # Payment and subscription guidance
        payment_guidance = {
            'pricing': [
                "Basic portfolio creation is completely free",
                "Premium features include public publishing and advanced customization",
                "One-time payment unlocks lifetime access to premium features",
                "No recurring fees or hidden charges",
                "Money-back guarantee if not satisfied"
            ],
            'features': [
                "Free: Create and edit portfolio, basic templates, private access",
                "Premium: Public publishing, custom domain, advanced analytics, priority support",
                "Premium: Unlimited template changes, custom branding, SEO optimization",
                "Premium: Download PDF version, backup and restore, advanced security"
            ],
            'value': [
                "Professional portfolio can increase job opportunities by 40%",
                "Public portfolio improves online visibility and personal branding",
                "Custom domain enhances professional credibility",
                "Analytics help understand visitor behavior and optimize content",
                "Premium features pay for themselves through career advancement"
            ]
        }

        # Technical troubleshooting
        technical_help = {
            'template_issues': [
                "Clear browser cache and cookies if template doesn't load properly",
                "Try different browsers (Chrome, Firefox, Safari) for compatibility",
                "Check internet connection and try refreshing the page",
                "Contact support if template elements are missing or broken",
                "Ensure all required fields are filled before saving"
            ],
            'saving_issues': [
                "Check if you're logged in and session hasn't expired",
                "Try saving smaller sections at a time",
                "Clear browser cache and try again",
                "Use a different browser or device",
                "Contact support if issues persist"
            ],
            'display_issues': [
                "Ensure browser is updated to latest version",
                "Check if JavaScript is enabled in your browser",
                "Try disabling browser extensions that might interfere",
                "Use responsive design mode to test mobile view",
                "Contact support for specific display problems"
            ]
        }

        # Performance optimization
        performance_tips = {
            'loading_speed': [
                "Optimize images by compressing them before uploading",
                "Use appropriate image formats (JPEG for photos, PNG for graphics)",
                "Limit the number of large images on a single page",
                "Use text content instead of images when possible",
                "Enable browser caching for faster repeat visits"
            ],
            'mobile_optimization': [
                "Test your portfolio on different mobile devices",
                "Ensure text is readable without zooming on mobile",
                "Make buttons and links large enough for touch interaction",
                "Optimize images for mobile viewing",
                "Test navigation and forms on mobile devices"
            ],
            'content_optimization': [
                "Keep text content concise and scannable",
                "Use bullet points and short paragraphs",
                "Break up long content with headings and sections",
                "Include relevant keywords naturally in content",
                "Regularly update content to keep it fresh and relevant"
            ]
        }

        # Content strategy by industry
        content_strategy = {
            'technology': {
                'summary': "Focus on technical skills, problem-solving, and innovation",
                'projects': "Include code repositories, live demos, and technical documentation",
                'skills': "List programming languages, frameworks, tools, and methodologies",
                'experience': "Emphasize technical achievements, team collaboration, and project outcomes"
            },
            'design': {
                'summary': "Highlight creativity, design thinking, and visual communication",
                'projects': "Showcase portfolio galleries, case studies, and design process",
                'skills': "Include design tools, creative software, and artistic abilities",
                'experience': "Focus on client work, brand development, and creative problem-solving"
            },
            'business': {
                'summary': "Emphasize leadership, strategy, and measurable business impact",
                'projects': "Include business cases, strategic initiatives, and ROI achievements",
                'skills': "Highlight management, analysis, communication, and strategic thinking",
                'experience': "Focus on team leadership, business growth, and stakeholder management"
            },
            'marketing': {
                'summary': "Showcase campaign results, audience growth, and brand development",
                'projects': "Include campaign metrics, growth statistics, and brand success stories",
                'skills': "Highlight digital marketing, analytics, content creation, and campaign management",
                'experience': "Emphasize measurable results, audience engagement, and brand building"
            }
        }

        # Determine response based on user input
        response = None
        suggestions = []

        # Check for template-specific questions
        if any(word in user_message for word in ['template', 'design', 'layout']):
            if portfolio and portfolio.template:
                template_key = f"template{portfolio.template.id}"
                if template_key in template_guidance:
                    # Use first tip for consistency
                    response = template_guidance[template_key]['tips'][0]
                    suggestions = [
                        f"What works best for {template_guidance[template_key]['name']}?",
                        "How can I optimize my template?",
                        "What content works best for my template?"
                    ]
            else:
                response = "I can help you choose the best template for your industry and goals. What field are you in?"
                suggestions = ["I'm in technology", "I'm in design",
                               "I'm in business", "I'm in marketing"]

        # Check for industry responses (when user answers "What field are you in?")
        elif any(word in user_message for word in ['technology', 'tech', 'it', 'software', 'development', 'programming', 'coding']):
            response = "For IT and technology professionals, I recommend the **Tech Developer template**. This template is perfect for showcasing technical skills, code projects, and GitHub repositories. It includes sections specifically designed for developers to highlight their programming languages, frameworks, and technical achievements."
            suggestions = [
                "What should I include in my tech portfolio?",
                "How can I showcase my coding projects?",
                "What skills should I highlight for IT?"
            ]
        elif any(word in user_message for word in ['design', 'creative', 'art', 'ui', 'ux', 'graphic']):
            response = "For design and creative professionals, I recommend the **Creative Portfolio template**. This template is ideal for showcasing visual work, design projects, and creative portfolios. It emphasizes visual presentation and allows you to display your artistic work prominently."
            suggestions = [
                "What should I include in my design portfolio?",
                "How can I showcase my creative work?",
                "What skills should I highlight for design?"
            ]
        elif any(word in user_message for word in ['business', 'management', 'finance', 'consulting', 'corporate']):
            response = "For business and corporate professionals, I recommend the **Modern Professional template**. This template is perfect for corporate roles with its clean, professional design. It emphasizes structured content and formal presentation suitable for business environments."
            suggestions = [
                "What should I include in my business portfolio?",
                "How can I showcase my business achievements?",
                "What skills should I highlight for business?"
            ]
        elif any(word in user_message for word in ['marketing', 'digital', 'campaign', 'brand', 'social media']):
            response = "For marketing professionals, I recommend the **Creative Portfolio template** as it allows you to showcase campaign visuals, brand work, and marketing materials effectively. The visual focus helps demonstrate your creative marketing abilities."
            suggestions = [
                "What should I include in my marketing portfolio?",
                "How can I showcase my marketing campaigns?",
                "What skills should I highlight for marketing?"
            ]

        # Check for industry-specific questions (general guidance)
        elif any(word in user_message for word in ['industry', 'field', 'career', 'profession']):
            for industry, guidance in industry_guidance.items():
                if any(keyword in user_message for keyword in guidance['keywords']):
                    response = guidance['summary']
                    suggestions = [
                        f"What skills should I highlight for {industry}?",
                        f"What projects work best for {industry}?",
                        f"How should I write my summary for {industry}?"
                    ]
                    break
            if not response:
                response = "I can provide industry-specific guidance. What field are you working in?"
                suggestions = ["Technology", "Design",
                               "Business", "Marketing", "Healthcare"]

        # Check for resume optimization questions
        elif any(word in user_message for word in ['resume', 'optimize', 'improve', 'stand out']):
            if any(word in user_message for word in ['technical', 'coding', 'development']):
                response = resume_optimization['technical'][0]
            elif any(word in user_message for word in ['creative', 'design', 'art']):
                response = resume_optimization['creative'][0]
            else:
                response = resume_optimization['general'][0]
            suggestions = [
                "How can I quantify my achievements?",
                "What action verbs should I use?",
                "How can I make my portfolio more impactful?"
            ]

        # Check for SEO questions
        elif any(word in user_message for word in ['seo', 'visibility', 'discoverable', 'search']):
            # Start with keywords as most important
            response = seo_guidance['keywords'][0]
            suggestions = [
                "What keywords should I use?",
                "How can I improve my content for SEO?",
                "What technical optimizations should I make?"
            ]

        # Check for interview preparation
        elif any(word in user_message for word in ['interview', 'presentation', 'discuss']):
            # Start with portfolio discussion
            response = interview_prep['portfolio_discussion'][0]
            suggestions = [
                "How should I present my projects?",
                "What questions should I prepare for?",
                "How can I make a good impression?"
            ]

        # Check for analytics questions
        elif any(word in user_message for word in ['analytics', 'visitors', 'traffic', 'metrics']):
            # Start with understanding metrics
            response = analytics_guidance['metrics'][0]
            suggestions = [
                "What do these metrics mean?",
                "How can I improve my analytics?",
                "What should I focus on optimizing?"
            ]

        # Check for collaboration questions
        elif any(word in user_message for word in ['team', 'collaboration', 'group']):
            # Start with team projects
            response = collaboration_guidance['team_projects'][0]
            suggestions = [
                "How should I describe team projects?",
                "What collaboration skills should I highlight?",
                "How can I show leadership experience?"
            ]

        # Check for sharing questions
        elif any(word in user_message for word in ['share', 'promote', 'network', 'social']):
            # Start with social media
            response = sharing_strategies['social_media'][0]
            suggestions = [
                "How should I share on social media?",
                "What networking strategies work best?",
                "How can I increase my online presence?"
            ]

        # Check for payment questions
        elif any(word in user_message for word in ['payment', 'pricing', 'cost', 'subscription']):
            # Start with pricing information
            response = payment_guidance['pricing'][0]
            suggestions = [
                "What's included in the free version?",
                "What premium features are available?",
                "Is it worth upgrading to premium?"
            ]

        # Check for technical issues
        elif any(word in user_message for word in ['problem', 'issue', 'error', 'trouble', 'fix']):
            # Start with template issues
            response = technical_help['template_issues'][0]
            suggestions = [
                "How can I fix template problems?",
                "What if I can't save my work?",
                "How do I resolve display issues?"
            ]

        # Check for performance questions
        elif any(word in user_message for word in ['performance', 'speed', 'mobile', 'optimization']):
            # Start with loading speed
            response = performance_tips['loading_speed'][0]
            suggestions = [
                "How can I improve loading speed?",
                "How do I optimize for mobile?",
                "How can I optimize my content?"
            ]

        # Check for content strategy questions
        elif any(word in user_message for word in ['content', 'strategy', 'what to include']):
            if portfolio and portfolio.template:
                # Try to determine industry from user profile or content
                user_profile = getattr(request.user, 'userprofile', None)
                if user_profile and user_profile.user_type == 'student':
                    # Default to technology if we can't determine
                    industry = 'technology'
                    for ind, strategy in content_strategy.items():
                        if any(keyword in user_message for keyword in strategy['summary'].lower().split()):
                            industry = ind
                            break
                    response = content_strategy[industry]['summary']
                    suggestions = [
                        f"What projects work best for {industry}?",
                        f"What skills should I highlight for {industry}?",
                        f"How should I write my experience for {industry}?"
                    ]
            else:
                response = "I can help you develop a content strategy for your industry. What field are you in?"
                suggestions = ["Technology", "Design", "Business", "Marketing"]

        # Original step-specific help (keep existing logic)
        elif current_step and current_step in step_help:
            # Use first response for consistency
            response = step_help[current_step][0]

        # Default response if no specific match
        if not response:
            response = "I'm here to help with portfolio creation, optimization, and career guidance. What specific area would you like assistance with?"
            suggestions = [
                "How can I optimize my portfolio?",
                "What template should I choose?",
                "How can I make my portfolio stand out?",
                "What content strategy should I use?"
            ]

        return JsonResponse({
            'response': response,
            'suggestions': suggestions
        })

    except Exception as e:
        return JsonResponse({
            'response': "I'm having trouble understanding. Could you please rephrase your question?",
            'suggestions': [
                "How can I optimize my portfolio?",
                "What template should I choose?",
                "How can I make my portfolio stand out?"
            ]
        })






def smart_get_started_view(request):
    """
    Smart routing for 'Get Started' button based on user authentication status:
    - Not logged in + New user → Registration page
    - Not logged in + Existing user → Login page  
    - Already logged in → Personal info page (step 1 of portfolio creation)
    """
    if request.user.is_authenticated:
        # User is logged in, check if they have a portfolio
        try:
            portfolio = StudentPortfolio.objects.get(user=request.user)
            # User has a portfolio, redirect to step 1 (personal info)
            return redirect('personal_info1', pk=portfolio.pk)
        except StudentPortfolio.DoesNotExist:
            # User is logged in but doesn't have a portfolio
            # First ensure they have a UserProfile
            user_profile, created = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'first_name': request.user.first_name or '',
                    'last_name': request.user.last_name or '',
                    'email': request.user.email or '',
                    'user_type': 'normal',
                    'portfolios_remaining': 1,
                    'max_template_changes': 3
                }
            )

            # Create portfolio with the user_profile
            portfolio = StudentPortfolio.objects.create(
                user=request.user,
                user_profile=user_profile
            )
            return redirect('personal_info1', pk=portfolio.pk)
    else:
        # User is not logged in
        # Check for various indicators to determine if they might be an existing user

        # Check if they have a "returning user" cookie
        returning_user = request.COOKIES.get('returning_user', False)

        # Check if they have any session data that might indicate they've been here before
        has_session_data = bool(request.session.keys())

        # Check referrer to see if they came from a specific page
        referrer = request.META.get('HTTP_REFERER', '')
        from_login_page = 'login' in referrer
        from_register_page = 'register' in referrer

        # If they have session data or came from login/register pages, they're likely an existing user
        if returning_user or has_session_data or from_login_page or from_register_page:
            return redirect('login')
        else:
            # New user, redirect to registration
            return redirect('register')


def is_personal_info_completed(portfolio):
    """
    Check if the basic personal information is completed.
    This is required before accessing other portfolio forms.
    """
    user_profile = portfolio.user_profile
    required_fields = [
        user_profile.first_name,
        user_profile.last_name,
        user_profile.email,
        user_profile.contact,
        user_profile.address,
        user_profile.pin_code
    ]
    return all(field and field.strip() for field in required_fields)


def enforce_personal_info_completion(request, portfolio):
    """
    Check if personal information is completed. If not, redirect to personal info form.
    """
    if not is_personal_info_completed(portfolio):
        messages.warning(
            request, "Please complete your personal information first before proceeding to other sections.")
        return redirect('personal_info1', pk=portfolio.pk)
    return None
