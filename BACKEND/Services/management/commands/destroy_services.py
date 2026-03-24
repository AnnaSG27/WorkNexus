from django.core.management.base import BaseCommand
from Services.models import Service

""" class Command(BaseCommand):
    help = "Elimina TODOS los servicios de la base de datos"

    def handle(self, *args, **kwargs):
        total = Service.objects.count()

        Service.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(f"🗑️ {total} servicios eliminados correctamente")) """
