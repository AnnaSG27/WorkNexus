from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("Authentication", "0001_initial"),
        ("Projects", "0002_project_workflow_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("comment", models.TextField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("client", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews_given", to="Authentication.clientprofile")),
                ("freelancer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews_received", to="Authentication.freelancerprofile")),
                ("project", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="review", to="Projects.project")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
