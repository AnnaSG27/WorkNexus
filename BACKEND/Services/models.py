from django.db import models
from django.conf import settings

class Service(models.Model):
    CATEGORY_CHOICES = [
        ("desarrollo", "Desarrollo"),
        ("diseno", "Diseño"),
        ("marketing", "Marketing"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.title