from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("Authentication", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("desarrollo", "Desarrollo"),
                            ("diseno", "Diseno"),
                            ("marketing", "Marketing"),
                            ("contenido", "Contenido"),
                            ("soporte", "Soporte"),
                            ("otros", "Otros"),
                        ],
                        default="otros",
                        max_length=50,
                    ),
                ),
                ("budget", models.DecimalField(decimal_places=2, max_digits=10)),
                ("timeline", models.CharField(blank=True, max_length=120)),
                ("location", models.CharField(blank=True, max_length=120)),
                ("is_open", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "client",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="projects",
                        to="Authentication.clientprofile",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ProjectApplication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("cover_letter", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "freelancer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_applications",
                        to="Authentication.freelancerprofile",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="applications",
                        to="Projects.project",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="projectapplication",
            constraint=models.UniqueConstraint(fields=("project", "freelancer"), name="unique_project_application"),
        ),
    ]
