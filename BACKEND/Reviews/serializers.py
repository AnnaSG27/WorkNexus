from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source="client.user.username", read_only=True)
    freelancer_username = serializers.CharField(source="freelancer.user.username", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "project",
            "project_title",
            "client",
            "client_username",
            "freelancer",
            "freelancer_username",
            "rating",
            "comment",
            "created_at",
        ]
        
class CreateReviewSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)
    
