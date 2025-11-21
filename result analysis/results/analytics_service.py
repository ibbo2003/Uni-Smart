"""
Automated Result Analytics Service

Calculates statistics from StudentResult data in real-time.
No manual data entry required - all analytics are computed on-the-fly.

Usage:
    from results.analytics_service import ResultAnalytics

    # Subject analytics
    analytics = ResultAnalytics.get_subject_analytics(
        department_code='CS',
        semester=6,
        subject_code='BCS601',
        batch='22'
    )

    # Batch analytics
    analytics = ResultAnalytics.get_batch_semester_analytics(
        batch='22',
        semester=6,
        department_code='CS'
    )
"""

from django.db.models import Count, Avg, Max, Min, Q
from decimal import Decimal
from typing import Dict, List, Optional
from .models import Student, StudentResult, Subject, Department


class ResultAnalytics:
    """Service for calculating real-time result analytics."""

    @staticmethod
    def get_subject_analytics(
        department_code: str,
        semester: int,
        subject_code: str,
        batch: str = None
    ) -> Dict:
        """
        Calculate analytics for a specific subject.

        Args:
            department_code: e.g., 'CS'
            semester: 1-8
            subject_code: e.g., 'BCS601'
            batch: e.g., '22' (optional, filters by batch)

        Returns:
            Dict with subject analytics
        """
        try:
            subject = Subject.objects.get(code=subject_code)
            department = Department.objects.get(code=department_code)
        except (Subject.DoesNotExist, Department.DoesNotExist) as e:
            return {'error': f'{e.__class__.__name__}: {str(e)}'}

        # Base queryset
        results = StudentResult.objects.filter(
            subject=subject,
            semester=semester,
            student__department=department,
            is_latest=True
        )

        # Filter by batch if provided
        if batch:
            results = results.filter(student__batch=batch)

        total_students = results.count()

        if total_students == 0:
            return {
                'subject_code': subject_code,
                'subject_name': subject.name,
                'semester': semester,
                'department': department_code,
                'batch': batch,
                'total_students': 0,
                'message': 'No results found for this criteria'
            }

        # Count by result status
        passed = results.filter(result_status='P').count()
        failed = results.filter(result_status='F').count()
        absent = results.filter(result_status='A').count()
        withheld = results.filter(result_status='W').count()
        appeared = total_students - absent

        # Percentages
        pass_percentage = (passed / appeared * 100) if appeared > 0 else 0
        fail_percentage = (failed / appeared * 100) if appeared > 0 else 0
        absent_percentage = (absent / total_students * 100) if total_students > 0 else 0

        # Marks statistics (exclude absent students)
        appeared_results = results.exclude(result_status='A')

        marks_stats = appeared_results.aggregate(
            avg_marks=Avg('total_marks'),
            highest_marks=Max('total_marks'),
            lowest_marks=Min('total_marks'),
            avg_internal=Avg('internal_marks'),
            avg_external=Avg('external_marks')
        )

        # Median calculation
        marks_list = list(
            appeared_results.values_list('total_marks', flat=True).order_by('total_marks')
        )
        median_marks = 0
        if marks_list:
            mid = len(marks_list) // 2
            median_marks = (
                (marks_list[mid - 1] + marks_list[mid]) / 2
                if len(marks_list) % 2 == 0
                else marks_list[mid]
            )

        # Grade distribution
        grade_dist = results.values('grade').annotate(count=Count('grade'))
        grade_distribution = {item['grade']: item['count'] for item in grade_dist}

        # Toppers (top 10)
        toppers = results.filter(result_status='P').select_related(
            'student'
        ).order_by('-total_marks')[:10]

        toppers_list = [
            {
                'rank': idx + 1,
                'usn': r.student.usn,
                'name': r.student.name,
                'internal_marks': r.internal_marks,
                'external_marks': r.external_marks,
                'total_marks': r.total_marks,
                'grade': r.grade
            }
            for idx, r in enumerate(toppers)
        ]

        # Students who failed
        failed_students = results.filter(result_status='F').select_related('student')
        failed_list = [
            {
                'usn': r.student.usn,
                'name': r.student.name,
                'internal_marks': r.internal_marks,
                'external_marks': r.external_marks,
                'total_marks': r.total_marks,
                'grade': r.grade
            }
            for r in failed_students
        ]

        return {
            'subject_code': subject_code,
            'subject_name': subject.name,
            'semester': semester,
            'department': department_code,
            'department_name': department.name,
            'batch': batch,
            'credits': float(subject.credits),
            'subject_type': subject.subject_type,

            # Student counts
            'total_students': total_students,
            'students_appeared': appeared,
            'students_passed': passed,
            'students_failed': failed,
            'students_absent': absent,
            'students_withheld': withheld,

            # Percentages
            'pass_percentage': round(pass_percentage, 2),
            'fail_percentage': round(fail_percentage, 2),
            'absent_percentage': round(absent_percentage, 2),

            # Marks statistics
            'average_marks': round(marks_stats['avg_marks'] or 0, 2),
            'average_internal_marks': round(marks_stats['avg_internal'] or 0, 2),
            'average_external_marks': round(marks_stats['avg_external'] or 0, 2),
            'median_marks': round(median_marks, 2),
            'highest_marks': marks_stats['highest_marks'] or 0,
            'lowest_marks': marks_stats['lowest_marks'] or 0,

            # Grade distribution
            'grade_distribution': {
                'O': grade_distribution.get('O', 0),
                'S': grade_distribution.get('S', 0),
                'A': grade_distribution.get('A', 0),
                'B': grade_distribution.get('B', 0),
                'C': grade_distribution.get('C', 0),
                'D': grade_distribution.get('D', 0),
                'E': grade_distribution.get('E', 0),
                'F': grade_distribution.get('F', 0),
            },

            # Top performers
            'toppers': toppers_list,

            # Failed students list
            'failed_students': failed_list,
            'failed_students_count': len(failed_list)
        }

    @staticmethod
    def get_batch_semester_analytics(
        batch: str,
        semester: int,
        department_code: str
    ) -> Dict:
        """
        Calculate analytics for entire batch in a semester.

        Example: Batch 22, Semester 6, CS Department

        Args:
            batch: '22' for 2022 batch
            semester: 1-8
            department_code: 'CS', 'EC', etc.

        Returns:
            Dict with batch analytics
        """
        try:
            department = Department.objects.get(code=department_code)
        except Department.DoesNotExist:
            return {'error': 'Department not found'}

        # Get all students in this batch
        students = Student.objects.filter(
            batch=batch,
            department=department,
            is_active=True
        )

        total_students = students.count()

        if total_students == 0:
            return {
                'batch': batch,
                'semester': semester,
                'department': department_code,
                'total_students': 0,
                'message': 'No students found'
            }

        # Get all results for this batch and semester
        results = StudentResult.objects.filter(
            student__in=students,
            semester=semester,
            is_latest=True
        )

        # Overall statistics
        total_subjects = results.values('subject').distinct().count()
        total_results = results.count()
        passed_results = results.filter(result_status='P').count()
        failed_results = results.filter(result_status='F').count()
        absent_results = results.filter(result_status='A').count()

        overall_pass_rate = (
            (passed_results / (total_results - absent_results) * 100)
            if (total_results - absent_results) > 0
            else 0
        )

        # Calculate SGPA for each student
        sgpa_data = []
        for student in students:
            sgpa = student.calculate_sgpa(semester)
            if sgpa > 0:
                sgpa_data.append({
                    'usn': student.usn,
                    'name': student.name,
                    'sgpa': sgpa
                })

        avg_sgpa = (
            sum(s['sgpa'] for s in sgpa_data) / len(sgpa_data)
            if sgpa_data
            else 0
        )

        # Highest and lowest SGPA
        highest_sgpa = max((s['sgpa'] for s in sgpa_data), default=0)
        lowest_sgpa = min((s['sgpa'] for s in sgpa_data), default=0)

        # Students with backlogs (any failed subject)
        students_with_backlogs = results.filter(
            result_status='F'
        ).values('student').distinct().count()

        # Students with all pass (no backlogs)
        students_all_pass = total_students - students_with_backlogs

        # Subject-wise statistics
        subjects = results.values(
            'subject__code',
            'subject__name',
            'subject__credits'
        ).distinct()

        subject_stats = []
        for subj in subjects:
            subject_code = subj['subject__code']
            subject_name = subj['subject__name']
            credits = subj['subject__credits']

            subject_results = results.filter(subject__code=subject_code)
            subj_total = subject_results.count()
            subj_passed = subject_results.filter(result_status='P').count()
            subj_failed = subject_results.filter(result_status='F').count()
            subj_absent = subject_results.filter(result_status='A').count()
            subj_appeared = subj_total - subj_absent

            subj_pass_rate = (
                (subj_passed / subj_appeared * 100)
                if subj_appeared > 0
                else 0
            )

            # Average marks (exclude absent)
            appeared_results = subject_results.exclude(result_status='A')
            avg_marks = appeared_results.aggregate(avg=Avg('total_marks'))['avg'] or 0
            highest = appeared_results.aggregate(max=Max('total_marks'))['max'] or 0
            lowest = appeared_results.aggregate(min=Min('total_marks'))['min'] or 0

            # Grade distribution
            grades = appeared_results.values('grade').annotate(count=Count('grade'))
            grade_dist = {g['grade']: g['count'] for g in grades}

            subject_stats.append({
                'subject_code': subject_code,
                'subject_name': subject_name,
                'credits': float(credits),
                'total_students': subj_total,
                'appeared': subj_appeared,
                'passed': subj_passed,
                'failed': subj_failed,
                'absent': subj_absent,
                'pass_rate': round(subj_pass_rate, 2),
                'average_marks': round(avg_marks, 2),
                'highest_marks': highest,
                'lowest_marks': lowest,
                'grade_distribution': grade_dist
            })

        # Sort by pass rate to identify difficult subjects
        subject_stats.sort(key=lambda x: x['pass_rate'])

        # Batch toppers (by SGPA)
        sgpa_data.sort(key=lambda x: x['sgpa'], reverse=True)
        batch_toppers = sgpa_data[:10]

        return {
            'batch': batch,
            'semester': semester,
            'department': department_code,
            'department_name': department.name,

            # Overall statistics
            'total_students': total_students,
            'total_subjects': total_subjects,
            'overall_pass_rate': round(overall_pass_rate, 2),
            'average_sgpa': round(avg_sgpa, 2),
            'highest_sgpa': round(highest_sgpa, 2),
            'lowest_sgpa': round(lowest_sgpa, 2),
            'students_with_backlogs': students_with_backlogs,
            'students_all_pass': students_all_pass,

            # Subject-wise performance
            'subject_statistics': subject_stats,

            # Batch toppers
            'batch_toppers': batch_toppers,

            # Insights
            'most_difficult_subjects': subject_stats[:3],  # Top 3 lowest pass rate
            'easiest_subjects': subject_stats[-3:] if len(subject_stats) >= 3 else []
        }

    @staticmethod
    def get_department_overview(
        department_code: str,
        batch: str = None
    ) -> Dict:
        """
        Get department-wide overview.

        Args:
            department_code: 'CS', 'EC', etc.
            batch: Optional batch filter (e.g., '22')

        Returns:
            Dict with department overview
        """
        try:
            department = Department.objects.get(code=department_code)
        except Department.DoesNotExist:
            return {'error': 'Department not found'}

        # Get students
        students_query = Student.objects.filter(
            department=department,
            is_active=True
        )

        if batch:
            students_query = students_query.filter(batch=batch)

        total_students = students_query.count()

        # Semester-wise statistics
        semester_stats = []
        for sem in range(1, 9):
            results = StudentResult.objects.filter(
                student__in=students_query,
                semester=sem,
                is_latest=True
            )

            total_results = results.count()
            if total_results == 0:
                continue

            passed = results.filter(result_status='P').count()
            failed = results.filter(result_status='F').count()
            absent = results.filter(result_status='A').count()
            appeared = total_results - absent

            pass_rate = (passed / appeared * 100) if appeared > 0 else 0

            # Average SGPA for this semester
            sgpa_list = []
            for student in students_query:
                sgpa = student.calculate_sgpa(sem)
                if sgpa > 0:
                    sgpa_list.append(sgpa)

            avg_sgpa = sum(sgpa_list) / len(sgpa_list) if sgpa_list else 0

            semester_stats.append({
                'semester': sem,
                'total_students': total_results,
                'appeared': appeared,
                'passed': passed,
                'failed': failed,
                'absent': absent,
                'pass_rate': round(pass_rate, 2),
                'average_sgpa': round(avg_sgpa, 2)
            })

        return {
            'department': department_code,
            'department_name': department.name,
            'batch': batch,
            'total_students': total_students,
            'semester_statistics': semester_stats
        }

    @staticmethod
    def get_student_comparison(
        usn_list: List[str],
        semester: int = None
    ) -> Dict:
        """
        Compare multiple students.

        Args:
            usn_list: List of USNs to compare
            semester: Optional semester filter

        Returns:
            Dict with comparison data
        """
        students_data = []

        for usn in usn_list:
            try:
                student = Student.objects.get(usn=usn)
            except Student.DoesNotExist:
                students_data.append({
                    'usn': usn,
                    'error': 'Student not found'
                })
                continue

            # Calculate CGPA or SGPA
            if semester:
                gpa = student.calculate_sgpa(semester)
                gpa_type = 'SGPA'
            else:
                gpa = student.calculate_cgpa()
                gpa_type = 'CGPA'

            # Get results
            results_query = student.results.filter(is_latest=True)
            if semester:
                results_query = results_query.filter(semester=semester)

            total_subjects = results_query.count()
            passed = results_query.filter(result_status='P').count()
            failed = results_query.filter(result_status='F').count()

            students_data.append({
                'usn': student.usn,
                'name': student.name,
                'department': student.department.code,
                'batch': student.batch,
                'semester': semester or student.current_semester,
                f'{gpa_type.lower()}': round(gpa, 2),
                'total_subjects': total_subjects,
                'passed': passed,
                'failed': failed,
                'pass_rate': round((passed / total_subjects * 100), 2) if total_subjects > 0 else 0
            })

        return {
            'comparison_type': 'SGPA' if semester else 'CGPA',
            'semester': semester,
            'students': students_data
        }
