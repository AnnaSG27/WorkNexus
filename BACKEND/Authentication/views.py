from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LoginSerializer, RegisterSerializer

from django.contrib.auth import authenticate, get_user_model, login as django_login
from .models import ClientProfile, FreelancerProfile


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

    if user_type == "cliente" and hasattr(user, "client_profile"):
        payload["enterpriseName"] = user.client_profile.enterprise_name
    elif user_type == "freelancer" and hasattr(user, "freelancer_profile"):
        payload["bio"] = user.freelancer_profile.bio
        payload["age"] = user.freelancer_profile.age

    return payload



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = request.data

        full_name = (data.get("nombre") or "").strip()
        user_type = data.get("userType")
        enterprise_name = data.get("enterpriseName")
        bio = data.get("bio")
        age = data.get("age")

        User = get_user_model()

        username = serializer.validated_data.get("username")
        if User.objects.filter(username=username).exists():
            return Response({"error": "El usuario ya existe"}, status=status.HTTP_400_BAD_REQUEST)

        name_parts = full_name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = serializer.save(
            first_name=first_name,
            last_name=last_name
        )

        if user_type == "cliente":
            ClientProfile.objects.create(user=user, enterprise_name=enterprise_name or "")
        elif user_type == "freelancer":
            FreelancerProfile.objects.create(user=user, bio=bio or "", age=int(age) if age else 0)

        return Response(
            {
                "message": "Usuario creado exitosamente",
                "user": _serialize_user(user, user_type),
            },
            status=status.HTTP_201_CREATED,
        )


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

        if hasattr(user, "client_profile"):
            user_type = "cliente"
        elif hasattr(user, "freelancer_profile"):
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

        if user_type == "cliente" and hasattr(user, "client_profile"):
            profile = user.client_profile
            profile.enterprise_name = data.get("enterpriseName", profile.enterprise_name)
            profile.save()
        elif user_type == "freelancer" and hasattr(user, "freelancer_profile"):
            profile = user.freelancer_profile
            profile.bio = data.get("bio", profile.bio)
            profile.age = int(data.get("age", profile.age)) if data.get("age") else profile.age
            profile.save()

        return Response(
            {
                "message": "Perfil actualizado correctamente",
                "user": _serialize_user(user, user_type),
            },
            status=status.HTTP_200_OK,
        )
