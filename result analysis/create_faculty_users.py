#!/usr/bin/env python
"""
Script to create faculty users with proper employee_id to name mapping.

Usage:
    python create_faculty_users.py

This demonstrates the pattern:
- Login username = employee_id (e.g., "FAC001")
- Display name = name (e.g., "Dr. John Smith")
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from results.models import User, Faculty, Department

def create_faculty_user(name, email, department_code, designation, class_advisor_section=None, employee_id=None):
    """
    Create a faculty user with auto-generated employee_id.

    Args:
        name: Display name (e.g., "Dr. John Smith")
        email: Faculty email
        department_code: Department code (e.g., "CS", "EC")
        designation: Faculty designation (e.g., "Professor", "Assistant Professor")
        class_advisor_section: Optional section ID if class advisor
        employee_id: Optional manual employee_id (if None, auto-generates in format DEPT-F-XXX)
    """
    # Auto-generate employee_id if not provided
    if employee_id is None:
        employee_id = Faculty.generate_next_faculty_id(department_code)
    try:
        # Get department
        department = Department.objects.get(code=department_code)

        # Check if user already exists
        if User.objects.filter(username=employee_id).exists():
            print(f"  [SKIP] User with employee_id '{employee_id}' already exists")
            return None

        # Create User with employee_id as username
        user = User.objects.create_user(
            username=employee_id,  # Use employee_id for login
            email=email,
            password='faculty123',  # Default password (should be changed on first login)
            role='FACULTY',
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        )

        # Create Faculty profile
        faculty = Faculty.objects.create(
            user=user,
            employee_id=employee_id,
            name=name,  # Full display name
            department=department,
            designation=designation,
            email=email,
            class_advisor_section=class_advisor_section
        )

        print(f"  [OK] Created faculty: {name} (ID: {employee_id})")
        if class_advisor_section:
            print(f"       Class Advisor for section: {class_advisor_section}")

        return faculty

    except Department.DoesNotExist:
        print(f"  [ERROR] Department '{department_code}' not found")
        return None
    except Exception as e:
        print(f"  [ERROR] Failed to create faculty '{employee_id}': {e}")
        return None


def main():
    print("=" * 70)
    print("CREATING SAMPLE FACULTY USERS")
    print("=" * 70)
    print()

    # Sample faculty members (employee_id will be auto-generated)
    faculty_data = [
        {
            'name': 'Dr. John Smith',
            'email': 'john.smith@university.edu',
            'department_code': 'CS',
            'designation': 'Professor',
            'class_advisor_section': 'CS-6A'  # Class advisor
        },
        {
            'name': 'Dr. Sarah Johnson',
            'email': 'sarah.johnson@university.edu',
            'department_code': 'CS',
            'designation': 'Assistant Professor',
            'class_advisor_section': 'CS-6B'  # Class advisor
        },
        {
            'name': 'Prof. Michael Brown',
            'email': 'michael.brown@university.edu',
            'department_code': 'CS',
            'designation': 'Associate Professor',
            'class_advisor_section': None  # Subject teacher only
        },
    ]

    print("Creating faculty users...")
    print("-" * 70)

    for data in faculty_data:
        create_faculty_user(**data)

    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()
    print("Login credentials for created faculty:")
    print("-" * 70)
    # Fetch created faculty to show their auto-generated employee_ids
    created_faculty = Faculty.objects.filter(
        email__in=[data['email'] for data in faculty_data]
    ).order_by('employee_id')

    for faculty in created_faculty:
        print(f"Username: {faculty.employee_id:<15} | Display Name: {faculty.name}")
        print(f"Password: faculty123 (default - should be changed)")
        print()

    print("=" * 70)
    print("USAGE IN TIMETABLE")
    print("=" * 70)
    print()
    print("When displaying timetables:")
    print("  - Store: employee_id (CS-F-001)")
    print("  - Display: name (Dr. John Smith)")
    print()
    print("When faculty logs in:")
    print("  - Username: employee_id (CS-F-001)")
    print("  - System looks up: Faculty.objects.get(employee_id='CS-F-001')")
    print("  - Displays: faculty.name (Dr. John Smith)")
    print()
    print("Auto-generation:")
    print("  - Format: DEPT-F-XXX (e.g., CS-F-001, EC-F-001)")
    print("  - IDs are permanent and sequential")
    print("  - New faculty gets next available number")
    print()


if __name__ == '__main__':
    main()
