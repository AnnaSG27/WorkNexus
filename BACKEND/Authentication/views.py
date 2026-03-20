from django.http import JsonResponse
from django.views import View
import json
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

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
