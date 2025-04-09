# apps/assignments/__init__.py
default_app_config = 'apps.assignments.apps.AssignmentsConfig'

# apps/assignments/apps.py
from django.apps import AppConfig

class AssignmentsConfig(AppConfig):
    name = 'apps.assignments'

    def ready(self):
        import apps.assignments.signals  # Ensure the signal gets loaded
