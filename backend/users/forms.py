from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.shortcuts import render, get_object_or_404, redirect
from django.utils.text import slugify
from django.contrib import messages
from django.forms import inlineformset_factory
import datetime
import re

from .models import (
    SuccessStory, Summary, Hobby, Language, Certification, Project,
    StudentPortfolio, Experience, Education, UserProfile, Skill,
    StudentInvitation, AgentPayment, StudentPayment
)


class AgentAddStudentForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(
            attrs={'class': 'form-control', 'placeholder': 'Student username'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={'class': 'form-control', 'placeholder': 'Student email'})
    )
    first_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(
            attrs={'class': 'form-control', 'placeholder': 'First name'})
    )
    last_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(
            attrs={'class': 'form-control', 'placeholder': 'Last name'})
    )

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError(
                'A user with this username already exists.')
        return username

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError(
                'A user with this email already exists.')
        return email


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = [
            'user_type',  # Add this field
            'profile_photo', 'first_name', 'last_name', 'address',
            'contact', 'pin_code', 'email', 'github_link',
            'facebook_link', 'instagram_link', 'other_social_link',
            'certifications', 'languages', 'hobbies',
            'summary', 'extracurricular', 'resume'
        ]
        widgets = {
            'address': forms.Textarea(attrs={'rows': 3, 'maxlength': 300}),
            'summary': forms.Textarea(attrs={'rows': 5, 'maxlength': 1000}),
            'certifications': forms.Textarea(attrs={'rows': 3, 'maxlength': 500}),
            'languages': forms.Textarea(attrs={'rows': 2, 'maxlength': 200}),
            'hobbies': forms.Textarea(attrs={'rows': 2, 'maxlength': 300}),
            'extracurricular': forms.Textarea(attrs={'rows': 3, 'maxlength': 500}),
        }

    def clean_summary(self):
        summary = self.cleaned_data.get('summary', '').strip()
        if summary and len(summary) > 1000:
            raise ValidationError("Summary cannot exceed 1000 characters.")
        return summary

    def clean_certifications(self):
        certifications = self.cleaned_data.get('certifications', '').strip()
        if certifications and len(certifications) > 500:
            raise ValidationError(
                "Certifications cannot exceed 500 characters.")
        return certifications

    def clean_languages(self):
        languages = self.cleaned_data.get('languages', '').strip()
        if languages and len(languages) > 200:
            raise ValidationError("Languages cannot exceed 200 characters.")
        return languages

    def clean_hobbies(self):
        hobbies = self.cleaned_data.get('hobbies', '').strip()
        if hobbies and len(hobbies) > 300:
            raise ValidationError("Hobbies cannot exceed 300 characters.")
        return hobbies

    def clean_extracurricular(self):
        extracurricular = self.cleaned_data.get('extracurricular', '').strip()
        if extracurricular and len(extracurricular) > 500:
            raise ValidationError(
                "Extracurricular activities cannot exceed 500 characters.")
        return extracurricular

    def clean_address(self):
        address = self.cleaned_data.get('address', '').strip()
        if address and len(address) > 300:
            raise ValidationError("Address cannot exceed 300 characters.")
        return address


class RegistrationForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(
            attrs={
                'class': 'form-control form-input',
                'placeholder': 'Choose a username',
                'id': 'id_username',
                'autocomplete': 'username'
            })
    )
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control form-input',
                'placeholder': 'Your email address',
                'id': 'id_email',
                'autocomplete': 'email'
            })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control form-input',
                'placeholder': 'Create password',
                'id': 'id_password',
                'autocomplete': 'new-password'
            })
    )
    password_confirm = forms.CharField(
        label="Confirm Password",
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control form-input',
                'placeholder': 'Repeat password',
                'id': 'id_password_confirm',
                'autocomplete': 'new-password'
            })
    )
    agree_terms = forms.BooleanField(
        required=True,
        label="I agree to the Terms and Conditions",
        widget=forms.CheckboxInput(
            attrs={
                'class': 'form-check-input',
                'id': 'id_agree_terms'
            })
    )

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("Username already exists.")
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already registered.")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise forms.ValidationError("Enter a valid email address.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords don't match.")

        # 👇 Removed the regex check for one letter + one number
        # You can still optionally check for minimum length
        if password and len(password) < 8:
            raise forms.ValidationError(
                "Password must be at least 8 characters long.")

        return cleaned_data


class PersonalInfoForm1(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'email',
                  'contact', 'address', 'pin_code', 'profile_photo']
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder': 'First Name', 'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Last Name', 'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'placeholder': 'example@gmail.com', 'class': 'form-control'}),
            'contact': forms.TextInput(attrs={'placeholder': '+91XXXXXXXXXX', 'value': '+91', 'class': 'form-control'}),
            'address': forms.Textarea(attrs={'placeholder': 'Enter your full address', 'class': 'portfolio-textarea', 'rows': 1}),
            'pin_code': forms.TextInput(attrs={'placeholder': '6-digit PIN', 'class': 'form-control'}),
            'profile_photo': forms.ClearableFileInput(attrs={'class': 'form-control-file'})
        }

    def clean_first_name(self):
        data = self.cleaned_data.get('first_name')
        if not re.match(r"^[A-Za-z\s\-']+$", data):
            raise forms.ValidationError(
                "First name can only contain letters, spaces, hyphens, and apostrophes.")
        return data

    def clean_last_name(self):
        data = self.cleaned_data.get('last_name')
        if not re.match(r"^[A-Za-z\s\-']+$", data):
            raise forms.ValidationError(
                "Last name can only contain letters, spaces, hyphens, and apostrophes.")
        return data

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise forms.ValidationError("Enter a valid email address.")
        return email

    def clean_contact(self):
        contact = self.cleaned_data.get('contact')
        if not re.match(r"^(\+91)?[6-9]\d{9}$", contact):
            raise forms.ValidationError(
                "Enter a valid 10-digit Indian number with optional +91.")
        return contact

    def clean_pin_code(self):
        pin = self.cleaned_data.get('pin_code')
        if not re.match(r"^\d{6}$", pin):
            raise forms.ValidationError("PIN code must be exactly 6 digits.")
        return pin

    def clean_profile_photo(self):
        photo = self.cleaned_data.get('profile_photo')

        if self.files.get('profile_photo'):  # only check if new file is uploaded
            if photo.size > 2 * 1024 * 1024:
                raise forms.ValidationError(
                    "Profile photo must be smaller than 2MB.")
            if not photo.content_type in ['image/jpeg', 'image/png']:
                raise forms.ValidationError(
                    "Only JPG and PNG formats are allowed.")

        return photo


class PersonalInfoForm2(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = [
            'github_link',
            'facebook_link',
            'instagram_link',
            'other_social_link',
        ]
        widgets = {
            'github_link': forms.URLInput(attrs={'placeholder': 'https://github.com/username', 'class': 'form-control'}),
            'facebook_link': forms.URLInput(attrs={'placeholder': 'https://facebook.com/username', 'class': 'form-control'}),
            'instagram_link': forms.URLInput(attrs={'placeholder': 'https://instagram.com/username', 'class': 'form-control'}),
            'other_social_link': forms.URLInput(attrs={'placeholder': 'https://yourwebsite.com', 'class': 'form-control'}),
        }

    def clean_github_link(self):
        link = self.cleaned_data.get('github_link')
        if link and ("github.com" not in link or not re.match(r'^https?://', link)):
            raise ValidationError(
                "Please enter a valid GitHub URL (e.g., https://github.com/username).")
        return link

    def clean_facebook_link(self):
        link = self.cleaned_data.get('facebook_link')
        if link and ("facebook.com" not in link or not re.match(r'^https?://', link)):
            raise ValidationError(
                "Please enter a valid Facebook URL (e.g., https://facebook.com/yourprofile).")
        return link

    def clean_instagram_link(self):
        link = self.cleaned_data.get('instagram_link')
        if link and ("instagram.com" not in link or not re.match(r'^https?://', link)):
            raise ValidationError(
                "Please enter a valid Instagram URL (e.g., https://instagram.com/username).")
        return link

    def clean_other_social_link(self):
        link = self.cleaned_data.get('other_social_link')
        if link and not re.match(r'^https?://', link):
            raise ValidationError(
                "Please enter a valid URL starting with http:// or https://.")
        return link


class EducationForm(forms.ModelForm):
    CURRENT_YEAR = datetime.datetime.now().year
    YEAR_CHOICES = [(y, y)
                    for y in range(CURRENT_YEAR - 30, CURRENT_YEAR + 1)]
    MONTH_CHOICES = [(i, datetime.date(1900, i, 1).strftime('%B'))
                     for i in range(1, 13)]

    start_month = forms.ChoiceField(
        choices=MONTH_CHOICES,
        label='Start Month',
        initial=datetime.datetime.now().month,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    start_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        label='Start Year',
        initial=CURRENT_YEAR,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    end_month = forms.ChoiceField(
        choices=MONTH_CHOICES,
        label='End Month',
        required=False,
        initial=datetime.datetime.now().month,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    end_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        label='End Year',
        required=False,
        initial=CURRENT_YEAR,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )

    class Meta:
        model = Education
        fields = ['institution', 'location', 'degree',
                  'start_month', 'start_year', 'end_month', 'end_year', 'description']

        widgets = {
            'institution': forms.TextInput(attrs={
                'placeholder': 'e.g. University of Delhi',
                'class': 'portfolio-input',
                'maxlength': 200
            }),
            'location': forms.TextInput(attrs={
                'placeholder': 'e.g. New Delhi, India',
                'class': 'portfolio-input',
                'maxlength': 150
            }),
            'degree': forms.TextInput(attrs={
                'placeholder': 'e.g. Bachelor of Science in Computer Science',
                'class': 'portfolio-input',
                'maxlength': 200
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Briefly describe your coursework, achievements or focus areas.',
                'rows': 1,
                'class': 'portfolio-textarea',
                'maxlength': 500
            })
        }

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        if description:
            if len(description) > 500:
                raise ValidationError(
                    "Description cannot exceed 500 characters.")
            if len(description) < 10:
                raise ValidationError(
                    "Description must be at least 10 characters long.")
        return description

    def clean_institution(self):
        institution = self.cleaned_data.get('institution', '').strip()
        if len(institution) > 200:
            raise ValidationError(
                "Institution name cannot exceed 200 characters.")
        return institution

    def clean_location(self):
        location = self.cleaned_data.get('location', '').strip()
        if len(location) > 150:
            raise ValidationError("Location cannot exceed 150 characters.")
        return location

    def clean_degree(self):
        degree = self.cleaned_data.get('degree', '').strip()
        if len(degree) > 200:
            raise ValidationError("Degree name cannot exceed 200 characters.")
        return degree

    def clean(self):
        cleaned_data = super().clean()
        start_year = int(cleaned_data.get('start_year') or 0)
        start_month = int(cleaned_data.get('start_month') or 1)
        end_year = cleaned_data.get('end_year')
        end_month = cleaned_data.get('end_month')

        if end_year and end_month:
            end_year = int(end_year)
            end_month = int(end_month)
            start_date = datetime.date(start_year, start_month, 1)
            end_date = datetime.date(end_year, end_month, 1)

            if end_date < start_date:
                raise ValidationError("End date cannot be before start date.")

        return cleaned_data


# forms.py


class ExperienceForm(forms.ModelForm):
    MONTH_CHOICES = [(i, datetime.date(1900, i, 1).strftime('%B'))
                     for i in range(1, 13)]
    CURRENT_YEAR = datetime.datetime.now().year
    YEAR_CHOICES = [(y, y)
                    for y in range(CURRENT_YEAR - 30, CURRENT_YEAR + 1)]

    start_month = forms.ChoiceField(
        choices=MONTH_CHOICES,
        label='Start Month',
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    start_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        label='Start Year',
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    end_month = forms.ChoiceField(
        choices=MONTH_CHOICES,
        label='End Month',
        required=False,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    end_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        label='End Year',
        required=False,
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )

    class Meta:
        model = Experience
        fields = ['job_title', 'company_name', 'location', 'start_month',
                  'start_year', 'end_month', 'end_year', 'description']

        widgets = {
            'job_title': forms.TextInput(attrs={
                'placeholder': 'e.g. Software Engineer',
                'class': 'portfolio-input',
                'maxlength': 150
            }),
            'company_name': forms.TextInput(attrs={
                'placeholder': 'e.g. Infosys, Google',
                'class': 'portfolio-input',
                'maxlength': 200
            }),
            'location': forms.TextInput(attrs={
                'placeholder': 'e.g. Bengaluru, India or Remote',
                'class': 'portfolio-input',
                'maxlength': 150
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Briefly describe your role, tools used, and achievements.',
                'class': 'portfolio-textarea',
                'rows': 1,
                'maxlength': 800
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Set default current year
        self.fields['start_year'].initial = self.CURRENT_YEAR
        self.fields['end_year'].initial = self.CURRENT_YEAR

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        if description:
            if len(description) > 800:
                raise ValidationError(
                    "Description cannot exceed 800 characters.")
            if len(description) < 15:
                raise ValidationError(
                    "Description must be at least 15 characters long.")
        return description

    def clean_job_title(self):
        job_title = self.cleaned_data.get('job_title', '').strip()
        if len(job_title) > 150:
            raise ValidationError("Job title cannot exceed 150 characters.")
        return job_title

    def clean_company_name(self):
        company_name = self.cleaned_data.get('company_name', '').strip()
        if len(company_name) > 200:
            raise ValidationError("Company name cannot exceed 200 characters.")
        return company_name

    def clean_location(self):
        location = self.cleaned_data.get('location', '').strip()
        if len(location) > 150:
            raise ValidationError("Location cannot exceed 150 characters.")
        return location

    def clean(self):
        cleaned_data = super().clean()
        start_year = int(cleaned_data.get('start_year') or 0)
        start_month = int(cleaned_data.get('start_month') or 1)
        end_year = int(cleaned_data.get('end_year') or 0)
        end_month = int(cleaned_data.get('end_month') or 1)

        if end_year and end_month:
            start_date = datetime.date(start_year, start_month, 1)
            end_date = datetime.date(end_year, end_month, 1)
            if end_date < start_date:
                raise ValidationError("End date must be after start date.")
        return cleaned_data


ExperienceFormSet = inlineformset_factory(
    StudentPortfolio,
    Experience,
    form=ExperienceForm,
    extra=0,
    can_delete=True
)


class ProjectForm(forms.ModelForm):
    PROJECT_TYPE_CHOICES = [
        ('personal', 'Personal Project'),
        ('academic', 'Academic Project'),
        ('freelance', 'Freelance Work'),
        ('contribution', 'Open Source Contribution'),
        ('other', 'Other'),
    ]

    project_type = forms.ChoiceField(
        choices=PROJECT_TYPE_CHOICES,
        label="Project Type",
        required=False,
        widget=forms.Select(attrs={
            'class': 'portfolio-select'
        })
    )

    class Meta:
        model = Project
        fields = [
            'title',
            'description',
            'link',
            'technologies_used',
            'project_type'
        ]

        widgets = {
            'title': forms.TextInput(attrs={
                'placeholder': 'e.g. AI-powered Resume Builder',
                'class': 'portfolio-input',
                'maxlength': 100
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Describe your project, your role, key achievements, tools used, etc.',
                'class': 'portfolio-textarea',
                'rows': 1,
                'maxlength': 1000
            }),
            'link': forms.URLInput(attrs={
                'placeholder': 'e.g. https://github.com/yourname/project (optional)',
                'class': 'portfolio-input'
            }),
            'technologies_used': forms.TextInput(attrs={
                'placeholder': 'e.g. Django, React, PostgreSQL',
                'class': 'portfolio-input',
                'maxlength': 300
            }),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not title:
            raise ValidationError("Title is required.")
        if len(title) < 3:
            raise ValidationError("Title must be at least 3 characters long.")
        return title

    def clean_description(self):
        description = self.cleaned_data.get('description')
        if not description:
            raise ValidationError("Description cannot be empty.")
        if len(description) > 1000:
            raise ValidationError("Description cannot exceed 1000 characters.")
        if len(description) < 10:
            raise ValidationError(
                "Description must be at least 10 characters long.")
        return description

    def clean_link(self):
        link = self.cleaned_data.get('link')
        if link and not re.match(r'^https?://', link):
            raise ValidationError(
                "Link must be a valid URL starting with http:// or https://")
        return link

    def clean_technologies_used(self):
        tech = self.cleaned_data.get('technologies_used')
        if tech and len(tech) > 300:
            raise ValidationError(
                "Technologies field is too long (maximum 300 characters).")
        return tech

    def clean(self):
        cleaned_data = super().clean()
        title = cleaned_data.get('title')
        description = cleaned_data.get('description')

        if title and description and title.lower() in description.lower():
            raise ValidationError(
                "Project description should not just repeat the title.")

        return cleaned_data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'DELETE' in self.fields:
            self.fields['DELETE'].widget = forms.HiddenInput()


class SkillForm(forms.ModelForm):
    class Meta:
        model = Skill
        fields = ['name', 'level']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'portfolio-input',
                'placeholder': 'e.g., Python, JavaScript, Leadership'
            }),
            'level': forms.Select(attrs={
                'class': 'portfolio-select'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = False
        self.fields['level'].required = False

    def clean(self):
        cleaned_data = super().clean()
        name = cleaned_data.get('name')
        level = cleaned_data.get('level')

        # If either field is filled, both should be filled
        if name and name.strip() and not level:
            raise ValidationError(
                "Please select a proficiency level for this skill.")
        if level and not (name and name.strip()):
            raise ValidationError("Please enter a skill name.")

        return cleaned_data

    def is_empty(self):
        """Check if the form is empty (for formset validation)"""
        return not (self.cleaned_data.get('name') and self.cleaned_data.get('level'))


class ExtrasForm(forms.ModelForm):
    # Add fields that don't exist in model as form fields
    date_of_birth = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
    )
    nationality = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(
            attrs={'placeholder': 'e.g., Indian', 'class': 'form-control'})
    )
    marital_status = forms.ChoiceField(
        choices=[('', 'Select'), ('single', 'Single'), ('married',
                                                        'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')],
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = UserProfile
        fields = ['extracurricular', 'resume']
        widgets = {
            'extracurricular': forms.Textarea(attrs={'rows': 4, 'placeholder': 'E.g., Debate Club, Football Team Captain, Volunteer at NGO...', 'class': 'form-control'}),
            'resume': forms.ClearableFileInput(attrs={'class': 'form-control-file'})
        }

    def clean_extracurricular(self):
        extra = self.cleaned_data.get('extracurricular', '').strip()
        if extra and len(extra) < 10:
            raise ValidationError(
                "Please provide more details about your extracurricular activities.")
        return extra

    def clean_resume(self):
        resume = self.cleaned_data.get('resume')
        if resume and hasattr(resume, 'name') and not resume.name.endswith(('.pdf', '.doc', '.docx')):
            raise ValidationError("Only PDF or Word documents are allowed.")
        return resume


EducationFormSet = inlineformset_factory(
    StudentPortfolio,
    Education,
    form=EducationForm,
    extra=0,
    can_delete=True
)

SkillFormSet = inlineformset_factory(
    StudentPortfolio,
    Skill,
    form=SkillForm,
    extra=0,
    can_delete=False
)

ProjectFormSet = inlineformset_factory(
    StudentPortfolio,
    Project,
    form=ProjectForm,
    extra=0,
    can_delete=False
)


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = [
            'profile_photo', 'first_name', 'last_name', 'address',
            'contact', 'pin_code', 'email', 'github_link',
            'facebook_link', 'instagram_link', 'other_social_link',
            'extracurricular', 'resume'
        ]


class CertificationForm(forms.ModelForm):
    MONTH_CHOICES = [(i, datetime.date(1900, i, 1).strftime('%B'))
                     for i in range(1, 13)]
    CURRENT_YEAR = datetime.datetime.now().year
    YEAR_CHOICES = [(y, y)
                    for y in range(CURRENT_YEAR - 30, CURRENT_YEAR + 1)]

    issue_month = forms.ChoiceField(
        choices=MONTH_CHOICES,
        label='Issue Month',
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )
    issue_year = forms.ChoiceField(
        choices=YEAR_CHOICES,
        label='Issue Year',
        widget=forms.Select(attrs={'class': 'portfolio-select'})
    )

    class Meta:
        model = Certification
        fields = ['name', 'issuer', 'issue_month', 'issue_year', 'description']

        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': 'e.g. AWS Certified Solutions Architect',
                'class': 'portfolio-input',
                'maxlength': 200
            }),
            'issuer': forms.TextInput(attrs={
                'placeholder': 'e.g. Amazon Web Services',
                'class': 'portfolio-input',
                'maxlength': 200
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Briefly describe what this certification covers and its significance.',
                'class': 'portfolio-textarea',
                'rows': 1,
                'maxlength': 400
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['issue_year'].initial = self.CURRENT_YEAR

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        if description:
            if len(description) > 400:
                raise ValidationError(
                    "Description cannot exceed 400 characters.")
            if len(description) < 10:
                raise ValidationError(
                    "Description must be at least 10 characters long.")
        return description

    def clean_name(self):
        name = self.cleaned_data.get('name', '').strip()
        if len(name) > 200:
            raise ValidationError(
                "Certification name cannot exceed 200 characters.")
        return name

    def clean_issuer(self):
        issuer = self.cleaned_data.get('issuer', '').strip()
        if len(issuer) > 200:
            raise ValidationError("Issuer name cannot exceed 200 characters.")
        return issuer

    def clean_issue_date(self):
        issue_date = self.cleaned_data.get('issue_date')
        if issue_date and issue_date > datetime.date.today():
            raise ValidationError("Issue date cannot be in the future.")
        return issue_date


class LanguageForm(forms.ModelForm):
    class Meta:
        model = Language
        fields = ['name', 'proficiency']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'portfolio-input',
                'placeholder': 'e.g., English, Spanish, French'
            }),
            'proficiency': forms.Select(attrs={
                'class': 'portfolio-select'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = False
        self.fields['proficiency'].required = False

    def clean(self):
        cleaned_data = super().clean()
        name = cleaned_data.get('name')
        proficiency = cleaned_data.get('proficiency')

        # If either field is filled, both should be filled
        if name and not proficiency:
            raise ValidationError(
                "Please select a proficiency level for this language.")
        if proficiency and not name:
            raise ValidationError("Please enter a language name.")

        return cleaned_data


class HobbyForm(forms.ModelForm):
    class Meta:
        model = Hobby
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'portfolio-input',
                'placeholder': 'e.g., Painting, Reading, Hiking'
            })
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        # Make optional for formsets to avoid empty form validation errors
        self.fields['name'].required = False

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name and name.strip():
            if name.isdigit():
                raise ValidationError("Hobby name cannot be a number.")
            return name.strip()
        return name

    def is_empty(self):
        """Check if the form is empty (for formset validation)"""
        return not self.cleaned_data.get('name')


class SummaryForm(forms.ModelForm):
    class Meta:
        model = Summary
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'rows': 5,
                'placeholder': 'Write a compelling summary that highlights your key strengths, career objectives, and what makes you unique...',
                'class': 'portfolio-textarea',
                'maxlength': 1000
            })
        }

    def clean_content(self):
        content = self.cleaned_data.get('content', '').strip()

        # Check if content is empty
        if not content:
            raise ValidationError("Summary cannot be empty.")

        # Check if content is too short
        if len(content) < 30:
            raise ValidationError(
                "Summary must be at least 30 characters long.")

        # Check if content is too long
        if len(content) > 1000:
            raise ValidationError(
                "Summary cannot exceed 1000 characters.")

        # Check if content is just numbers or symbols
        if content.isdigit() or not any(char.isalpha() for char in content):
            raise ValidationError(
                "Please write a valid summary using meaningful words.")

        return content


class BlockUserForm(forms.Form):
    reason = forms.CharField(widget=forms.Textarea,
                             required=True, label="Reason for blocking")


# New forms for agent approval system

class StudentInvitationForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.agent = kwargs.pop('agent', None)
        super().__init__(*args, **kwargs)

    """Form for agents to create student invitations (pending admin approval)"""
    class Meta:
        model = StudentInvitation
        fields = ['student_email', 'student_username',
                  'student_first_name', 'student_last_name']
        widgets = {
            'student_email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Student email'}),
            'student_username': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Student username'}),
            'student_first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'First name'}),
            'student_last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Last name'}),
        }

    def clean_student_username(self):
        username = self.cleaned_data['student_username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("Username already exists")
        return username

    def clean_student_email(self):
        email = self.cleaned_data['student_email']
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already exists")
        # Prevent duplicate invitation for same agent and email
        agent = self.agent
        if agent and self.instance._state.adding:
            from .models import StudentInvitation
            if StudentInvitation.objects.filter(agent=agent.userprofile, student_email=email).exists():
                raise forms.ValidationError(
                    "You have already invited this email address.")
        return email


class AdminApprovalForm(forms.ModelForm):
    """Form for admin to approve/reject student invitations"""
    class Meta:
        model = StudentInvitation
        fields = ['status', 'rejection_reason']
        widgets = {
            'status': forms.Select(attrs={'class': 'form-control'}),
            'rejection_reason': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Reason for rejection (optional)'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['status'].choices = [
            ('approved', 'Approve'),
            ('rejected', 'Reject'),
        ]
        self.fields['rejection_reason'].required = False


class AgentBulkPaymentForm(forms.ModelForm):
    """Form for agent bulk payments"""
    class Meta:
        model = AgentPayment
        fields = ['student_count']
        widgets = {
            'student_count': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'readonly': True}),
        }

    def __init__(self, *args, **kwargs):
        self.agent = kwargs.pop('agent', None)
        super().__init__(*args, **kwargs)

        if self.agent:
            # Count pending approved invitations
            pending_count = StudentInvitation.objects.filter(
                agent=self.agent,
                status='approved',
                student_user__isnull=False
            ).exclude(agent_payments__status='completed').count()

            self.fields['student_count'].initial = pending_count

    def clean_student_count(self):
        student_count = self.cleaned_data['student_count']
        if student_count < 1:
            raise forms.ValidationError("Must select at least 1 student")
        return student_count


class StudentPaymentForm(forms.ModelForm):
    """Form for student payments with new pricing"""
    class Meta:
        model = StudentPayment
        fields = ['amount_paid']
        widgets = {
            'amount_paid': forms.NumberInput(attrs={'class': 'form-control', 'readonly': True}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['amount_paid'].initial = 1499.00  # Discounted price


# Define a basic list of prohibited words (you can expand this)
BAD_WORDS = [
    'badword1', 'badword2', 'idiot', 'stupid', 'nonsense', 'damn', 'hell'
]


class SuccessStoryForm(forms.ModelForm):
    class Meta:
        model = SuccessStory
        fields = ['title', 'story']

    def clean_story(self):
        story_text = self.cleaned_data.get('story', '')
        for word in BAD_WORDS:
            pattern = re.compile(rf'\b{re.escape(word)}\b', re.IGNORECASE)
            if pattern.search(story_text):
                raise forms.ValidationError(
                    "Your story contains inappropriate language. Please remove it and try again.")
        return story_text

    def clean_title(self):
        title = self.cleaned_data.get('title', '')
        for word in BAD_WORDS:
            pattern = re.compile(rf'\b{re.escape(word)}\b', re.IGNORECASE)
            if pattern.search(title):
                raise forms.ValidationError(
                    "Your title contains inappropriate language. Please choose a more appropriate title.")
        return title
