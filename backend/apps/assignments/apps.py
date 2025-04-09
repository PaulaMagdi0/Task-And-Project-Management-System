# apps/assignments/apps.py
from django.apps import AppConfig

class AssignmentsConfig(AppConfig):
    name = 'apps.assignments'

    def ready(self):
        import apps.assignments.signals  # Ensure signals are loaded
