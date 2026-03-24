from django.conf import settings
from django.db import models
from django.db.models import Q


class Conversation(models.Model):
    participant_one = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_first_participant",
    )
    participant_two = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_second_participant",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~Q(participant_one=models.F("participant_two")),
                name="conversation_distinct_participants",
            ),
            models.UniqueConstraint(
                fields=["participant_one", "participant_two"],
                name="unique_conversation_pair",
            ),
        ]
        ordering = ["-updated_at", "-id"]

    def save(self, *args, **kwargs):
        if self.participant_one_id and self.participant_two_id and self.participant_one_id > self.participant_two_id:
            self.participant_one_id, self.participant_two_id = self.participant_two_id, self.participant_one_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Conversation {self.pk}: {self.participant_one} <-> {self.participant_two}"

    def other_participant(self, user):
        if user.id == self.participant_one_id:
            return self.participant_two
        return self.participant_one


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"Message {self.pk} from {self.sender}"
