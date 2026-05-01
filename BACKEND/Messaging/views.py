import json

from django.contrib.auth import get_user_model
from django.db.models import Max, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Conversation, Message


User = get_user_model()


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body)


def _get_user(user_id):
    if not user_id:
        return None
    return User.objects.filter(id=user_id).first()


def _user_role(user):
    if hasattr(user, "client_profile"):
        return "cliente"
    if hasattr(user, "freelancer_profile"):
        return "freelancer"
    return None


def _display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _conversation_queryset_for_user(user):
    return Conversation.objects.filter(Q(participant_one=user) | Q(participant_two=user)).select_related(
        "participant_one",
        "participant_two",
    )


def _can_users_message(user_a, user_b):
    role_a = _user_role(user_a)
    role_b = _user_role(user_b)
    return {role_a, role_b} == {"cliente", "freelancer"}


def _serialize_message(message, current_user=None):
    return {
        "id": message.id,
        "conversationId": message.conversation_id,
        "senderId": message.sender_id,
        "senderDisplayName": _display_name(message.sender),
        "content": message.content,
        "createdAt": message.created_at.isoformat(),
        "readAt": message.read_at.isoformat() if message.read_at else None,
        "isMine": bool(current_user and message.sender_id == current_user.id),
        "status": "read" if message.read_at else "sent",
    }


def _serialize_conversation(conversation, current_user):
    other_user = conversation.other_participant(current_user)
    messages_queryset = conversation.messages.select_related("sender")
    last_message = messages_queryset.order_by("-created_at", "-id").first()
    unread_count = messages_queryset.filter(read_at__isnull=True).exclude(sender=current_user).count()
    last_incoming_message = messages_queryset.exclude(sender=current_user).order_by("-created_at", "-id").first()

    return {
        "id": conversation.id,
        "updatedAt": conversation.updated_at.isoformat(),
        "createdAt": conversation.created_at.isoformat(),
        "otherUser": {
            "id": other_user.id,
            "username": other_user.username,
            "displayName": _display_name(other_user),
            "userType": _user_role(other_user),
        },
        "lastMessage": _serialize_message(last_message, current_user) if last_message else None,
        "lastResponseAt": last_incoming_message.created_at.isoformat() if last_incoming_message else None,
        "unreadCount": unread_count,
        "messageCount": messages_queryset.count(),
        "hasMessages": messages_queryset.exists(),
    }


def _forbidden(message):
    return Response({"error": message}, status=status.HTTP_403_FORBIDDEN)


class ConversationListView(APIView):
    def get(self, request):
        user = _get_user(request.query_params.get("user_id"))
        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        conversations = _conversation_queryset_for_user(user)
        payload = [_serialize_conversation(conversation, user) for conversation in conversations]
        total_unread = sum(item["unreadCount"] for item in payload)
        return Response({"conversations": payload, "totalUnread": total_unread}, status=status.HTTP_200_OK)


class ConversationStartView(APIView):
    def post(self, request):
        data = request.data

        current_user = _get_user(data.get("currentUserId"))
        other_user = _get_user(data.get("otherUserId"))

        if not current_user or not other_user:
            return Response({"error": "Usuarios invalidos"}, status=status.HTTP_404_NOT_FOUND)
        if current_user.id == other_user.id:
            return Response({"error": "No puedes iniciar una conversacion contigo mismo"}, status=status.HTTP_400_BAD_REQUEST)
        if not _can_users_message(current_user, other_user):
            return _forbidden("Solo se permiten conversaciones entre cliente y freelancer")

        participant_one, participant_two = sorted([current_user, other_user], key=lambda user: user.id)
        conversation, _ = Conversation.objects.get_or_create(
            participant_one=participant_one,
            participant_two=participant_two,
        )
        return Response({"conversation": _serialize_conversation(conversation, current_user)}, status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    def get(self, request, conversation_id):
        user = _get_user(request.query_params.get("user_id"))
        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        conversation = get_object_or_404(_conversation_queryset_for_user(user), id=conversation_id)
        Message.objects.filter(conversation=conversation, read_at__isnull=True).exclude(sender=user).update(read_at=timezone.now())
        messages = [_serialize_message(message, user) for message in conversation.messages.select_related("sender").all()]
        return Response({"conversation": _serialize_conversation(conversation, user), "messages": messages}, status=status.HTTP_200_OK)

    def post(self, request, conversation_id):
        data = request.data

        sender = _get_user(data.get("senderId"))
        content = (data.get("content") or "").strip()
        if not sender:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        if not content:
            return Response({"error": "El mensaje no puede estar vacio"}, status=status.HTTP_400_BAD_REQUEST)

        conversation = get_object_or_404(_conversation_queryset_for_user(sender), id=conversation_id)
        other_user = conversation.other_participant(sender)
        if not _can_users_message(sender, other_user):
            return _forbidden("Esta conversacion no es valida para mensajeria")

        message = Message.objects.create(conversation=conversation, sender=sender, content=content)
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])
        return Response({"message": _serialize_message(message, sender)}, status=status.HTTP_201_CREATED)


class ConversationReadView(APIView):
    def post(self, request, conversation_id):
        data = request.data

        user = _get_user(data.get("userId"))
        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        conversation = get_object_or_404(_conversation_queryset_for_user(user), id=conversation_id)
        updated_messages = Message.objects.filter(conversation=conversation, read_at__isnull=True).exclude(sender=user).update(
            read_at=timezone.now()
        )
        return Response({"updatedMessages": updated_messages}, status=status.HTTP_200_OK)


class MessagingDashboardView(APIView):
    def get(self, request):
        user = _get_user(request.query_params.get("user_id"))
        if not user:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        conversations = _conversation_queryset_for_user(user)
        conversation_count = conversations.count()
        sent_count = Message.objects.filter(sender=user).count()
        received_count = Message.objects.filter(conversation__in=conversations).exclude(sender=user).count()
        unread_count = Message.objects.filter(conversation__in=conversations, read_at__isnull=True).exclude(sender=user).count()
        last_activity = conversations.aggregate(last_activity=Max("updated_at"))["last_activity"]

        return Response(
            {
                "stats": {
                    "conversationCount": conversation_count,
                    "sentCount": sent_count,
                    "receivedCount": received_count,
                    "unreadCount": unread_count,
                    "lastActivity": last_activity.isoformat() if last_activity else None,
                    "role": _user_role(user),
                }
            },
            status=status.HTTP_200_OK,
        )
