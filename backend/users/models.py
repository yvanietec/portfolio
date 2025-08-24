import datetime
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class PortfolioTemplate(models.Model):
    name = models.CharField(max_length=100)
    preview_image = models.ImageField(upload_to='template_previews/')
    template_file = models.CharField(max_length=200)
    is_pdf = models.BooleanField(default=False)  # ✅ NEW FIELD
    # HTML template name

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    # Track when the profile was created and updated
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    USER_TYPES = (
        ('normal', 'Normal User'),
        ('agent', 'Agent'),
        ('student', 'Student'),
    )
    # If this is a student, who created them (which agent)?
    created_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='students_created')

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    template_change_count = models.IntegerField(default=0)
    max_template_changes = models.IntegerField(default=50)
    portfolios_remaining = models.PositiveIntegerField(default=10)
    user_type = models.CharField(
        max_length=10, choices=USER_TYPES, default='normal')
    is_blocked = models.BooleanField(default=False)
    blocked_since = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)  # ✅ Add this
    profile_photo = models.ImageField(
        upload_to='profile_photos/', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.TextField()
    contact = models.CharField(max_length=20)
    pin_code = models.CharField(max_length=10)
    email = models.EmailField()
    github_link = models.URLField(blank=True, null=True)
    facebook_link = models.URLField(blank=True, null=True)
    instagram_link = models.URLField(blank=True, null=True)
    other_social_link = models.URLField(blank=True, null=True)
    certifications = models.TextField(blank=True)
    languages = models.TextField(blank=True)
    hobbies = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    extracurricular = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)

    # Agent-specific fields
    agent_commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00)  # Commission percentage
    agent_total_earnings = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00)  # Total earned
    agent_pending_payments = models.IntegerField(
        default=0)  # Number of pending student payments

    # Student-specific fields
    # Is this student added by an agent?
    is_agent_student = models.BooleanField(default=False)
    agent_payment_completed = models.BooleanField(
        default=False)  # Has agent paid for this student?

    # Terms and Conditions acceptance
    terms_accepted = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def is_agent(self):
        return self.user_type == 'agent'

    @property
    def is_student(self):
        return self.user_type == 'student'

    @property
    def pending_commission(self):
        """Calculate pending commission from students who paid but commission not collected"""
        if not self.is_agent:
            return 0

        # Get students who paid but commission not yet collected by agent
        commission_payments = StudentPayment.objects.filter(
            agent=self,
            status='completed',
            agent_commission__gt=0
        ).aggregate(total=models.Sum('agent_commission'))['total'] or 0

        return commission_payments

    @property
    def students_managed_count(self):
        """Count of students successfully managed by this agent"""
        if not self.is_agent:
            return 0
        return self.student_invitations.filter(status='activated').count()


STATUS_CHOICES = [
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
]


class StudentPortfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='in_progress')
    views = models.PositiveIntegerField(
        default=0, help_text="Number of times this portfolio has been viewed.")
    is_paid = models.BooleanField(default=False)
    template = models.ForeignKey(
        PortfolioTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    pdf_template = models.ForeignKey(
        PortfolioTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='pdf_template')

    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            # FIXED: Better slug generation with fallbacks and uniqueness
            first_name = self.user_profile.first_name or "user"
            last_name = self.user_profile.last_name or "portfolio"
            base_slug = slugify(
                f"{self.user.username}-{first_name}-{last_name}")

            # Ensure uniqueness
            slug = base_slug
            counter = 1
            while StudentPortfolio.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_profile.first_name} {self.user_profile.last_name}'s Portfolio"


class Education(models.Model):
    portfolio = models.ForeignKey(StudentPortfolio, on_delete=models.CASCADE)
    institution = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)

    start_month = models.IntegerField(
        choices=[(i, datetime.date(1900, i, 1).strftime('%B')) for i in range(1, 13)])
    start_year = models.IntegerField()
    end_month = models.IntegerField(choices=[(i, datetime.date(
        1900, i, 1).strftime('%B')) for i in range(1, 13)], null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)

    description = models.TextField(blank=True)


class Experience(models.Model):
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)

    start_month = models.IntegerField(
        choices=[(i, datetime.date(1900, i, 1).strftime('%B')) for i in range(1, 13)])
    start_year = models.IntegerField()
    end_month = models.IntegerField(blank=True, null=True, choices=[(
        i, datetime.date(1900, i, 1).strftime('%B')) for i in range(1, 13)])
    end_year = models.IntegerField(blank=True, null=True)

    currently_working = models.BooleanField(default=False)
    description = models.TextField(blank=True)


class Project(models.Model):
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    technologies_used = models.CharField(max_length=300, blank=True)
    project_type = models.CharField(
        max_length=20,
        choices=[
            ('personal', 'Personal Project'),
            ('academic', 'Academic Project'),
            ('freelance', 'Freelance Work'),
            ('contribution', 'Open Source Contribution'),
            ('other', 'Other')
        ],
        blank=True,
        null=True
    )
    currently_working = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    def __str__(self):
        return self.title


class Skill(models.Model):
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50, choices=[(
        'Beginner', 'Beginner'), ('Intermediate', 'Intermediate'), ('Expert', 'Expert')])

    def __str__(self):
        return f"{self.name} ({self.level})"


# models.py


class Certification(models.Model):
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)

    issue_month = models.IntegerField(
        choices=[(i, datetime.date(1900, i, 1).strftime('%B'))
                 for i in range(1, 13)],
        blank=True, null=True
    )
    issue_year = models.IntegerField(blank=True, null=True)

    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} by {self.issuer}"


class Language(models.Model):
    PROFICIENCY_LEVELS = [
        ('Basic', 'Basic'),
        ('Conversational', 'Conversational'),
        ('Fluent', 'Fluent'),
        ('Native', 'Native'),
    ]

    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='languages')
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=50, choices=PROFICIENCY_LEVELS)

    def __str__(self):
        return f"{self.name} ({self.proficiency})"


class Hobby(models.Model):
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, related_name='hobbies')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Summary(models.Model):
    portfolio = models.OneToOneField(
        StudentPortfolio, on_delete=models.CASCADE, related_name='summary')
    content = models.TextField()

    def __str__(self):
        return f"Summary for {self.portfolio}"


# models.py


class Referral(models.Model):
    referrer = models.ForeignKey(
        User, related_name='referrals_made', on_delete=models.CASCADE)
    referred = models.OneToOneField(
        User, related_name='referral_info', on_delete=models.CASCADE)
    registered_on = models.DateTimeField(auto_now_add=True)
    is_converted = models.BooleanField(default=False)
    converted_on = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.referrer.username} referred {self.referred.username}"


class ReferralPayout(models.Model):
    agent = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_on = models.DateTimeField(auto_now_add=True)
    referrals_paid = models.ManyToManyField('Referral')

    def __str__(self):
        return f"Payout to {self.agent.username} - ₹{self.amount} on {self.paid_on.date()}"


class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    invoice_emailed_on = models.DateTimeField(null=True, blank=True)
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100)
    razorpay_signature = models.CharField(max_length=200)
    amount = models.IntegerField(
        help_text="Amount in paise (e.g., 49900 for ₹499)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment by {self.user.username} - ₹{self.amount / 100:.2f}"

    def invoice_number(self):
        return f"INV-{self.created_at.year}-{self.id:04d}"


class UserActivity(models.Model):
    ACTION_TYPES = [
        ('login', 'Login'),
        ('edit_profile', 'Edit Profile'),
        ('create_portfolio', 'Created Portfolio'),
        ('payment', 'Made Payment'),
        ('admin_action', 'Admin Action'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


# models.py

class AdminLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.admin.username} - {self.action} - {self.timestamp}"


# Additional models for agent approval system and enhanced payments

class StudentInvitation(models.Model):
    """Model to track student invitations by agents before admin approval"""
    INVITATION_STATUS = (
        ('pending', 'Pending Admin Approval'),
        ('approved', 'Approved by Admin'),
        ('rejected', 'Rejected by Admin'),
        ('activated', 'Student Activated Account'),
    )

    agent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name='student_invitations')
    student_email = models.EmailField()
    student_username = models.CharField(max_length=150)
    student_first_name = models.CharField(max_length=100)
    student_last_name = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20, choices=INVITATION_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    admin_approved_at = models.DateTimeField(null=True, blank=True)
    admin_approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_invitations')
    rejection_reason = models.TextField(blank=True)
    student_user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True)  # Set after approval

    class Meta:
        unique_together = ['agent', 'student_email']

    def __str__(self):
        return f"{self.agent.user.username} -> {self.student_email} ({self.status})"

    @property
    def agent_has_paid(self):
        """Check if the agent has paid for this invitation"""
        return self.agent_payments.filter(status='completed').exists()


class AgentPayment(models.Model):
    """Model to track agent bulk payments for multiple students"""
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    agent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name='agent_payments')
    # Total amount (₹699 per student)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    student_count = models.IntegerField()  # Number of students
    per_student_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=699.00)

    # Payment details
    status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending')
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=500, blank=True)

    # Students included in this payment
    student_invitations = models.ManyToManyField(
        StudentInvitation, related_name='agent_payments')

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Agent Payment: {self.agent.user.username} - ₹{self.amount} ({self.student_count} students)"


class StudentPayment(models.Model):
    """Enhanced student payment model with new pricing"""
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='student_payments')
    portfolio = models.ForeignKey(
        StudentPortfolio, on_delete=models.CASCADE, null=True, blank=True)

    # Pricing details
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=2999.00)
    discounted_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=1499.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)

    # Payment details
    status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending')
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=500, blank=True)

    # Agent commission tracking
    agent = models.ForeignKey(UserProfile, on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='commission_payments')
    agent_commission = models.DecimalField(
        # To be collected directly by agent
        max_digits=10, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Student Payment: {self.student.username} - ₹{self.amount_paid}"


class AdminNotification(models.Model):
    """Model to track admin notifications"""
    NOTIFICATION_TYPE = (
        ('student_invitation', 'Student Invitation'),
        ('agent_payment', 'Agent Payment'),
        ('student_payment', 'Student Payment'),
        ('system', 'System Notification'),
    )

    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPE, default='system')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Related objects
    student_invitation = models.ForeignKey(
        StudentInvitation, on_delete=models.CASCADE, null=True, blank=True)
    agent_payment = models.ForeignKey(
        AgentPayment, on_delete=models.CASCADE, null=True, blank=True)
    student_payment = models.ForeignKey(
        StudentPayment, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class SuccessStory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    story = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.title}"
