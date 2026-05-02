from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction

from Authentication.models import ClientProfile
from .models import WalletTopUp


class WalletTopUpError(Exception):
    pass


class WalletTopUpService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_topup(self, *, user_id, amount):
        client = ClientProfile.objects.filter(user_id=user_id).first()
        if not client:
            raise WalletTopUpError("Client profile not found")

        if not client.bank_name or not client.bank_account_number:
            raise WalletTopUpError("Bank account information is required before adding money")

        topup = WalletTopUp.objects.create(client=client, amount=amount)

        intent = stripe.PaymentIntent.create(
            amount=int(Decimal(amount) * 100),
            currency=topup.currency,
            automatic_payment_methods={"enabled": True},
            metadata={
                "topup_id": topup.id,
                "client_id": client.id,
                "purpose": "wallet_topup",
            },
        )

        topup.stripe_payment_intent = intent.id
        topup.stripe_client_secret = intent.client_secret
        topup.save()

        return {
            "topup_id": topup.id,
            "client_secret": intent.client_secret,
        }

    @transaction.atomic
    def confirm_topup(self, *, payment_intent_id):
        topup = WalletTopUp.objects.select_for_update().get(stripe_payment_intent=payment_intent_id)

        if topup.status == "paid":
            return {
                "message": "Wallet top-up already confirmed",
                "completed": True,
                "wallet_balance": str(topup.client.wallet_balance),
            }

        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status not in ["succeeded", "processing"]:
            return {
                "message": f"Wallet top-up is not completed yet. Stripe status: {intent.status}",
                "completed": False,
                "wallet_balance": str(topup.client.wallet_balance),
            }

        topup.status = "paid"
        topup.save(update_fields=["status"])

        client = ClientProfile.objects.select_for_update().get(id=topup.client_id)
        client.wallet_balance += topup.amount
        client.save(update_fields=["wallet_balance"])

        return {
            "message": "Wallet top-up completed",
            "completed": True,
            "wallet_balance": str(client.wallet_balance),
        }

    def cancel_topup(self, *, topup_id):
        topup = WalletTopUp.objects.get(id=topup_id, status="pending")

        if topup.stripe_payment_intent:
            stripe.PaymentIntent.cancel(topup.stripe_payment_intent)

        topup.status = "canceled"
        topup.save(update_fields=["status"])

        return {"message": "Wallet top-up canceled", "topup_id": topup.id}
