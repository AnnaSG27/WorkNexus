from django.http import JsonResponse
from django.views import View
import json
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login

# ----- REGISTER VIEW -----
@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            email = data.get("email")
            password = data.get("password")
            username = data.get("username") or email
            country = data.get("country")
            city = data.get("city")
            user_type = data.get("userType")
            enterprise_name = data.get("enterpriseName")
            bio = data.get("bio")
            age = data.get("age")
            
            print(data)

            if not email or not password:
                return JsonResponse({
                    "error": "Email y contraseña son requeridos"
                }, status=400)

            from django.contrib.auth import get_user_model
            User = get_user_model()

            # Verificar si el usuario ya existe
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    "error": "El usuario ya existe"
                }, status=400)

            # Crear usuario
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                country=country,
                city=city
            )

            # Crear perfil según tipo de usuario
            if user_type == "cliente":
                from .models import ClientProfile
                ClientProfile.objects.create(
                    user=user,
                    enterprise_name=enterprise_name or ""
                )

            elif user_type == "freelancer":
                from .models import FreelancerProfile
                FreelancerProfile.objects.create(
                    user=user,
                    bio=bio or "",
                    age=int(age) if age else 0
                )

            # Construir respuesta completa según tipo
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "country": user.country,
                "city": user.city,
                "userType": user_type
            }

            if user_type == "cliente":
                user_data["enterpriseName"] = enterprise_name or ""

            elif user_type == "freelancer":
                user_data["bio"] = bio or ""
                user_data["age"] = int(age) if age else 0

            return JsonResponse({
                "message": "Usuario creado exitosamente",
                "user": user_data
            }, status=201)

        except Exception as e:
            print("Error en register:", e)
            return JsonResponse({
                "error": "Error interno del servidor"
            }, status=500)


# --- LOGIN VIEW ---
@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            identifier = data.get("email") or data.get("username")
            password = data.get("password")

            if not identifier or not password:
                return JsonResponse({
                    "error": "Email/username y contraseña son requeridos"
                }, status=400)

            from django.contrib.auth import get_user_model
            User = get_user_model()

            # Buscar usuario por email o username
            user_obj = User.objects.filter(email=identifier).first() or \
                       User.objects.filter(username=identifier).first()

            if not user_obj:
                return JsonResponse({
                    "error": "Usuario no encontrado"
                }, status=404)

            # Django autentica con username internamente
            user = authenticate(request, username=user_obj.username, password=password)

            if user is not None:
                django_login(request, user)

                # Determinar tipo de usuario y obtener perfil
                if hasattr(user, "client_profile"):
                    user_type = "cliente"
                    enterprise_name = user.client_profile.enterprise_name
                elif hasattr(user, "freelancer_profile"):
                    user_type = "freelancer"
                    bio = user.freelancer_profile.bio
                    age = user.freelancer_profile.age
                else:
                    user_type = None

                user_data = {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "country": user.country,
                    "city": user.city,
                    "userType": user_type
                }

                if user_type == "cliente":
                    user_data["enterpriseName"] = enterprise_name

                elif user_type == "freelancer":
                    user_data["bio"] = bio
                    user_data["age"] = age

                return JsonResponse({
                    "message": "Login exitoso",
                    "user": user_data
                }, status=200)
            else:
                return JsonResponse({
                    "error": "Credenciales inválidas"
                }, status=401)

        except Exception as e:
            print("Error en login:", e)
            return JsonResponse({
                "error": "Error interno del servidor"
            }, status=500)
