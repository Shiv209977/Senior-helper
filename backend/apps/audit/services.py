def log_action(user=None, action="", metadata=None):
    try:
        from apps.audit.models import AuditLog

        AuditLog.objects.create(user=user, action=action, metadata=metadata or {})
    except Exception:
        # Audit logging should never break the user-facing action.
        return None

