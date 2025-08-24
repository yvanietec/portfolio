from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Create UserProfile records for users who don\'t have them'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(userprofile__isnull=True)
        created_count = 0

        for user in users_without_profile:
            # Determine user type based on username or other criteria
            user_type = 'normal'
            if user.is_superuser or user.is_staff:
                user_type = 'agent'  # or could be 'normal' based on your business logic

            # Create UserProfile with basic information
            UserProfile.objects.create(
                user=user,
                user_type=user_type,
                first_name=user.first_name or user.username,
                last_name=user.last_name or '',
                address='',
                contact='',
                pin_code='',
                email=user.email or '',
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created profile for user: {user.username}')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} user profiles')
        )
