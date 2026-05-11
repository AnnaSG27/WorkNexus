from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source="client.user.username", read_only=True)
    freelancer_username = serializers.CharField(source="freelancer.user.username", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "title",
            "description",
            "source_type",
            "status",
            "agreed_budget",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
            "client",
            "freelancer",
            "client_username",
            "freelancer_username",
        ]

class OrderDetailSerializer(serializers.ModelSerializer):
    client = serializers.StringRelatedField()
    freelancer = serializers.StringRelatedField()
    project_title = serializers.CharField(source="project.title", read_only=True)
    service_title = serializers.CharField(source="service.title", read_only=True)

    class Meta:
        model = Order
        fields = "__all__"