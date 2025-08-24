from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Activate a user account'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to activate')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f'User found: {user.username}')
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'Is active: {user.is_active}')

            if not user.is_active:
                user.is_active = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully activated user "{username}"')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User "{username}" was already active')
                )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist')
            )
