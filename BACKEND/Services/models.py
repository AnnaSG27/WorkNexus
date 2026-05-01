from django.db import models
from django.conf import settings
from Authentication.models import FreelancerProfile
from django.core.validators import MinValueValidator
from django.utils import timezone

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
    
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=1000)
    delivery_time = models.PositiveIntegerField(help_text="Días de entrega", default=7)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"{self.title} - {self.freelancer.user.username}"