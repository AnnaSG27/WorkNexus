from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Authentication", "0004_clientprofile_bank_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientprofile",
            name="wallet_balance",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
