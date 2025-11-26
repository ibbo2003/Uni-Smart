"""
Django management command to merge CS department into CSE department
Usage: python manage.py merge_cs_to_cse
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from results.models import Department, Student, Faculty, Subject, SemesterSubject


class Command(BaseCommand):
    help = 'Merge CS department into CSE department'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("DEPARTMENT MERGE TOOL - CS to CSE")
        self.stdout.write("="*60 + "\n")

        # Find both departments
        try:
            cs_dept = Department.objects.get(code='CS')
            self.stdout.write(self.style.SUCCESS(f"[OK] Found CS Department: {cs_dept.name}"))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR("\n[ERROR] CS Department not found!"))
            return

        try:
            cse_dept = Department.objects.get(code='CSE')
            self.stdout.write(self.style.SUCCESS(f"[OK] Found CSE Department: {cse_dept.name}"))
        except Department.DoesNotExist:
            self.stdout.write(self.style.WARNING("\n[ERROR] CSE Department not found!"))
            self.stdout.write("Creating CSE Department...")
            cse_dept = Department.objects.create(
                code='CSE',
                name='Computer Science and Engineering',
                description='Department of Computer Science and Engineering',
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f"[OK] Created CSE Department: {cse_dept.name}"))

        # Show statistics before merge
        self.stdout.write("\n" + "-"*60)
        self.stdout.write("BEFORE MERGE - Statistics:")
        self.stdout.write("-"*60)

        cs_students = Student.objects.filter(department=cs_dept).count()
        cs_faculty = Faculty.objects.filter(department=cs_dept).count()
        cs_subjects = Subject.objects.filter(department=cs_dept).count()
        cs_sem_subjects = SemesterSubject.objects.filter(department=cs_dept).count()

        cse_students = Student.objects.filter(department=cse_dept).count()
        cse_faculty = Faculty.objects.filter(department=cse_dept).count()
        cse_subjects = Subject.objects.filter(department=cse_dept).count()
        cse_sem_subjects = SemesterSubject.objects.filter(department=cse_dept).count()

        self.stdout.write(f"\nCS Department:")
        self.stdout.write(f"  - Students: {cs_students}")
        self.stdout.write(f"  - Faculty: {cs_faculty}")
        self.stdout.write(f"  - Subjects: {cs_subjects}")
        self.stdout.write(f"  - Semester Subjects: {cs_sem_subjects}")

        self.stdout.write(f"\nCSE Department:")
        self.stdout.write(f"  - Students: {cse_students}")
        self.stdout.write(f"  - Faculty: {cse_faculty}")
        self.stdout.write(f"  - Subjects: {cse_subjects}")
        self.stdout.write(f"  - Semester Subjects: {cse_sem_subjects}")

        # Perform the merge
        self.stdout.write("\n" + "-"*60)
        self.stdout.write("MERGING CS to CSE")
        self.stdout.write("-"*60 + "\n")

        try:
            with transaction.atomic():
                # Update all students
                updated_students = Student.objects.filter(department=cs_dept).update(department=cse_dept)
                self.stdout.write(self.style.SUCCESS(f"[OK] Moved {updated_students} students from CS to CSE"))

                # Update all faculty
                updated_faculty = Faculty.objects.filter(department=cs_dept).update(department=cse_dept)
                self.stdout.write(self.style.SUCCESS(f"[OK] Moved {updated_faculty} faculty from CS to CSE"))

                # Update all subjects
                updated_subjects = Subject.objects.filter(department=cs_dept).update(department=cse_dept)
                self.stdout.write(self.style.SUCCESS(f"[OK] Moved {updated_subjects} subjects from CS to CSE"))

                # Update all semester subjects
                updated_sem_subjects = SemesterSubject.objects.filter(department=cs_dept).update(department=cse_dept)
                self.stdout.write(self.style.SUCCESS(f"[OK] Moved {updated_sem_subjects} semester subjects from CS to CSE"))

                # Deactivate CS department (don't delete to preserve history)
                cs_dept.is_active = False
                cs_dept.save()
                self.stdout.write(self.style.SUCCESS("[OK] Deactivated CS department (marked as inactive)"))

                self.stdout.write(self.style.SUCCESS("\n[SUCCESS] MERGE COMPLETED SUCCESSFULLY!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n[ERROR] ERROR during merge: {str(e)}"))
            self.stdout.write(self.style.ERROR("Transaction rolled back - no changes made"))
            return

        # Show statistics after merge
        self.stdout.write("\n" + "-"*60)
        self.stdout.write("AFTER MERGE - Statistics:")
        self.stdout.write("-"*60)

        cse_students_after = Student.objects.filter(department=cse_dept).count()
        cse_faculty_after = Faculty.objects.filter(department=cse_dept).count()
        cse_subjects_after = Subject.objects.filter(department=cse_dept).count()
        cse_sem_subjects_after = SemesterSubject.objects.filter(department=cse_dept).count()

        self.stdout.write(f"\nCSE Department (merged):")
        self.stdout.write(f"  - Students: {cse_students_after} (was {cse_students})")
        self.stdout.write(f"  - Faculty: {cse_faculty_after} (was {cse_faculty})")
        self.stdout.write(f"  - Subjects: {cse_subjects_after} (was {cse_subjects})")
        self.stdout.write(f"  - Semester Subjects: {cse_sem_subjects_after} (was {cse_sem_subjects})")

        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("MERGE COMPLETE!"))
        self.stdout.write("="*60)
        self.stdout.write("\nThe CS department has been merged into CSE.")
        self.stdout.write("CS department is now inactive (not deleted).")
        self.stdout.write("All students, faculty, subjects have been moved to CSE.\n")
