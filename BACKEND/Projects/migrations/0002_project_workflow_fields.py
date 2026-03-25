from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("Authentication", "0001_initial"),
        ("Projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="deadline",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="modality",
            field=models.CharField(
                choices=[("remoto", "Remoto"), ("hibrido", "Hibrido"), ("presencial", "Presencial")],
                default="remoto",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="reference_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="project",
            name="skills",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="project",
            name="status",
            field=models.CharField(
                choices=[
                    ("abierto", "Abierto"),
                    ("en_revision", "En revision"),
                    ("en_ejecucion", "En ejecucion"),
                    ("finalizado", "Finalizado"),
                    ("cerrado", "Cerrado"),
                ],
                default="abierto",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="projectapplication",
            name="proposed_budget",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="projectapplication",
            name="status",
            field=models.CharField(
                choices=[
                    ("pendiente", "Pendiente"),
                    ("en_revision", "En revision"),
                    ("aceptada", "Aceptada"),
                    ("rechazada", "Rechazada"),
                    ("retirada", "Retirada"),
                ],
                default="pendiente",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="ProjectFavorite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "freelancer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorite_projects",
                        to="Authentication.freelancerprofile",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorites",
                        to="Projects.project",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="projectfavorite",
            constraint=models.UniqueConstraint(fields=("project", "freelancer"), name="unique_project_favorite"),
        ),
    ]
