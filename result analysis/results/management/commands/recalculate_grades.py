"""
Management Command: Recalculate All Grades

This command recalculates all student result grades based on the new
VTU CBCS 2015-16 grading system. It should be run after updating the
grading logic to ensure all existing data uses the correct scale.

Usage:
    python manage.py recalculate_grades
    python manage.py recalculate_grades --dry-run
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from results.models import StudentResult, Subject
from decimal import Decimal


class Command(BaseCommand):
    help = 'Recalculate all student grades based on VTU CBCS 2015-16 grading system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually changing anything',
        )
        parser.add_argument(
            '--usn',
            type=str,
            help='Recalculate grades for a specific USN only',
        )
        parser.add_argument(
            '--semester',
            type=int,
            help='Recalculate grades for a specific semester only',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        usn_filter = options['usn']
        semester_filter = options['semester']

        # Start with all results
        results = StudentResult.objects.select_related('subject', 'student').all()

        # Apply filters if provided
        if usn_filter:
            results = results.filter(student__usn=usn_filter)
            self.stdout.write(f"Filtering by USN: {usn_filter}")

        if semester_filter:
            results = results.filter(semester=semester_filter)
            self.stdout.write(f"Filtering by semester: {semester_filter}")

        total_count = results.count()

        if total_count == 0:
            self.stdout.write(self.style.WARNING('No results found to recalculate.'))
            return

        self.stdout.write(f"\nFound {total_count} result records to process...")

        if dry_run:
            self.stdout.write(self.style.WARNING('\n*** DRY RUN MODE - No changes will be saved ***\n'))

        # First, update any subjects missing the new fields
        self.stdout.write('\nStep 1: Updating subjects with default VTU CBCS 2015-16 values...')
        subjects_updated = self._update_subjects(dry_run)
        self.stdout.write(self.style.SUCCESS(f'Updated {subjects_updated} subjects'))

        # Then recalculate grades
        self.stdout.write('\nStep 2: Recalculating student result grades...')

        changed_count = 0
        unchanged_count = 0
        error_count = 0

        for i, result in enumerate(results, 1):
            try:
                # Store old values
                old_grade = result.grade
                old_grade_point = result.grade_point
                old_result_status = result.result_status

                if dry_run:
                    # Calculate new values without saving
                    new_grade = result.calculate_grade()

                    # Calculate grade point for the new grade
                    grade_map = {
                        'O': Decimal('10.00'),   # Outstanding
                        'S': Decimal('9.00'),    # Excellent
                        'A': Decimal('8.00'),    # Very Good
                        'B': Decimal('7.00'),    # Good
                        'C': Decimal('6.00'),    # Above Average
                        'D': Decimal('5.00'),    # Average
                        'E': Decimal('4.00'),    # Poor (Pass)
                        'F': Decimal('0.00'),    # Fail
                    }
                    new_grade_point = grade_map.get(new_grade, Decimal('0.00'))

                    # Recalculate result status
                    max_internal = result.subject.max_internal_marks
                    max_external = result.subject.max_external_marks
                    min_internal = result.subject.min_internal_marks
                    min_external = result.subject.min_external_marks
                    min_total = result.subject.min_total_marks

                    passes_internal = (max_internal == 0) or (result.internal_marks >= min_internal)
                    passes_external = (max_external == 0) or (result.external_marks >= min_external)
                    passes_total = result.total_marks >= min_total

                    new_result_status = 'P' if (passes_internal and passes_external and passes_total) else 'F'

                    # Check if anything changed
                    if (old_grade != new_grade or
                        old_grade_point != new_grade_point or
                        old_result_status != new_result_status):
                        changed_count += 1
                        self.stdout.write(
                            f"  [{i}/{total_count}] {result.student.usn} - {result.subject.code}: "
                            f"{old_grade} -> {new_grade}, GP: {old_grade_point} -> {new_grade_point}, "
                            f"Status: {old_result_status} -> {new_result_status}"
                        )
                    else:
                        unchanged_count += 1

                else:
                    # Actually save the changes
                    result.save()  # This triggers automatic recalculation

                    if (old_grade != result.grade or
                        old_grade_point != result.grade_point or
                        old_result_status != result.result_status):
                        changed_count += 1
                        if changed_count <= 20:  # Only show first 20 changes
                            self.stdout.write(
                                f"  [{i}/{total_count}] {result.student.usn} - {result.subject.code}: "
                                f"{old_grade} -> {result.grade}, GP: {old_grade_point} -> {result.grade_point}, "
                                f"Status: {old_result_status} -> {result.result_status}"
                            )
                    else:
                        unchanged_count += 1

                # Progress indicator every 100 records
                if i % 100 == 0:
                    self.stdout.write(f"Processed {i}/{total_count} results...")

            except Exception as e:
                error_count += 1
                self.stderr.write(
                    self.style.ERROR(
                        f"Error processing {result.student.usn} - {result.subject.code}: {e}"
                    )
                )

        # Summary
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('\nRecalculation Summary:'))
        self.stdout.write(f"  Total records processed: {total_count}")
        self.stdout.write(self.style.SUCCESS(f"  Records changed: {changed_count}"))
        self.stdout.write(f"  Records unchanged: {unchanged_count}")

        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"  Errors encountered: {error_count}"))

        if dry_run:
            self.stdout.write(self.style.WARNING('\n*** DRY RUN MODE - No changes were saved ***'))
        else:
            self.stdout.write(self.style.SUCCESS('\nSUCCESS: All grades have been recalculated successfully!'))

        self.stdout.write('='*70 + '\n')

    def _update_subjects(self, dry_run):
        """Update subjects that may be missing the new fields"""
        subjects = Subject.objects.all()
        updated = 0

        for subject in subjects:
            needs_update = False
            updates = {}

            # Check if max_total_marks needs to be set
            if not hasattr(subject, 'max_total_marks') or subject.max_total_marks == 0:
                updates['max_total_marks'] = subject.max_internal_marks + subject.max_external_marks
                needs_update = True

            # Check if min marks need to be calculated
            if not hasattr(subject, 'min_internal_marks') or subject.min_internal_marks == 0:
                updates['min_internal_marks'] = int(subject.max_internal_marks * 0.35)
                needs_update = True

            if not hasattr(subject, 'min_external_marks') or subject.min_external_marks == 0:
                updates['min_external_marks'] = int(subject.max_external_marks * 0.35)
                needs_update = True

            if not hasattr(subject, 'min_total_marks') or subject.min_total_marks == 0:
                total = subject.max_internal_marks + subject.max_external_marks
                updates['min_total_marks'] = int(total * 0.40)
                needs_update = True

            if needs_update and not dry_run:
                for field, value in updates.items():
                    setattr(subject, field, value)
                subject.save()
                updated += 1

        return updated
