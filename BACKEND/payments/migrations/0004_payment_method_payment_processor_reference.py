# Generated manually for payment dependency inversion.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0003_alter_payment_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="method",
            field=models.CharField(
                choices=[("stripe", "Stripe"), ("wallet", "Wallet")],
                default="stripe",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="processor_reference",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
