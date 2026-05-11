from rest_framework import serializers
from .models import Message, Conversation


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "content",
            "created_at",
            "read_at",
        ]
        read_only_fields = ["id", "created_at", "read_at"]

class ConversationSerializer(serializers.ModelSerializer):
    participant_one_username = serializers.CharField(source="participant_one.username", read_only=True)
    participant_two_username = serializers.CharField(source="participant_two.username", read_only=True)

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participant_one",
            "participant_two",
            "participant_one_username",
            "participant_two_username",
            "created_at",
            "updated_at",
            "last_message",
        ]

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return MessageSerializer(last).data
        return None