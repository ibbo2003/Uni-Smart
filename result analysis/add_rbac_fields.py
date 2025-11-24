#!/usr/bin/env python
"""Add RBAC fields to existing database tables"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

print("=" * 70)
print("ADDING RBAC FIELDS TO DATABASE")
print("=" * 70)
print()

with connection.cursor() as cursor:
    # Check if fields already exist
    print("Checking existing fields...")

    cursor.execute("DESCRIBE results_faculty")
    faculty_fields = [row[0] for row in cursor.fetchall()]

    cursor.execute("DESCRIBE results_students")
    student_fields = [row[0] for row in cursor.fetchall()]

    print()
    print("Adding fields...")
    print("-" * 70)

    # Add class_advisor_section to faculty
    if 'class_advisor_section' not in faculty_fields:
        try:
            cursor.execute("""
                ALTER TABLE results_faculty
                ADD COLUMN class_advisor_section VARCHAR(255) NULL
                COMMENT 'Section ID this faculty advises'
            """)
            print("  [OK] Added class_advisor_section to results_faculty")
        except Exception as e:
            print(f"  [ERROR] Failed to add class_advisor_section: {e}")
    else:
        print("  [SKIP] class_advisor_section already exists in results_faculty")

    # Add section to students
    if 'section' not in student_fields:
        try:
            cursor.execute("""
                ALTER TABLE results_students
                ADD COLUMN section VARCHAR(255) NULL
                COMMENT 'Section ID student belongs to'
            """)
            print("  [OK] Added section to results_students")
        except Exception as e:
            print(f"  [ERROR] Failed to add section: {e}")
    else:
        print("  [SKIP] section already exists in results_students")

print()
print("=" * 70)
print("VERIFICATION")
print("=" * 70)

with connection.cursor() as cursor:
    print()
    print("Faculty table structure:")
    cursor.execute("DESCRIBE results_faculty")
    for row in cursor.fetchall():
        field = row[0]
        if field in ['class_advisor_section', 'email', 'department_id']:
            print(f"  {field}: {row[1]}")

    print()
    print("Student table structure:")
    cursor.execute("DESCRIBE results_students")
    for row in cursor.fetchall():
        field = row[0]
        if field in ['section', 'usn', 'department_id']:
            print(f"  {field}: {row[1]}")

print()
print("=" * 70)
print("RBAC FIELDS ADDED SUCCESSFULLY!")
print("=" * 70)
print()
print("Next steps:")
print("1. Restart Django server")
print("2. Test RBAC permissions")
print("3. Implement frontend role guards")
print()
