from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import UserProfile, StudentPortfolio


class PersonalInfoCompletionTest(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            first_name='',
            last_name='',
            email='',
            contact='',
            address='',
            pin_code=''
        )
        self.portfolio = StudentPortfolio.objects.create(
            user=self.user,
            user_profile=self.user_profile,
            status='in_progress'
        )

    def test_is_personal_info_completed_empty(self):
        """Test that empty personal info returns False"""
        from .views import is_personal_info_completed
        self.assertFalse(is_personal_info_completed(self.portfolio))

    def test_is_personal_info_completed_partial(self):
        """Test that partial personal info returns False"""
        from .views import is_personal_info_completed
        self.user_profile.first_name = 'John'
        self.user_profile.last_name = 'Doe'
        self.user_profile.save()
        self.assertFalse(is_personal_info_completed(self.portfolio))

    def test_is_personal_info_completed_full(self):
        """Test that complete personal info returns True"""
        from .views import is_personal_info_completed
        self.user_profile.first_name = 'John'
        self.user_profile.last_name = 'Doe'
        self.user_profile.email = 'john@example.com'
        self.user_profile.contact = '1234567890'
        self.user_profile.address = '123 Main St'
        self.user_profile.pin_code = '123456'
        self.user_profile.save()
        self.assertTrue(is_personal_info_completed(self.portfolio))

    def test_education_view_redirects_without_personal_info(self):
        """Test that education view redirects when personal info is incomplete"""
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(
            reverse('add_education', kwargs={'pk': self.portfolio.pk}))
        self.assertEqual(response.status_code, 302)  # Redirect
        self.assertIn('personal_info1', response.url)

    def test_education_view_works_with_personal_info(self):
        """Test that education view works when personal info is complete"""
        # Complete personal info
        self.user_profile.first_name = 'John'
        self.user_profile.last_name = 'Doe'
        self.user_profile.email = 'john@example.com'
        self.user_profile.contact = '1234567890'
        self.user_profile.address = '123 Main St'
        self.user_profile.pin_code = '123456'
        self.user_profile.save()

        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(
            reverse('add_education', kwargs={'pk': self.portfolio.pk}))
        self.assertEqual(response.status_code, 200)  # Success

    def test_step_completion_logic(self):
        """Test that individual step completion logic works correctly"""
        from .views import calculate_portfolio_progress

        # Initially no steps should be completed
        progress_data = calculate_portfolio_progress(self.portfolio)
        # Personal info not complete
        self.assertFalse(progress_data['step_completion'][1])

        # Complete personal info
        self.user_profile.first_name = 'John'
        self.user_profile.last_name = 'Doe'
        self.user_profile.email = 'john@example.com'
        self.user_profile.contact = '1234567890'
        self.user_profile.address = '123 Main St'
        self.user_profile.pin_code = '123456'
        self.user_profile.save()

        # Now personal info should be complete, but others should not
        progress_data = calculate_portfolio_progress(self.portfolio)
        # Personal info complete
        self.assertTrue(progress_data['step_completion'][1])
        # Education not complete
        self.assertFalse(progress_data['step_completion'][2])
        # Projects not complete
        self.assertFalse(progress_data['step_completion'][3])
        # Experience not complete
        self.assertFalse(progress_data['step_completion'][4])
