from django.urls import path

from .views import (
    ConversationListView,
    ConversationMessagesView,
    ConversationReadView,
    ConversationStartView,
    MessagingDashboardView,
)


urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("conversations/start/", ConversationStartView.as_view(), name="conversation-start"),
    path("conversations/<int:conversation_id>/messages/", ConversationMessagesView.as_view(), name="conversation-messages"),
    path("conversations/<int:conversation_id>/read/", ConversationReadView.as_view(), name="conversation-read"),
    path("dashboard/", MessagingDashboardView.as_view(), name="messaging-dashboard"),
]
