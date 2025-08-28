from .views import admin_agent_students
from django.views.generic import TemplateView
from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
path('dashboard/admin/notifications/',
     views.admin_notifications, name='admin_notifications'),


urlpatterns = [
    path('admin/agent/<int:agent_id>/students/',
         admin_agent_students, name='admin_agent_students'),
    # Admin Portfolio Actions
    path('admin-dashboard/portfolios/<int:pk>/view/',
         views.admin_portfolio_view, name='admin_portfolio_view'),
    path('admin-dashboard/portfolios/<int:pk>/edit/',
         views.admin_portfolio_edit, name='admin_portfolio_edit'),
    path('admin-dashboard/portfolios/<int:pk>/delete/',
         views.admin_portfolio_delete, name='admin_portfolio_delete'),
    path('agent/add-student/', views.agent_add_student, name='agent_add_student'),
    path('dashboard/admin/add-student/',
         views.admin_add_student, name='admin_add_student'),

    # Authentication URLs
    path('login/', views.unified_login, name='login'),  # normal user

    path('password-reset/', auth_views.PasswordResetView.as_view(
        template_name='portfolio/password_reset.html',
        email_template_name='portfolio/password_reset_email.html',
        subject_template_name='portfolio/password_reset_subject.txt',
        success_url='/password-reset/done/'
    ), name='password_reset'),

    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='portfolio/password_reset_done.html'
    ), name='password_reset_done'),

    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='portfolio/password_reset_confirm.html',
        success_url='/reset/done/'
    ), name='password_reset_confirm'),

    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='portfolio/password_reset_complete.html'
    ), name='password_reset_complete'),
    path('password-change/', auth_views.PasswordChangeView.as_view(
         template_name='portfolio/password_change.html',
         success_url='/password-change/done/'
         ), name='password_change'),

    path('password-change/done/', auth_views.PasswordChangeDoneView.as_view(
        template_name='portfolio/password_change_done.html'
    ), name='password_change_done'),

    path('dashboard/admin/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/create-missing-profiles/',
         views.create_missing_profiles, name='create_missing_profiles'),
    path('agent/dashboard/', views.agent_dashboard, name='agent_dashboard'),
    path('agent/payouts/<int:payout_id>/invoice/',
         views.download_payout_invoice, name='download_payout_invoice'),
    path('agent/export-csv/', views.export_referred_users_csv,
         name='export_referred_users_csv'),
    path('agent/export-invited-csv/', views.export_invited_students_csv,
         name='export_invited_students_csv'),

    # New agent functionality
    path('agent/analytics/', views.agent_analytics, name='agent_analytics'),
    path('agent/communication/', views.agent_student_communication,
         name='agent_student_communication'),
    path('agent/notifications/api/', views.agent_notifications_api,
         name='agent_notifications_api'),
    path('agent/notifications/<int:notification_id>/read/',
         views.mark_notification_read, name='mark_notification_read'),
    path('agent/send-bulk-message/', views.agent_send_bulk_message,
         name='agent_send_bulk_message'),

    path('logout/', views.user_logout, name='logout'),
    path('register/<int:agent_id>/', views.register_with_referral,
         name='register_with_referral'),
    path('admin/referrals/', views.referral_admin_dashboard,
         name='referral_admin_dashboard'),
    path('ajax/check/', views.check_availability, name='check_availability'),
    path('register/', views.register, name='register'),
    path('terms/', views.terms_view, name='terms'),
    path('activate/<uidb64>/<token>/', views.activate_account, name='activate'),

    path('payment/initiate/', views.initiate_payment, name='initiate_payment'),
    path('payment/success/', views.payment_success, name='payment_success'),
    path('resend-invoice/<int:payment_id>/',
         views.resend_invoice, name='resend_invoice'),


    # Admin User Management
    # Admin User/Agent/Portfolio Management URLs
    path('admin-dashboard/users/', views.admin_user_list, name='admin_user_list'),
    path('admin-dashboard/agents/',
         views.admin_agent_list, name='admin_agent_list'),
    path('admin-dashboard/portfolios/',
         views.admin_portfolio_list, name='admin_portfolio_list'),
    path('admin-dashboard/users/<int:user_id>/block/',
         views.block_user, name='block_user'),
    path('admin-dashboard/users/<int:user_id>/unblock/',
         views.unblock_user, name='unblock_user'),
    path('admin-dashboard/users/<int:user_id>/delete/',
         views.delete_user, name='delete_user'),
    path('admin-dashboard/users/<int:user_id>/edit/',
         views.edit_user_details, name='edit_user_details'),
    path('admin-dashboard/users/<int:user_id>/impersonate/',
         views.login_as_user, name='login_as_user'),

    path('admin-dashboard/return-admin/',
         views.stop_impersonation, name='stop_impersonation'),

    path('admin-dashboard/payments/',
         views.admin_payment_list, name='admin_payment_list'),
    path('admin-dashboard/payments/<int:payment_id>/email/',
         views.email_invoice, name='email_invoice'),
    path('dashboard/admin/reports/', views.admin_reports, name='admin_reports'),
    path('dashboard/admin/reports/export/',
         views.export_top_agents_csv, name='export_top_agents_csv'),
    path('dashboard/admin/send-notification/',
         views.admin_send_notification, name='admin_send_notification'),
    path('dashboard/admin/notifications/',
         views.admin_notifications, name='admin_notifications'),
    path('dashboard/admin/settings/', views.admin_settings, name='admin_settings'),
    path('dashboard/admin/activity-log/',
         views.admin_activity_log, name='admin_activity_log'),
    # Portfolio Management
    path('dashboard/admin/add-agent/', views.add_agent, name='add_agent'),
    path('dashboard/admin/export-users/',
         views.export_users_csv, name='export_users'),
    path('dashboard/admin/payouts/', views.review_payouts, name='review_payouts'),

    # Profile URLs
    path('edit-profile/', views.edit_user_profile, name='edit_profile'),
    path('profile/', views.user_profile, name='user_profile'),


    # Home page
    path('', views.home, name='home'),

    # Template Selection
    path('select-template/<int:pk>/',
         views.select_template, name='select_template'),
    path('template-preview/<int:template_id>/',
         views.template_preview, name='template_preview'),

    # Portfolio Creation Steps
    path('create/', views.create_portfolio, name='create_portfolio'),
    # Step-wise Form Views
    path('step-1/<int:pk>/', views.personal_info1_view, name='personal_info1'),
    path('step-2/<int:pk>/', views.personal_info2_view, name='personal_info2'),
    path('education/<int:pk>/', views.add_education_view, name='add_education'),
    path('experience/<int:pk>/', views.add_experience_view, name='add_experience'),
    path('projects/<int:pk>/', views.add_project_view, name='add_project'),
    path('skills/<int:pk>/', views.add_skill_view, name='add_skill'),

    # Extras (Split Views)
    path('extras/<int:pk>/', views.extras_view, name='extras'),
    path('certifications/<int:pk>/',
         views.add_certification_view, name='add_certification'),
    path('languages/<int:pk>/', views.add_language_view, name='add_language'),
    path('hobbies/<int:pk>/', views.add_hobby_view, name='add_hobby'),
    # AI hobby suggestion endpoint
    path('hobbies/<int:pk>/suggest/',
         views.suggest_hobby_view, name='suggest_hobby'),
    path('summary/<int:pk>/', views.add_summary_view, name='add_summary'),
    # AI summary suggestion endpoint
    path('summary/<int:pk>/suggest/',
         views.suggest_summary_view, name='suggest_summary'),
    # AI project description suggestion endpoint
    path('projects/<int:pk>/suggest-description/',
         views.suggest_project_description_view, name='suggest_project_description'),
    # AI chatbot endpoint
    path('ai-chatbot/', views.ai_chatbot_view, name='ai_chatbot'),

    # Portfolio Actions
    path('portfolio/edit/', views.edit_portfolio_simple,
         name='edit_portfolio_simple'),
    path('portfolio/delete/', views.delete_portfolio, name='delete_portfolio'),

    path('purchase/complete/', views.complete_purchase, name='complete_purchase'),
    # urls.py
    path('invoice/<int:payment_id>/',
         views.download_invoice, name='download_invoice'),

    path('profile/upload-photo/', views.upload_profile_photo,
         name='upload_profile_photo'),

    # Portfolio Previews
    path('preview/<slug:slug>/', views.portfolio_preview_view,
         name='portfolio_preview'),
    path('form-preview/<int:pk>/', views.form_data_preview,
         name='form_data_preview'),

    # Delete Individual Model Entries (like experience, education, etc.)
    path('portfolio/<int:portfolio_pk>/<str:model_name>/<int:entry_id>/delete/',
         views.delete_portfolio_entry, name='delete_portfolio_entry'),

    # ✅ Public Portfolio View (namespaced)
    path('portfolio/public/<slug:slug>/',
         views.public_portfolio, name='public_portfolio'),
    path('success-stories/thankyou/', TemplateView.as_view(
        template_name='portfolio/success_story_thankyou.html'), name='success_story_thankyou'),

    path('success-stories/submit/', views.submit_success_story,
         name='submit_success_story'),
    path('success-stories/', views.success_stories_page,
         name='success_stories_page'),
    path('admin-dashboard/success-stories/',
         views.approve_success_stories, name='approve_success_stories'),
    path('admin-dashboard/success-stories/toggle/<int:story_id>/',
         views.toggle_story_approval, name='toggle_story_approval'),
    path('dashboard/admin/success-stories/review/',
         views.admin_review_success_stories, name='admin_review_success_stories'),
    path('dashboard/admin/success-stories/approve/<int:story_id>/',
         views.approve_success_story, name='approve_success_story'),
    path('dashboard/admin/success-stories/reject/<int:story_id>/',
         views.reject_success_story, name='reject_success_story'),



    # NEW: Agent approval system URLs
    path('staff/student-approvals/', views.admin_student_approvals,
         name='admin_student_approvals'),
    path('staff/approve-student/<int:invitation_id>/',
         views.admin_approve_student, name='admin_approve_student'),
    path('agent/bulk-payment/', views.agent_bulk_payment,
         name='agent_bulk_payment'),
    path('agent/payment-success/', views.agent_payment_success,
         name='agent_payment_success'),

    # Monitoring and Security URLs
    path('dashboard/admin/monitoring/', views.monitoring_dashboard,
         name='monitoring_dashboard'),
    path('admin/monitoring-test/', views.test_monitoring,
         name='test_monitoring'),
    path('admin/security-logs/', views.security_logs, name='security_logs'),
    path('admin/performance/', views.performance_metrics,
         name='performance_metrics'),
    path('admin/api/monitoring-data/',
         views.api_monitoring_data, name='api_monitoring_data'),
    path('admin/block-ip/', views.block_ip, name='block_ip'),
    path('admin/unblock-ip/', views.unblock_ip, name='unblock_ip'),
    path('admin/clear-logs/', views.clear_logs, name='clear_logs'),
    path('admin/export-monitoring/', views.export_monitoring_data,
         name='export_monitoring_data'),

    path('accept-terms/', views.accept_terms, name='accept_terms'),


    # Smart get started routing
    path('get-started/', views.smart_get_started_view, name='smart_get_started'),
]

# Static files (media) during development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
