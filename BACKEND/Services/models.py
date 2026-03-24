from django.db import models
from django.conf import settings
from Authentication.models import FreelancerProfile

class Service(models.Model):
    CATEGORY_CHOICES = [
        ("desarrollo", "Desarrollo"),
        ("diseno", "Diseño"),
        ("marketing", "Marketing"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    freelancer = models.ForeignKey(FreelancerProfile, on_delete=models.CASCADE, related_name="services")

    def __str__(self):
        return f"{self.title} - {self.freelancer.user.username}"