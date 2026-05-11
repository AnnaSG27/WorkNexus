from abc import ABC, abstractmethod
from decimal import Decimal

import stripe
from django.conf import settings
from django.db import transaction

from .models import Payment


class PaymentProcessingError(Exception):
    pass


class PaymentProcessorInterface(ABC):
    @abstractmethod
    def create_payment(self, order, payment):
        pass

    @abstractmethod
    def confirm_payment(self, payment_identifier):
        pass

    @abstractmethod
    def cancel_payment(self, payment_identifier):
        pass


class StripePaymentProcessor(PaymentProcessorInterface):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_payment(self, order, payment):
        if payment.stripe_client_secret:
            return {
                "payment_id": payment.id,
                "method": payment.method,
                "client_secret": payment.stripe_client_secret,
            }

        amount = int(Decimal(order.agreed_budget) * 100)
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=payment.currency,
            metadata={"order_id": order.id},
        )

        payment.stripe_payment_intent = intent.id
        payment.stripe_client_secret = intent.client_secret
        payment.processor_reference = intent.id
        payment.save()

        return {
            "payment_id": payment.id,
            "method": payment.method,
            "client_secret": intent.client_secret,
        }

    def confirm_payment(self, payment_identifier):
        payment = Payment.objects.get(stripe_payment_intent=payment_identifier)
        payment.status = "paid"
        payment.save()

        order = payment.order
        order.status = "en_proceso"
        order.save()

        return {"message": "Payment completed successfully", "payment_id": payment.id}

    def cancel_payment(self, payment_identifier):
        payment = Payment.objects.get(id=payment_identifier, method="stripe")

        if payment.stripe_payment_intent:
            stripe.PaymentIntent.cancel(payment.stripe_payment_intent)

        payment_id = payment.id
        payment.delete()

        return {"message": "Stripe payment canceled", "payment_id": payment_id}


class WalletPaymentProcessor(PaymentProcessorInterface):
    def create_payment(self, order, payment):
        if payment.status == "paid":
            return {
                "payment_id": payment.id,
                "method": payment.method,
                "message": "Payment already completed with wallet balance",
            }

        client = order.client.__class__.objects.get(id=order.client_id)
        amount = Decimal(order.agreed_budget)

        if client.wallet_balance < amount:
            payment.status = "failed"
            payment.save()
            raise PaymentProcessingError("Insufficient wallet balance")

        client.wallet_balance -= amount
        client.save(update_fields=["wallet_balance"])

        payment.status = "paid"
        payment.processor_reference = f"wallet-{payment.id}"
        payment.save()

        order.status = "en_proceso"
        order.save(update_fields=["status", "updated_at"])

        return {
            "payment_id": payment.id,
            "method": payment.method,
            "message": "Payment completed with wallet balance",
            "wallet_balance": str(client.wallet_balance),
        }

    def confirm_payment(self, payment_identifier):
        payment = Payment.objects.get(id=payment_identifier, method="wallet")
        return {"message": "Payment already completed with wallet balance", "payment_id": payment.id}

    def cancel_payment(self, payment_identifier):
        raise PaymentProcessingError("Wallet payments are completed immediately and cannot be canceled")


def get_payment_processor(method):
    processors = {
        "stripe": StripePaymentProcessor,
        "wallet": WalletPaymentProcessor,
    }

    processor = processors.get(method)
    if not processor:
        raise PaymentProcessingError("Unsupported payment method")

    return processor()
