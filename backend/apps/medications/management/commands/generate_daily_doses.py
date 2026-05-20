from django.core.management.base import BaseCommand

from apps.medications.services import auto_mark_overdue_missed, generate_daily_dose_logs


class Command(BaseCommand):
    help = "Generate pending medication logs for today and auto-mark overdue missed doses."

    def handle(self, *args, **options):
        created = generate_daily_dose_logs()
        self.stdout.write(f"Pending dose logs created: {created}")

        marked = auto_mark_overdue_missed()
        self.stdout.write(f"Overdue doses marked missed: {marked}")
