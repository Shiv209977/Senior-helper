from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="chat_messages",
        on_delete=models.CASCADE,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_messages",
        on_delete=models.CASCADE,
    )
    role = models.CharField(max_length=16, choices=Role.choices)
    content = models.TextField()
    extracted_flags = models.JSONField(null=True, blank=True)
    concern_level = models.PositiveSmallIntegerField(null=True, blank=True)
    unstructured_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:40]}"
