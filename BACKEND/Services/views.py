# services/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from .models import Service
from .serializers import ServiceSerializer

class ServiceWithFreelancerSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.CharField(source="freelancer.user.username")

    class Meta:
        model = Service
        fields = ["id", "title", "description", "category", "freelancer_name"]

class ServiceListView(APIView):
    def get(self, request):
        category = request.GET.get("category")

        if category:
            services = Service.objects.filter(category=category)
        else:
            services = Service.objects.all()

        serializer = ServiceWithFreelancerSerializer(services, many=True)
        return Response(serializer.data)