"""
Script to merge CS department into CSE department
Run this from Django shell: python manage.py shell < merge_departments.py
"""

from results.models import Department, Student, Faculty, Subject, SemesterSubject
from django.db import transaction

def merge_departments():
    """Merge CS department into CSE department"""

    print("\n" + "="*60)
    print("DEPARTMENT MERGE TOOL - CS → CSE")
    print("="*60)

    # Find both departments
    try:
        cs_dept = Department.objects.get(code='CS')
        print(f"\n✓ Found CS Department: {cs_dept.name}")
    except Department.DoesNotExist:
        print("\n✗ CS Department not found!")
        return

    try:
        cse_dept = Department.objects.get(code='CSE')
        print(f"✓ Found CSE Department: {cse_dept.name}")
    except Department.DoesNotExist:
        print("\n✗ CSE Department not found!")
        print("Creating CSE Department...")
        cse_dept = Department.objects.create(
            code='CSE',
            name='Computer Science and Engineering',
            description='Department of Computer Science and Engineering',
            is_active=True
        )
        print(f"✓ Created CSE Department: {cse_dept.name}")

    # Show statistics before merge
    print("\n" + "-"*60)
    print("BEFORE MERGE - Statistics:")
    print("-"*60)

    cs_students = Student.objects.filter(department=cs_dept).count()
    cs_faculty = Faculty.objects.filter(department=cs_dept).count()
    cs_subjects = Subject.objects.filter(department=cs_dept).count()
    cs_sem_subjects = SemesterSubject.objects.filter(department=cs_dept).count()

    cse_students = Student.objects.filter(department=cse_dept).count()
    cse_faculty = Faculty.objects.filter(department=cse_dept).count()
    cse_subjects = Subject.objects.filter(department=cse_dept).count()
    cse_sem_subjects = SemesterSubject.objects.filter(department=cse_dept).count()

    print(f"\nCS Department:")
    print(f"  - Students: {cs_students}")
    print(f"  - Faculty: {cs_faculty}")
    print(f"  - Subjects: {cs_subjects}")
    print(f"  - Semester Subjects: {cs_sem_subjects}")

    print(f"\nCSE Department:")
    print(f"  - Students: {cse_students}")
    print(f"  - Faculty: {cse_faculty}")
    print(f"  - Subjects: {cse_subjects}")
    print(f"  - Semester Subjects: {cse_sem_subjects}")

    # Perform the merge
    print("\n" + "-"*60)
    print("MERGING CS → CSE")
    print("-"*60)

    try:
        with transaction.atomic():
            # Update all students
            updated_students = Student.objects.filter(department=cs_dept).update(department=cse_dept)
            print(f"\n✓ Moved {updated_students} students from CS to CSE")

            # Update all faculty
            updated_faculty = Faculty.objects.filter(department=cs_dept).update(department=cse_dept)
            print(f"✓ Moved {updated_faculty} faculty from CS to CSE")

            # Update all subjects
            updated_subjects = Subject.objects.filter(department=cs_dept).update(department=cse_dept)
            print(f"✓ Moved {updated_subjects} subjects from CS to CSE")

            # Update all semester subjects
            updated_sem_subjects = SemesterSubject.objects.filter(department=cs_dept).update(department=cse_dept)
            print(f"✓ Moved {updated_sem_subjects} semester subjects from CS to CSE")

            # Deactivate CS department (don't delete to preserve history)
            cs_dept.is_active = False
            cs_dept.save()
            print(f"✓ Deactivated CS department (marked as inactive)")

            print("\n✅ MERGE COMPLETED SUCCESSFULLY!")

    except Exception as e:
        print(f"\n✗ ERROR during merge: {str(e)}")
        print("Transaction rolled back - no changes made")
        return

    # Show statistics after merge
    print("\n" + "-"*60)
    print("AFTER MERGE - Statistics:")
    print("-"*60)

    cse_students_after = Student.objects.filter(department=cse_dept).count()
    cse_faculty_after = Faculty.objects.filter(department=cse_dept).count()
    cse_subjects_after = Subject.objects.filter(department=cse_dept).count()
    cse_sem_subjects_after = SemesterSubject.objects.filter(department=cse_dept).count()

    print(f"\nCSE Department (merged):")
    print(f"  - Students: {cse_students_after} (was {cse_students})")
    print(f"  - Faculty: {cse_faculty_after} (was {cse_faculty})")
    print(f"  - Subjects: {cse_subjects_after} (was {cse_subjects})")
    print(f"  - Semester Subjects: {cse_sem_subjects_after} (was {cse_sem_subjects})")

    print("\n" + "="*60)
    print("MERGE COMPLETE!")
    print("="*60)
    print("\nThe CS department has been merged into CSE.")
    print("CS department is now inactive (not deleted).")
    print("All students, faculty, subjects have been moved to CSE.")
    print("\n")

# Run the merge
if __name__ == '__main__':
    merge_departments()
else:
    # When loaded via shell
    merge_departments()
