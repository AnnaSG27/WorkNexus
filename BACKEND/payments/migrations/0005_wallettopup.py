# Generated manually for wallet top-ups.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("Authentication", "0004_clientprofile_bank_fields"),
        ("payments", "0004_payment_method_payment_processor_reference"),
    ]

    operations = [
        migrations.CreateModel(
            name="WalletTopUp",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="cop", max_length=10)),
                ("stripe_payment_intent", models.CharField(blank=True, max_length=255, null=True)),
                ("stripe_client_secret", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("paid", "Paid"),
                            ("failed", "Failed"),
                            ("canceled", "Canceled"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "client",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wallet_topups",
                        to="Authentication.clientprofile",
                    ),
                ),
            ],
        ),
    ]
