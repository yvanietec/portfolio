from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
import csv
from .models import UserProfile


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
