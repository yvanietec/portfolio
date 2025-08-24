from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Debug user profile issues'

    def handle(self, *args, **options):
        self.stdout.write("=== USER PROFILE DEBUG TEST ===")

        # Get all users
        users = User.objects.all()
        self.stdout.write(f"Total users: {users.count()}")

        for user in users:
            self.stdout.write(f"\nUser: {user.username} (ID: {user.id})")
            self.stdout.write(f"  Active: {user.is_active}")
            self.stdout.write(f"  Staff: {user.is_staff}")
            self.stdout.write(f"  Last login: {user.last_login}")

            try:
                profile = UserProfile.objects.get(user=user)
                self.stdout.write(f"  Has profile: YES")
                self.stdout.write(f"  Profile ID: {profile.id}")
                self.stdout.write(f"  Date created: {profile.date_created}")
                self.stdout.write(f"  Full name: {profile.full_name}")
                self.stdout.write(f"  Email: {profile.email}")
                self.stdout.write(f"  Phone: {profile.phone}")

            except UserProfile.DoesNotExist:
                self.stdout.write(f"  Has profile: NO - THIS IS A PROBLEM!")

            except Exception as e:
                self.stdout.write(f"  Profile error: {type(e).__name__}: {e}")

        self.stdout.write("\n=== PROFILE STATISTICS ===")
        self.stdout.write(f"Total UserProfiles: {UserProfile.objects.count()}")
        self.stdout.write(
            f"Users without profiles: {users.count() - UserProfile.objects.count()}")

        # Check for any profile issues
        profiles_without_users = UserProfile.objects.filter(
            user__isnull=True).count()
        self.stdout.write(f"Profiles without users: {profiles_without_users}")

        self.stdout.write("\n=== RECENT PROFILES ===")
        recent_profiles = UserProfile.objects.order_by('-date_created')[:5]
        for profile in recent_profiles:
            self.stdout.write(
                f"Profile {profile.id}: {profile.user.username} - {profile.date_created}")
