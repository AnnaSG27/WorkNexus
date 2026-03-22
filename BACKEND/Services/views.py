# services/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from .models import Service
from .serializers import ServiceSerializer
from django.db.models import Count

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

class CategoryCountView(APIView):
    def get(self, request):
        data = (
            Service.objects
            .values("category")
            .annotate(count=Count("id"))
        )

        # Convert to simpler format
        result = {item["category"]: item["count"] for item in data}

        return Response(result)