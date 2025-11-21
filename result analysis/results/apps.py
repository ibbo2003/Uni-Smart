from django.apps import AppConfig


class ResultsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'results'
    verbose_name = 'UniSmart Result Analysis'

    def ready(self):
        """Import signals when the app is ready."""
        pass  # Import signals here if needed in future
