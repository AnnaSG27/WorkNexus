# Generated manually for wallet top-ups.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Authentication", "0003_clientprofile_wallet_balance"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="bank_account_number",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="bank_name",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
