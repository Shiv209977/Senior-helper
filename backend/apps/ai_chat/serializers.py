from rest_framework import serializers

from apps.ai_chat.models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "patient",
            "sender",
            "role",
            "content",
            "concern_level",
            "unstructured_notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "patient",
            "sender",
            "role",
            "concern_level",
            "unstructured_notes",
            "created_at",
        ]


class ChatRequestSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=4000)
    patient_id = serializers.IntegerField(required=False)
