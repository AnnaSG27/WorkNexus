from django.db import models

from Authentication.models import ClientProfile, FreelancerProfile


class Project(models.Model):
    CATEGORY_CHOICES = [
        ("desarrollo", "Desarrollo"),
        ("diseno", "Diseno"),
        ("marketing", "Marketing"),
        ("contenido", "Contenido"),
        ("soporte", "Soporte"),
        ("otros", "Otros"),
    ]
    STATUS_CHOICES = [
        ("abierto", "Abierto"),
        ("en_revision", "En revision"),
        ("en_ejecucion", "En ejecucion"),
        ("finalizado", "Finalizado"),
        ("cerrado", "Cerrado"),
    ]
    MODALITY_CHOICES = [
        ("remoto", "Remoto"),
        ("hibrido", "Hibrido"),
        ("presencial", "Presencial"),
    ]

    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="otros")
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    timeline = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=120, blank=True)
    skills = models.CharField(max_length=255, blank=True)
    reference_url = models.URLField(blank=True)
    deadline = models.DateField(blank=True, null=True)
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, default="remoto")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="abierto")
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.client.user.username}"


class ProjectApplication(models.Model):
    STATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("en_revision", "En revision"),
        ("aceptada", "Aceptada"),
        ("rechazada", "Rechazada"),
        ("retirada", "Retirada"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="applications")
    freelancer = models.ForeignKey(FreelancerProfile, on_delete=models.CASCADE, related_name="project_applications")
    cover_letter = models.TextField(blank=True)
    proposed_budget = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendiente")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["project", "freelancer"], name="unique_project_application"),
        ]

    def __str__(self):
        return f"{self.freelancer.user.username} -> {self.project.title}"


class ProjectFavorite(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="favorites")
    freelancer = models.ForeignKey(FreelancerProfile, on_delete=models.CASCADE, related_name="favorite_projects")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["project", "freelancer"], name="unique_project_favorite"),
        ]

    def __str__(self):
        return f"{self.freelancer.user.username} ♥ {self.project.title}"
