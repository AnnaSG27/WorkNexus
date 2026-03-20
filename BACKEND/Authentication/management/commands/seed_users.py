

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from Authentication.models import ClientProfile, FreelancerProfile
import random

class Command(BaseCommand):
    help = "Genera MUCHOS usuarios simulados (clientes y freelancers)"

    def handle(self, *args, **kwargs):
        User = get_user_model()

        # 🔥 Limpieza opcional (descomenta si quieres resetear)
        # User.objects.all().delete()

        countries = ["Colombia", "México", "Argentina", "Chile", "Perú", "España"]
        cities = ["Medellín", "Bogotá", "CDMX", "Buenos Aires", "Santiago", "Lima", "Madrid"]

        # 🔵 CLIENTES (empresas)
        enterprises = [
            "TechNova", "InnovaSoft", "Global Solutions", "NextGen Systems",
            "BlueWave", "DataCorp", "FutureLabs", "AlphaTech", "Visionary Group",
            "SkyNet Services", "DigitalCore", "Quantum Systems", "SmartFlow"
        ]

        for i in range(25):
            username = f"empresa_{i}"
            enterprise_name = random.choice(enterprises)

            user = User.objects.create_user(
                username=username,
                email=f"{username}@mail.com",
                password="password123",
                country=random.choice(countries),
                city=random.choice(cities),
            )

            ClientProfile.objects.create(
                user=user,
                enterprise_name=f"{enterprise_name} {i}"
            )

        # 🟢 FREELANCERS
        roles = [
            "Desarrollador fullstack",
            "Frontend developer",
            "Backend engineer",
            "Diseñador UI/UX",
            "Especialista en marketing",
            "Editor de video",
            "Data analyst",
            "DevOps engineer"
        ]

        techs = [
            "React", "Django", "Node.js", "Figma", "AWS",
            "Python", "Docker", "Kubernetes", "Next.js"
        ]

        for i in range(50):
            username = f"user_{i}"

            role = random.choice(roles)
            tech = random.choice(techs)

            bio = f"{role} con experiencia en {tech}. Trabajo profesional, rápido y escalable."

            user = User.objects.create_user(
                username=username,
                email=f"{username}@mail.com",
                password="password123",
                country=random.choice(countries),
                city=random.choice(cities),
            )

            FreelancerProfile.objects.create(
                user=user,
                bio=bio,
                age=random.randint(20, 40)
            )

        self.stdout.write(self.style.SUCCESS("🚀 Base de usuarios simulados creada con éxito"))