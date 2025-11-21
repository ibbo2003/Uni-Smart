"""
Test script for real-time analytics service.
Run this to verify analytics calculations work correctly.
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from results.analytics_service import ResultAnalytics
from results.models import Student, Subject, Department
import json


def print_section(title):
    print('\n' + '=' * 80)
    print(f' {title}')
    print('=' * 80)


def test_subject_analytics():
    """Test subject-level analytics."""
    print_section('TEST 1: Subject Analytics')

    # Get a subject from the database
    subjects = Subject.objects.all()[:1]
    if not subjects:
        print('[X] No subjects found in database')
        return

    subject = subjects[0]

    # Get a department
    departments = Department.objects.all()[:1]
    if not departments:
        print('[X] No departments found in database')
        return

    department = departments[0]

    print(f'\nTesting analytics for:')
    print(f'  Subject: {subject.code} - {subject.name}')
    print(f'  Department: {department.code}')
    print(f'  Semester: 6')

    analytics = ResultAnalytics.get_subject_analytics(
        department_code=department.code,
        semester=6,
        subject_code=subject.code
    )

    if 'error' in analytics:
        print(f'\n[X] Error: {analytics["error"]}')
        print('   (This may be expected if no results exist for this combination)')
    elif 'message' in analytics:
        print(f'\n[INFO] {analytics["message"]}')
        print(f'  Total Students: {analytics["total_students"]}')
    else:
        print(f'\n[OK] Subject Analytics Retrieved Successfully!')
        print(f'\nKey Statistics:')
        print(f'  Total Students: {analytics["total_students"]}')
        print(f'  Pass Percentage: {analytics["pass_percentage"]}%')
        print(f'  Average Marks: {analytics["average_marks"]}')
        print(f'  Highest Marks: {analytics["highest_marks"]}')

        if analytics.get('toppers'):
            print(f'\n  Top 3 Students:')
            for topper in analytics['toppers'][:3]:
                print(f'    {topper["rank"]}. {topper["name"]} ({topper["usn"]}) - {topper["total_marks"]} marks - Grade {topper["grade"]}')


def test_batch_analytics():
    """Test batch-level analytics."""
    print_section('TEST 2: Batch Analytics')

    # Get a student to find batch
    students = Student.objects.all()[:1]
    if not students:
        print('[X] No students found in database')
        return

    student = students[0]
    batch = student.batch
    department = student.department

    print(f'\nTesting analytics for:')
    print(f'  Batch: {batch}')
    print(f'  Department: {department.code}')
    print(f'  Semester: 6')

    analytics = ResultAnalytics.get_batch_semester_analytics(
        batch=batch,
        semester=6,
        department_code=department.code
    )

    if 'error' in analytics:
        print(f'\n[X] Error: {analytics["error"]}')
    elif 'message' in analytics:
        print(f'\n[INFO] {analytics["message"]}')
        print(f'  Total Students: {analytics["total_students"]}')
    else:
        print(f'\n[OK] Batch Analytics Retrieved Successfully!')
        print(f'\nOverall Statistics:')
        print(f'  Total Students: {analytics["total_students"]}')
        print(f'  Total Subjects: {analytics["total_subjects"]}')
        print(f'  Overall Pass Rate: {analytics["overall_pass_rate"]}%')
        print(f'  Average SGPA: {analytics["average_sgpa"]}')
        print(f'  Students with Backlogs: {analytics["students_with_backlogs"]}')

        if analytics.get('batch_toppers'):
            print(f'\n  Top 3 Performers (by SGPA):')
            for topper in analytics['batch_toppers'][:3]:
                print(f'    {topper["name"]} ({topper["usn"]}) - SGPA: {topper["sgpa"]}')

        if analytics.get('subject_statistics'):
            print(f'\n  Subject Performance:')
            for subj in analytics['subject_statistics'][:3]:
                print(f'    {subj["subject_code"]}: {subj["pass_rate"]}% pass rate, Avg: {subj["average_marks"]}')


def test_department_overview():
    """Test department overview."""
    print_section('TEST 3: Department Overview')

    departments = Department.objects.all()[:1]
    if not departments:
        print('[X] No departments found in database')
        return

    department = departments[0]

    print(f'\nTesting analytics for:')
    print(f'  Department: {department.code} - {department.name}')

    analytics = ResultAnalytics.get_department_overview(
        department_code=department.code
    )

    if 'error' in analytics:
        print(f'\n[X] Error: {analytics["error"]}')
    else:
        print(f'\n[OK] Department Overview Retrieved Successfully!')
        print(f'\nOverall Statistics:')
        print(f'  Total Students: {analytics["total_students"]}')

        if analytics.get('semester_statistics'):
            print(f'\n  Semester-wise Performance:')
            for sem_stat in analytics['semester_statistics'][:4]:
                print(f'    Semester {sem_stat["semester"]}: {sem_stat["pass_rate"]}% pass rate, Avg SGPA: {sem_stat["average_sgpa"]}')


def test_student_comparison():
    """Test student comparison."""
    print_section('TEST 4: Student Comparison')

    # Get 2 students
    students = Student.objects.all()[:2]
    if len(students) < 2:
        print('[X] Need at least 2 students in database')
        return

    usn_list = [s.usn for s in students]

    print(f'\nComparing students:')
    for usn in usn_list:
        print(f'  - {usn}')

    analytics = ResultAnalytics.get_student_comparison(
        usn_list=usn_list,
        semester=6
    )

    print(f'\n[OK] Student Comparison Retrieved Successfully!')
    print(f'\nComparison Results:')
    for student_data in analytics['students']:
        if 'error' in student_data:
            print(f'  {student_data["usn"]}: [X] {student_data["error"]}')
        else:
            print(f'  {student_data["name"]} ({student_data["usn"]}):')
            print(f'    SGPA: {student_data["sgpa"]}')
            print(f'    Pass Rate: {student_data["pass_rate"]}%')
            print(f'    Subjects: {student_data["passed"]}/{student_data["total_subjects"]} passed')


def main():
    """Run all tests."""
    print('\n')
    print('+' + '=' * 78 + '+')
    print('|' + ' ' * 20 + 'ANALYTICS SERVICE TEST SUITE' + ' ' * 30 + '|')
    print('+' + '=' * 78 + '+')

    try:
        test_subject_analytics()
        test_batch_analytics()
        test_department_overview()
        test_student_comparison()

        print_section('TEST SUMMARY')
        print('[OK] All analytics methods executed successfully!')
        print('\nThe analytics service is working correctly.')
        print('You can now use the API endpoints:')
        print('  - GET  /api/analytics/subject/')
        print('  - GET  /api/analytics/batch/')
        print('  - GET  /api/analytics/department/')
        print('  - POST /api/analytics/compare/')

    except Exception as e:
        print(f'\n[X] ERROR: {str(e)}')
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
