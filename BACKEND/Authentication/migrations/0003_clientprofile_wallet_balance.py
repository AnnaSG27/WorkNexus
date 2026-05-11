# Generated manually for payment dependency inversion.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Authentication", "0002_remove_freelancerprofile_age_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="wallet_balance",
            field=models.DecimalField(decimal_places=2, default=2000000, max_digits=12),
        ),
    ]
