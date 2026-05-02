from django.contrib.auth import get_user_model
from django.db import transaction

from Authentication.models import ClientProfile, FreelancerProfile


class UserRegistrationService:

    @staticmethod
    @transaction.atomic
    def register_user(validated_data, raw_data):
        User = get_user_model()

        full_name = (validated_data.get("nombre") or "").strip()
        user_type = validated_data.get("userType")
        enterprise_name = validated_data.get("enterpriseName")
        bio = validated_data.get("bio")
        date_of_birth = raw_data.get("date_of_birth")

        username = validated_data.get("username")

        if User.objects.filter(username=username).exists():
            raise ValueError("El usuario ya existe")

        # dividir nombre
        name_parts = full_name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        # crear usuario
        user = User.objects.create_user(
            username=username,
            email=validated_data.get("email"),
            password=validated_data.get("password"),
            first_name=first_name,
            last_name=last_name,
            country=validated_data.get("country", ""),
            city=validated_data.get("city", "")
        )

        # crear perfil
        if user_type == "cliente":
            ClientProfile.objects.create(
                user=user,
                enterprise_name=enterprise_name or "",
                bank_name=raw_data.get("bankName", ""),
                bank_account_number=raw_data.get("bankAccountNumber", "")
            )

        elif user_type == "freelancer":
            FreelancerProfile.objects.create(
                user=user,
                bio=bio or "",
                date_of_birth=date_of_birth if date_of_birth else None
            )

        else:
            raise ValueError("Tipo de usuario inválido")

        return user
