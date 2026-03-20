# services/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Service
from .serializers import ServiceSerializer

class ServiceListView(APIView):
    def get(self, request):
        category = request.GET.get("category")

        if category:
            services = Service.objects.filter(category=category)
        else:
            services = Service.objects.all()

        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)