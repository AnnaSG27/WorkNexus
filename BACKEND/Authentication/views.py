from django.http import JsonResponse
from django.views import View
import json
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login

@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print("Datos recibidos en /register:")
            print(data)

            return JsonResponse({
                "message": "Datos recibidos correctamente"
            }, status=200)

        except Exception as e:
            print("Error al procesar la solicitud:", e)
            return JsonResponse({
                "error": "Error al procesar la solicitud"
            }, status=400)


# --- LOGIN VIEW ---
@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)

            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse({
                    "error": "Email y contraseña son requeridos"
                }, status=400)

            user = authenticate(request, username=email, password=password)

            if user is not None:
                django_login(request, user)
                return JsonResponse({
                    "message": "Login exitoso",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email
                    }
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
