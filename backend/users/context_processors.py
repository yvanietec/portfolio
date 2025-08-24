from .models import StudentInvitation
from .models import StudentPortfolio


def user_portfolio(request):
    if request.user.is_authenticated:
        try:
            portfolio = StudentPortfolio.objects.filter(
                user=request.user).first()
            return {'portfolio': portfolio}
        except Exception:
            # Handle any database errors gracefully
            return {'portfolio': None}
    return {'portfolio': None}


def pending_invitations_count(request):
    if request.user.is_authenticated and request.user.is_staff:
        count = StudentInvitation.objects.filter(status='pending').count()
        return {'pending_invitations_count': count}
    return {}
