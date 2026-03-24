

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Imprime todos los usuarios con su tipo (cliente o freelancer)"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        users = User.objects.all()

        if not users.exists():
            self.stdout.write(self.style.WARNING("⚠️ No hay usuarios en la base de datos"))
            return

        for user in users:
            # Detectar tipo de usuario
            if hasattr(user, "client_profile"):
                user_type = "Cliente"
                extra = f"Empresa: {user.client_profile.enterprise_name}"
            elif hasattr(user, "freelancer_profile"):
                user_type = "Freelancer"
                extra = f"Edad: {user.freelancer_profile.age}"
            else:
                user_type = "Desconocido"
                extra = ""

            self.stdout.write(
                f"👤 {user.username} | {user.email} | {user.country}, {user.city} | {user_type} | {extra}"
            )

        self.stdout.write(self.style.SUCCESS("✅ Lista de usuarios mostrada correctamente"))