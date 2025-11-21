
"""
Management Command: Fix All Results

This command recalculates all student results using the correct VTU CBCS 2015-16
pass/fail logic. This fixes the bug where results were not checking the 35%/35%/40%
criteria properly.

Usage:
    python manage.py fix_results
    python manage.py fix_results --dry-run
    python manage.py fix_results --usn 2AB22CS003
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from results.models import StudentResult
from decimal import Decimal


class Command(BaseCommand):
    help = 'Recalculate all results using correct VTU pass/fail logic'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually changing anything',
        )
        parser.add_argument(
            '--usn',
            type=str,
            help='Recalculate results for a specific USN only',
        )
        parser.add_argument(
            '--semester',
            type=int,
            help='Recalculate results for a specific semester only',
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

        changed_count = 0
        unchanged_count = 0
        error_count = 0

        for i, result in enumerate(results, 1):
            try:
                # Store old values
                old_grade = result.grade
                old_grade_point = result.grade_point
                old_result_status = result.result_status

                if not dry_run:
                    # Actually save the changes
                    result.save()  # This triggers automatic recalculation

                    if (old_grade != result.grade or
                        old_grade_point != result.grade_point or
                        old_result_status != result.result_status):
                        changed_count += 1
                        if changed_count <= 50:  # Show first 50 changes
                            self.stdout.write(
                                f"  [{i}/{total_count}] {result.student.usn} - {result.subject.code}: "
                                f"{old_grade} -> {result.grade} (GP: {old_grade_point} -> {result.grade_point}), "
                                f"Status: {old_result_status} -> {result.result_status}"
                            )
                    else:
                        unchanged_count += 1
                else:
                    # Dry run - calculate new values without saving
                    # Get maximum marks
                    max_internal = result.subject.max_internal_marks
                    max_external = result.subject.max_external_marks
                    max_total = max_internal + max_external

                    # Calculate minimum requirements
                    min_internal = max_internal * 0.35
                    min_external = max_external * 0.35
                    min_total = max_total * 0.40

                    # Calculate new status
                    passes_internal = (max_internal == 0) or (result.internal_marks >= min_internal)
                    passes_external = (max_external == 0) or (result.external_marks >= min_external)
                    passes_total = result.total_marks >= min_total

                    new_result_status = 'P' if (passes_internal and passes_external and passes_total) else 'F'

                    # Calculate new grade
                    new_grade = result.calculate_grade()

                    # Calculate grade point for the new grade
                    grade_map = {
                        'O': Decimal('10.00'),
                        'S': Decimal('9.00'),
                        'A': Decimal('8.00'),
                        'B': Decimal('7.00'),
                        'C': Decimal('6.00'),
                        'D': Decimal('5.00'),
                        'E': Decimal('4.00'),
                        'F': Decimal('0.00'),
                    }
                    new_grade_point = grade_map.get(new_grade, Decimal('0.00'))

                    # Check if anything changed
                    if (old_grade != new_grade or
                        old_grade_point != new_grade_point or
                        old_result_status != new_result_status):
                        changed_count += 1
                        if changed_count <= 50:  # Show first 50 changes
                            self.stdout.write(
                                f"  [{i}/{total_count}] {result.student.usn} - {result.subject.code}: "
                                f"{old_grade} -> {new_grade} (GP: {old_grade_point} -> {new_grade_point}), "
                                f"Status: {old_result_status} -> {new_result_status}"
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
            self.stdout.write(self.style.SUCCESS('\nSUCCESS: All results have been recalculated!'))

        self.stdout.write('='*70 + '\n')
