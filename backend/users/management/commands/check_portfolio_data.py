from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import StudentPortfolio, Skill, Language, Hobby


class Command(BaseCommand):
    help = 'Check portfolio data for debugging'

    def handle(self, *args, **options):
        # Get the first user (or you can specify a user)
        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('No users found'))
            return

        portfolio = StudentPortfolio.objects.filter(user=user).first()
        if not portfolio:
            self.stdout.write(self.style.ERROR(
                f'No portfolio found for user {user.username}'))
            return

        self.stdout.write(f'User: {user.username}')
        self.stdout.write(f'Portfolio ID: {portfolio.id}')
        self.stdout.write(f'Portfolio Status: {portfolio.status}')

        # Check skills
        skills = Skill.objects.filter(portfolio=portfolio)
        self.stdout.write(f'Skills count: {skills.count()}')
        for skill in skills:
            self.stdout.write(f'  - {skill.skill_name} ({skill.proficiency})')

        # Check languages
        languages = Language.objects.filter(portfolio=portfolio)
        self.stdout.write(f'Languages count: {languages.count()}')
        for lang in languages:
            self.stdout.write(f'  - {lang.language}')

        # Check hobbies
        hobbies = Hobby.objects.filter(portfolio=portfolio)
        self.stdout.write(f'Hobbies count: {hobbies.count()}')
        for hobby in hobbies:
            self.stdout.write(f'  - {hobby.hobby_name}')
