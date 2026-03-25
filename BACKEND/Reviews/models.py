from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from Authentication.models import ClientProfile, FreelancerProfile
from Projects.models import Project


class Review(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="review")
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="reviews_given")
    freelancer = models.ForeignKey(FreelancerProfile, on_delete=models.CASCADE, related_name="reviews_received")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.project.title} - {self.rating} estrellas"

