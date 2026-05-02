from django.db import models
from Authentication.models import ClientProfile
from order.models import Order  # ajusta el import según tu app

class Payment(models.Model):
    METHOD_CHOICES = [
        ("stripe", "Stripe"),
        ("wallet", "Wallet"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("released", "Released"),
    ]

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    currency = models.CharField(max_length=10, default="cop")
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="stripe")
    processor_reference = models.CharField(max_length=255, null=True, blank=True)

    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True)
    stripe_client_secret = models.CharField(max_length=255, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order {self.order.id} - {self.status}"


class WalletTopUp(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("canceled", "Canceled"),
    ]

    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="wallet_topups")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="cop")
    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True)
    stripe_client_secret = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet top-up {self.id} for Client {self.client.id} - {self.status}"
