from django.db import models

from Authentication.models import ClientProfile, FreelancerProfile
from Projects.models import Project, ProjectApplication
from Services.models import Service


class Order(models.Model):
    SOURCE_CHOICES = [
        ("service", "Servicio"),
        ("project", "Proyecto"),
    ]
    STATUS_CHOICES = [
        ("sin_iniciar", "Sin iniciar"),
        ("en_proceso", "En proceso"),
        ("terminado", "Terminado"),
        ("cancelado", "Cancelado"),
    ]

    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="orders")
    freelancer = models.ForeignKey(FreelancerProfile, on_delete=models.CASCADE, related_name="orders")
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    application = models.OneToOneField(
        ProjectApplication,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    agreed_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="sin_iniciar")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_source_type_display()})"
