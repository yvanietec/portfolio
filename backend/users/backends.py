# portfolio/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class NormalUserBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(username=username)
            if user.check_password(password) and not user.is_superuser and not hasattr(user, 'is_agent'):
                return user
        except User.DoesNotExist:
            return None

class AgentBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(username=username)
            if user.check_password(password) and hasattr(user, 'is_agent') and user.is_agent:
                return user
        except User.DoesNotExist:
            return None

class AdminBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(username=username)
            if user.check_password(password) and user.is_superuser:
                return user
        except User.DoesNotExist:
            return None