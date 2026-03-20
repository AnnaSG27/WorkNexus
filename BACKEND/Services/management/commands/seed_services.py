from django.core.management.base import BaseCommand
from Services.models import Service
from django.contrib.auth import get_user_model
import random

class Command(BaseCommand):
    help = 'Genera servicios de prueba'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        user = User.objects.first()

        categories = ["desarrollo", "diseno", "marketing"]

        titles = {
            "desarrollo": [
                "Desarrollo web profesional",
                "App en React + Django",
                "Backend con Django REST",
            ],
            "diseno": [
                "Diseño UI/UX moderno",
                "Prototipos en Figma",
            ],
            "marketing": [
                "Marketing digital",
                "SEO profesional",
            ],
        }

        descriptions = [
            "Alta calidad",
            "Entrega rápida",
            "Trabajo profesional",
        ]

        for i in range(50):
            category = random.choice(categories)
            title = random.choice(titles[category])
            description = random.choice(descriptions)

            Service.objects.create(
                title=title,
                description=description,
                category=category,
                user=user
            )

        self.stdout.write(self.style.SUCCESS("✅ Servicios creados"))