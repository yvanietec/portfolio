from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    UserProfile, StudentPortfolio, PortfolioTemplate, Education,
    Experience, Project, Skill, Certification, Language, Hobby,
    Summary, Referral, ReferralPayout, Payment, UserActivity,
    AdminLog, StudentInvitation, AgentPayment, StudentPayment,
    AdminNotification, SuccessStory
)


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name',
                    'last_name', 'date_joined', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)
    list_per_page = 25


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'first_name', 'last_name',
                    'email', 'contact', 'is_blocked', 'created_at', 'updated_at')
    list_filter = ('user_type', 'is_blocked', 'created_at', 'updated_at')
    search_fields = ('user__username', 'first_name',
                     'last_name', 'email', 'contact')
    readonly_fields = ('created_at', 'updated_at',
                       'agent_total_earnings', 'agent_pending_payments')
    ordering = ('-created_at',)
    list_per_page = 25

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'user_type', 'first_name', 'last_name', 'email', 'contact')
        }),
        ('Address', {
            'fields': ('address', 'pin_code')
        }),
        ('Social Links', {
            'fields': ('github_link', 'facebook_link', 'instagram_link', 'other_social_link'),
            'classes': ('collapse',)
        }),
        ('Profile Details', {
            'fields': ('profile_photo', 'certifications', 'languages', 'hobbies', 'summary', 'extracurricular', 'resume')
        }),
        ('Agent Settings', {
            'fields': ('agent_commission_rate', 'agent_total_earnings', 'agent_pending_payments'),
            'classes': ('collapse',)
        }),
        ('Student Settings', {
            'fields': ('is_agent_student', 'agent_payment_completed', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Portfolio Settings', {
            'fields': ('template_change_count', 'max_template_changes', 'portfolios_remaining')
        }),
        ('System', {
            'fields': ('is_blocked', 'blocked_since', 'reason', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


class StudentPortfolioAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'is_paid', 'template', 'views', 'slug')
    list_filter = ('status', 'is_paid', 'template')
    search_fields = ('user__username', 'user__first_name', 'user__last_name')
    readonly_fields = ('views', 'slug')
    ordering = ('user__username',)
    list_per_page = 25

    def created_at_display(self, obj):
        if hasattr(obj, 'created_at'):
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return 'N/A'
    created_at_display.short_description = 'Created At'


class PortfolioTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_pdf', 'preview_image_display')
    list_filter = ('is_pdf',)
    search_fields = ('name',)
    ordering = ('name',)
    list_per_page = 25

    def preview_image_display(self, obj):
        if obj.preview_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />', obj.preview_image.url)
        return 'No Image'
    preview_image_display.short_description = 'Preview'


class EducationAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'institution', 'degree',
                    'start_year', 'end_year', 'location')
    list_filter = ('start_year', 'end_year')
    search_fields = ('institution', 'degree', 'location')
    ordering = ('-start_year',)
    list_per_page = 25


class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'portfolio', 'project_type',
                    'technologies_used')
    list_filter = ('project_type',)
    search_fields = ('title', 'technologies_used')
    ordering = ('title',)
    list_per_page = 25


class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'portfolio')
    list_filter = ('level',)
    search_fields = ('name',)
    ordering = ('name',)
    list_per_page = 25


class ExperienceAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company_name', 'portfolio',
                    'start_year', 'end_year')
    list_filter = ('start_year', 'end_year')
    search_fields = ('job_title', 'company_name', 'location')
    ordering = ('-start_year',)
    list_per_page = 25


class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount_display', 'razorpay_order_id',
                    'created_at', 'invoice_emailed_on')
    list_filter = ('created_at', 'invoice_emailed_on')
    search_fields = ('user__username', 'razorpay_order_id',
                     'razorpay_payment_id')
    readonly_fields = ('created_at', 'razorpay_order_id',
                       'razorpay_payment_id', 'razorpay_signature')
    ordering = ('-created_at',)
    list_per_page = 25

    def amount_display(self, obj):
        return f"₹{obj.amount / 100:.2f}"
    amount_display.short_description = 'Amount'


class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'description')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'description')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    list_per_page = 25


class StudentInvitationAdmin(admin.ModelAdmin):
    list_display = ('agent', 'student_email',
                    'student_username', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('agent__user__username',
                     'student_email', 'student_username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    list_per_page = 25


class AgentPaymentAdmin(admin.ModelAdmin):
    list_display = ('agent', 'amount', 'student_count',
                    'status', 'created_at', 'completed_at')
    list_filter = ('status', 'created_at', 'completed_at')
    search_fields = ('agent__user__username', 'razorpay_order_id')
    readonly_fields = ('created_at', 'completed_at')
    ordering = ('-created_at',)
    list_per_page = 25


class StudentPaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount_paid', 'status',
                    'agent', 'created_at', 'completed_at')
    list_filter = ('status', 'created_at', 'completed_at')
    search_fields = ('student__username', 'razorpay_order_id')
    readonly_fields = ('created_at', 'completed_at')
    ordering = ('-created_at',)
    list_per_page = 25


class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ('notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    list_per_page = 25


class SuccessStoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('user__username', 'title', 'story')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    list_per_page = 25


class CertificationAdmin(admin.ModelAdmin):
    list_display = ('name', 'issuer', 'portfolio', 'issue_month', 'issue_year')
    list_filter = ('issue_year', 'issue_month')
    search_fields = ('name', 'issuer')
    ordering = ('-issue_year',)
    list_per_page = 25


class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name', 'proficiency', 'portfolio')
    list_filter = ('proficiency',)
    search_fields = ('name',)
    ordering = ('name',)
    list_per_page = 25


class HobbyAdmin(admin.ModelAdmin):
    list_display = ('name', 'portfolio')
    search_fields = ('name',)
    ordering = ('name',)
    list_per_page = 25


class SummaryAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'content_preview')
    search_fields = ('content',)
    list_per_page = 25

    def content_preview(self, obj):
        if len(obj.content) > 100:
            return f"{obj.content[:100]}..."
        return obj.content
    content_preview.short_description = 'Content'


class ReferralAdmin(admin.ModelAdmin):
    list_display = ('referrer', 'referred', 'registered_on',
                    'is_converted', 'converted_on')
    list_filter = ('is_converted', 'registered_on', 'converted_on')
    search_fields = ('referrer__username', 'referred__username')
    readonly_fields = ('registered_on',)
    ordering = ('-registered_on',)
    list_per_page = 25


class ReferralPayoutAdmin(admin.ModelAdmin):
    list_display = ('agent', 'amount', 'paid_on', 'referrals_count')
    list_filter = ('paid_on',)
    search_fields = ('agent__username',)
    readonly_fields = ('paid_on',)
    ordering = ('-paid_on',)
    list_per_page = 25

    def referrals_count(self, obj):
        return obj.referrals_paid.count()
    referrals_count.short_description = 'Referrals Paid'


class AdminLogAdmin(admin.ModelAdmin):
    list_display = ('admin', 'action', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('admin__username', 'action')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    list_per_page = 25


# Register models
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(StudentPortfolio, StudentPortfolioAdmin)
admin.site.register(PortfolioTemplate, PortfolioTemplateAdmin)
admin.site.register(Education, EducationAdmin)
admin.site.register(Experience, ExperienceAdmin)
admin.site.register(Project, ProjectAdmin)
admin.site.register(Skill, SkillAdmin)
admin.site.register(Certification, CertificationAdmin)
admin.site.register(Language, LanguageAdmin)
admin.site.register(Hobby, HobbyAdmin)
admin.site.register(Summary, SummaryAdmin)
admin.site.register(Referral, ReferralAdmin)
admin.site.register(ReferralPayout, ReferralPayoutAdmin)
admin.site.register(Payment, PaymentAdmin)
admin.site.register(UserActivity, UserActivityAdmin)
admin.site.register(AdminLog, AdminLogAdmin)
admin.site.register(StudentInvitation, StudentInvitationAdmin)
admin.site.register(AgentPayment, AgentPaymentAdmin)
admin.site.register(StudentPayment, StudentPaymentAdmin)
admin.site.register(AdminNotification, AdminNotificationAdmin)
admin.site.register(SuccessStory, SuccessStoryAdmin)
