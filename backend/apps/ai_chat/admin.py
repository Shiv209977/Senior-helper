from django.contrib import admin

from apps.ai_chat.models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "sender", "role", "concern_level", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("content", "patient__full_name", "sender__full_name")
    raw_id_fields = ("patient", "sender")
