"""
Management command to initialize default system settings
"""

from django.core.management.base import BaseCommand
from results.models import SystemSettings


class Command(BaseCommand):
    help = 'Initialize default system settings'

    def handle(self, *args, **options):
        self.stdout.write('Initializing system settings...')

        # Set default VTU results URL
        SystemSettings.set_setting(
            key='VTU_RESULTS_URL',
            value='https://results.vtu.ac.in/JJEcbcs25/index.php',
            description='Current VTU Results Portal URL (updates every semester)'
        )

        self.stdout.write(
            self.style.SUCCESS('System settings initialized successfully')
        )
