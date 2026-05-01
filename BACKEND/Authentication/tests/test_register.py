import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from Authentication.models import ClientProfile, FreelancerProfile

@pytest.mark.django_db
def test_register_cliente():
    client = APIClient()

    data = {
        "nombre": "Empresa Test",
        "username": "cliente_test",
        "email": "cliente@test.com",
        "password": "Test1234!",
        "country": "Colombia",
        "city": "Medellin",
        "userType": "cliente",
        "enterpriseName": "Mi Empresa"
    }

    response = client.post("/auth/register/", data, format="json")

    assert response.status_code == 201

    User = get_user_model()
    user = User.objects.get(username="cliente_test")

    profile = ClientProfile.objects.get(user=user)

    assert profile.enterprise_name == "Mi Empresa"
    assert user.country == "Colombia"
    assert user.city == "Medellin"
    
@pytest.mark.django_db
def test_register_freelancer():
    client = APIClient()
    data = {
        "nombre": "Freelancer Test",
        "username": "freelancer_test",
        "email": "freelancer@test.com",
        "password": "Test1234!",
        "country": "Colombia",
        "city": "Bogota",
        "userType": "freelancer",
        "bio": "Soy desarrollador",
        "date_of_birth": "2000-01-01"
    }

    response = client.post("/auth/register/", data, format="json")
    assert response.status_code == 201
    User = get_user_model()
    user = User.objects.get(username="freelancer_test")
    
    profile = FreelancerProfile.objects.get(user=user)
    assert profile.bio == "Soy desarrollador"
    assert str(profile.date_of_birth) == "2000-01-01"