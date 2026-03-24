from django.core.management.base import BaseCommand
from Services.models import Service
from Authentication.models import FreelancerProfile
import random

class Command(BaseCommand):
    help = "Genera servicios coherentes según el perfil del freelancer"

    def handle(self, *args, **kwargs):

        # 🔥 Limpia servicios anteriores (opcional)
        Service.objects.all().delete()

        # 🎯 Catálogo coherente
        services_catalog = {
            "desarrollo": [
                "Desarrollo web con React y Django",
                "API REST profesional",
                "Landing page moderna",
                "Aplicación fullstack",
                "Optimización de backend",
            ],
            "diseno": [
                "Diseño UI/UX en Figma",
                "Prototipos interactivos",
                "Diseño de app móvil",
                "Rediseño de interfaz",
                "Sistema de diseño",
            ],
            "marketing": [
                "Campañas en redes sociales",
                "SEO para posicionamiento",
                "Marketing digital completo",
                "Publicidad en Instagram",
                "Estrategia de contenido",
            ],
            "video": [
                "Edición de video profesional",
                "Contenido para redes sociales",
                "Animaciones básicas",
            ],
            "data": [
                "Análisis de datos con Python",
                "Dashboards en Power BI",
                "Machine Learning básico",
            ]
        }

        freelancers = FreelancerProfile.objects.all()

        for freelancer in freelancers:
            bio = freelancer.bio.lower()

            # 🔍 Detectar categoría según bio
            if "react" in bio or "django" in bio or "developer" in bio:
                category = "desarrollo"
            elif "ui" in bio or "ux" in bio or "figma" in bio:
                category = "diseno"
            elif "marketing" in bio or "seo" in bio:
                category = "marketing"
            elif "video" in bio:
                category = "video"
            elif "data" in bio or "analyst" in bio:
                category = "data"
            else:
                category = random.choice(["desarrollo", "diseno", "marketing"])

            # 🎯 Generar servicios coherentes
            for i in range(random.randint(2, 4)):
                title = random.choice(services_catalog[category])

                Service.objects.create(
                    title=title,
                    description=f"{title}. Servicio profesional y de alta calidad.",
                    category=category,
                    freelancer=freelancer
                )

        self.stdout.write(self.style.SUCCESS("🔥 Servicios coherentes creados correctamente"))