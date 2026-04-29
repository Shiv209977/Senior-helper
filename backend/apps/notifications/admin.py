from django.contrib import admin

from apps.notifications.models import Alert, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("title", "patient", "created_for_user", "alert_type", "severity", "status", "created_at")
    list_filter = ("alert_type", "severity", "status")

