from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    country = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return self.username
    
class ClientProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="client_profile"
    )
    enterprise_name = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Client: {self.user.username}"
    
class FreelancerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="freelancer_profile"
    )
    bio = models.TextField()
    age = models.PositiveIntegerField()
    cv = models.FileField(upload_to="cvs/", blank=True, null=True)

    def __str__(self):
        return f"Freelancer: {self.user.username}"