from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("payments", "0005_wallettopup"),
    ]

    operations = [
        migrations.CreateModel(
            name="Factura",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("invoice_number", models.CharField(max_length=40, unique=True)),
                ("pdf_file", models.FileField(blank=True, upload_to="facturas/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "payment",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="factura",
                        to="payments.payment",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
