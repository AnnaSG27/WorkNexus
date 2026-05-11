from rest_framework import serializers
from .models import Project, ProjectApplication


class ProjectSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source="client.user.username", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "category",
            "budget",
            "timeline",
            "location",
            "skills",
            "reference_url",
            "deadline",
            "modality",
            "status",
            "is_open",
            "created_at",
            "client",
            "client_username",
        ]

class ProjectApplicationSerializer(serializers.ModelSerializer):
    freelancer_username = serializers.CharField(source="freelancer.user.username", read_only=True)

    class Meta:
        model = ProjectApplication
        fields = [
            "id",
            "project",
            "freelancer",
            "freelancer_username",
            "cover_letter",
            "proposed_budget",
            "status",
            "created_at",
        ]
        
class CreateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "title",
            "description",
            "category",
            "budget",
            "timeline",
            "location",
            "skills",
            "reference_url",
            "deadline",
            "modality",
        ]
        
class ApplyProjectSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    cover_letter = serializers.CharField(required=False, allow_blank=True)
    proposed_budget = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
