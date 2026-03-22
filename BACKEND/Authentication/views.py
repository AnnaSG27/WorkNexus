import json

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt


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


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            full_name = (data.get("nombre") or "").strip()
            email = data.get("email")
            password = data.get("password")
            username = data.get("username") or email
            country = data.get("country")
            city = data.get("city")
            user_type = data.get("userType")
            enterprise_name = data.get("enterpriseName")
            bio = data.get("bio")
            age = data.get("age")

            if not email or not password:
                return JsonResponse({"error": "Email y contrasena son requeridos"}, status=400)

            from django.contrib.auth import get_user_model
            from .models import ClientProfile, FreelancerProfile

            User = get_user_model()

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "El usuario ya existe"}, status=400)

            name_parts = full_name.split()
            first_name = name_parts[0] if name_parts else ""
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                country=country,
                city=city,
            )

            if user_type == "cliente":
                ClientProfile.objects.create(user=user, enterprise_name=enterprise_name or "")
            elif user_type == "freelancer":
                FreelancerProfile.objects.create(user=user, bio=bio or "", age=int(age) if age else 0)

            return JsonResponse(
                {
                    "message": "Usuario creado exitosamente",
                    "user": _serialize_user(user, user_type),
                },
                status=201,
            )
        except Exception as e:
            print("Error en register:", e)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            identifier = data.get("email") or data.get("username")
            password = data.get("password")

            if not identifier or not password:
                return JsonResponse({"error": "Email/username y contrasena son requeridos"}, status=400)

            from django.contrib.auth import get_user_model

            User = get_user_model()
            user_obj = User.objects.filter(email=identifier).first() or User.objects.filter(username=identifier).first()

            if not user_obj:
                return JsonResponse({"error": "Usuario no encontrado"}, status=404)

            user = authenticate(request, username=user_obj.username, password=password)

            if user is None:
                return JsonResponse({"error": "Credenciales invalidas"}, status=401)

            django_login(request, user)

            if hasattr(user, "client_profile"):
                user_type = "cliente"
            elif hasattr(user, "freelancer_profile"):
                user_type = "freelancer"
            else:
                user_type = None

            return JsonResponse(
                {
                    "message": "Login exitoso",
                    "user": _serialize_user(user, user_type),
                },
                status=200,
            )
        except Exception as e:
            print("Error en login:", e)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class EditProfileView(View):
    def put(self, request):
        try:
            data = json.loads(request.body)
            user_id = data.get("id")

            if not user_id:
                return JsonResponse({"error": "ID de usuario requerido"}, status=400)

            from django.contrib.auth import get_user_model

            User = get_user_model()
            user = User.objects.filter(id=user_id).first()

            if not user:
                return JsonResponse({"error": "Usuario no encontrado"}, status=404)

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

            return JsonResponse(
                {
                    "message": "Perfil actualizado correctamente",
                    "user": _serialize_user(user, user_type),
                },
                status=200,
            )
        except Exception as e:
            print("Error en editProfile:", e)
            return JsonResponse({"error": "Error interno del servidor"}, status=500)
