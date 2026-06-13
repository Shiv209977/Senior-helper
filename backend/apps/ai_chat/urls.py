from django.urls import path

from apps.ai_chat.views import ChatHistoryView, ChatMessageView, DigestView, DemoSettingsView

urlpatterns = [
    path("chat/messages/", ChatMessageView.as_view(), name="chat-messages"),
    path("chat/history/", ChatHistoryView.as_view(), name="chat-history"),
    path("chat/digest/", DigestView.as_view(), name="chat-digest"),
    path("settings/demo/", DemoSettingsView.as_view(), name="demo-settings"),
]
