"""
Management command to migrate Environmental Studies and Constitution subjects to Audit Course type
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from results.models import Subject, StudentResult


class Command(BaseCommand):
    help = 'Migrate Environmental Studies and Constitution subjects to Audit Course type'

    def handle(self, *args, **options):
        self.stdout.write('Starting Audit Course migration...')

        # Keywords for Audit courses
        audit_keywords = [
            'ENVIRONMENTAL', 'BES',
            'CONSTITUTION', 'BCIV',
            'PROFESSIONAL ETHICS', 'HUMAN RIGHTS'
        ]

        updated_count = 0

        with transaction.atomic():
            for keyword in audit_keywords:
                subjects = Subject.objects.filter(
                    Q(code__icontains=keyword) |
                    Q(name__icontains=keyword)
                )

                for subject in subjects:
                    # Check if it has credits (not Non-Credit)
                    if subject.credits > 0 and subject.max_external_marks == 0:
                        self.stdout.write(f'Updating: {subject.code} - {subject.name}')

                        subject.subject_type = 'AUDIT'
                        subject.max_internal_marks = 100
                        subject.max_external_marks = 0
                        subject.max_total_marks = 100
                        subject.min_internal_marks = 35
                        subject.min_external_marks = 0
                        subject.min_total_marks = 35
                        subject.save()

                        updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} subjects to Audit Course type'
            )
        )

        # Recalculate results
        self.stdout.write('Recalculating results for Audit courses...')
        results = StudentResult.objects.filter(subject__subject_type='AUDIT')
        for result in results:
            result.save()  # This will recalculate grade and grade_point

        self.stdout.write(self.style.SUCCESS('Migration completed!'))
