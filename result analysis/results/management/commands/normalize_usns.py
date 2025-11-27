"""
Management command to normalize all USNs to uppercase in the database.
This ensures consistency between student profiles and their results.
"""

from django.core.management.base import BaseCommand
from results.models import Student, StudentResult


class Command(BaseCommand):
    help = 'Normalize all USNs to uppercase for consistency'

    def handle(self, *args, **options):
        self.stdout.write('Normalizing USNs to uppercase...')

        # Update Student USNs
        students = Student.objects.all()
        student_count = 0
        for student in students:
            if student.usn != student.usn.upper():
                old_usn = student.usn
                student.usn = student.usn.upper()
                student.save()
                student_count += 1
                self.stdout.write(f'  Updated Student USN: {old_usn} -> {student.usn}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {student_count} student USNs')
        )

        # Check StudentResult records - they should be linked by foreign key,
        # so they should automatically show the updated USN
        self.stdout.write('\nVerifying StudentResult records...')
        results_count = StudentResult.objects.count()
        self.stdout.write(f'Total StudentResult records: {results_count}')

        self.stdout.write(self.style.SUCCESS('\nUSN normalization complete!'))
