from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from users.models import Referral, ReferralPayout

class Command(BaseCommand):
    help = "Process weekly payouts for agents"

    def handle(self, *args, **kwargs):
        agents = User.objects.filter(userprofile__user_type='agent')

        for agent in agents:
            unpaid_referrals = Referral.objects.filter(
                referrer=agent,
                is_converted=True,
                referralpayout__isnull=True
            )

            if unpaid_referrals.exists():
                total = unpaid_referrals.count()
                amount = total * 100  # ₹100 per referral

                payout = ReferralPayout.objects.create(
                    agent=agent,
                    amount=amount,
                )
                payout.referrals_paid.set(unpaid_referrals)
                payout.save()

                self.stdout.write(f"✅ Paid ₹{amount} to {agent.username} for {total} referrals.")
            else:
                self.stdout.write(f"ℹ️ No referrals to pay for {agent.username}")
