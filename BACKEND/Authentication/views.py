from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LoginSerializer, RegisterSerializer

from django.contrib.auth import authenticate, get_user_model, login as django_login
from .models import ClientProfile, FreelancerProfile
from .services.user_registration_service import UserRegistrationService


def _build_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _serialize_user(user, user_type):
    payload = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "displayName": _build_display_name(user),
        "firstName": user.first_name,
        "lastName": user.last_name,
        "country": user.country,
        "city": user.city,
        "userType": user_type,
    }

    if user_type == "cliente" and ClientProfile.objects.filter(user=user).exists():
        payload["enterpriseName"] = user.client_profile.enterprise_name
        payload["walletBalance"] = str(user.client_profile.wallet_balance)
        payload["bankName"] = user.client_profile.bank_name
        payload["bankAccountNumber"] = user.client_profile.bank_account_number
    elif user_type == "freelancer" and FreelancerProfile.objects.filter(user=user).exists():
        payload["bio"] = user.freelancer_profile.bio
        payload["date_of_birth"] = user.freelancer_profile.date_of_birth

    return payload



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = UserRegistrationService.register_user(
                serializer.validated_data,
                request.data
            )

            user_type = serializer.validated_data.get("userType")
            print("REQUEST DATA:", request.data)
            print("VALIDATED DATA:", serializer.validated_data)

            return Response(
                {
                    "message": "Usuario creado exitosamente",
                    "user": _serialize_user(user, user_type),
                },
                status=status.HTTP_201_CREATED,
            )

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")

        User = get_user_model()

        user_obj = User.objects.filter(email=identifier).first() or User.objects.filter(username=identifier).first()

        if not user_obj:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        user = authenticate(request, username=user_obj.username, password=password)

        if user is None:
            return Response({"error": "Credenciales invalidas"}, status=status.HTTP_401_UNAUTHORIZED)

        django_login(request, user)

        if ClientProfile.objects.filter(user=user).exists():
            user_type = "cliente"
        elif FreelancerProfile.objects.filter(user=user).exists():
            user_type = "freelancer"
        else:
            user_type = None

        return Response(
            {
                "message": "Login exitoso",
                "user": _serialize_user(user, user_type),
            },
            status=status.HTTP_200_OK,
        )


class EditProfileView(APIView):
    def put(self, request):
        data = request.data
        user_id = data.get("id")

        if not user_id:
            return Response({"error": "ID de usuario requerido"}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        user = User.objects.filter(id=user_id).first()

        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.first_name = data.get("firstName", user.first_name)
        user.last_name = data.get("lastName", user.last_name)
        user.country = data.get("country", user.country)
        user.city = data.get("city", user.city)
        user.save()

        user_type = data.get("userType")

        if user_type == "cliente" and ClientProfile.objects.filter(user=user).exists():
            profile = user.client_profile
            profile.enterprise_name = data.get("enterpriseName", profile.enterprise_name)
            profile.bank_name = data.get("bankName", profile.bank_name)
            profile.bank_account_number = data.get("bankAccountNumber", profile.bank_account_number)
            profile.save()
        elif user_type == "freelancer" and FreelancerProfile.objects.filter(user=user).exists():
            profile = user.freelancer_profile
            profile.bio = data.get("bio", profile.bio)
            profile.date_of_birth = data.get("date_of_birth", profile.date_of_birth) if data.get("date_of_birth") else profile.date_of_birth
            profile.save()

        return Response(
            {
                "message": "Perfil actualizado correctamente",
                "user": _serialize_user(user, user_type),
            },
            status=status.HTTP_200_OK,
        )
