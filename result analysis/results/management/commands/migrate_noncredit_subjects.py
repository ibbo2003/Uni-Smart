"""
Management Command: Migrate Yoga and IKS subjects to Non-Credit Mandatory type

This command updates existing Yoga, IKS, and other non-credit mandatory subjects
to use the new NON_CREDIT subject type.

Usage:
    python manage.py migrate_noncredit_subjects
    python manage.py migrate_noncredit_subjects --dry-run
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from results.models import Subject, StudentResult


class Command(BaseCommand):
    help = 'Migrate Yoga and IKS subjects to Non-Credit Mandatory type'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually changing anything',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        self.stdout.write('='*70)
        self.stdout.write('Migrating Non-Credit Mandatory Subjects')
        self.stdout.write('='*70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n*** DRY RUN MODE - No changes will be saved ***\n'))

        # Keywords to identify Non-Credit courses
        # Code patterns (must be exact or start with)
        code_patterns = ['BYOK', 'BIKS', 'BCIV']

        # Name patterns (must contain these keywords)
        name_patterns = [
            'YOGA', 'PHYSICAL EDUCATION',
            'INDIAN KNOWLEDGE SYSTEM', 'IKS',
            'ENVIRONMENTAL STUDIES',
            'CONSTITUTION OF INDIA'
        ]

        updated_subjects = []
        subjects_found = []

        # Find subjects by code patterns
        for code_pattern in code_patterns:
            subjects = Subject.objects.filter(code__istartswith=code_pattern)
            for subject in subjects:
                if subject not in subjects_found:
                    subjects_found.append(subject)

        # Find subjects by name patterns
        for name_pattern in name_patterns:
            subjects = Subject.objects.filter(name__icontains=name_pattern)
            for subject in subjects:
                if subject not in subjects_found:
                    subjects_found.append(subject)

        if not subjects_found:
            self.stdout.write(self.style.WARNING('No Non-Credit Mandatory subjects found.'))
            return

        self.stdout.write(f'\nFound {len(subjects_found)} subjects to migrate:\n')

        for subject in subjects_found:
            old_type = subject.subject_type
            old_credits = subject.credits
            old_max_internal = subject.max_internal_marks
            old_max_external = subject.max_external_marks

            self.stdout.write(
                f'  {subject.code:15} | {subject.name[:40]:40} | '
                f'Type: {old_type:10} | Credits: {old_credits}'
            )

            if not dry_run:
                # Update subject type
                subject.subject_type = 'NON_CREDIT'
                subject.credits = 0
                subject.max_internal_marks = 100
                subject.max_external_marks = 0
                subject.max_total_marks = 100
                subject.min_internal_marks = 35
                subject.min_external_marks = 0
                subject.min_total_marks = 35
                subject.save()

                updated_subjects.append(subject)

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully updated {len(updated_subjects)} subjects to Non-Credit Mandatory type'
                )
            )

            # Recalculate results for migrated subjects
            self.stdout.write('\nRecalculating results for Non-Credit subjects...')

            results = StudentResult.objects.filter(
                subject__in=updated_subjects
            )

            result_count = 0
            for result in results:
                result.save()  # Triggers recalculation
                result_count += 1

                if result_count % 100 == 0:
                    self.stdout.write(f'  Processed {result_count} results...')

            self.stdout.write(
                self.style.SUCCESS(
                    f'Recalculated {result_count} results'
                )
            )

            # Summary
            self.stdout.write('\n' + '='*70)
            self.stdout.write(self.style.SUCCESS('Migration Summary:'))
            self.stdout.write(f'  Subjects migrated: {len(updated_subjects)}')
            self.stdout.write(f'  Results recalculated: {result_count}')
            self.stdout.write('='*70)

        else:
            self.stdout.write(self.style.WARNING('\n*** DRY RUN MODE - No changes were saved ***'))
            self.stdout.write(f'Would have updated {len(subjects_found)} subjects')
