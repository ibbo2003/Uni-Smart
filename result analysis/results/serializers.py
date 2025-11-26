"""
DRF Serializers for UniSmart Result Analysis Module

This module contains all serializers for the API endpoints.
Includes basic serializers and detailed serializers with nested data.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from decimal import Decimal

from .models import (
    User, Department, Subject, SemesterSubject,
    Student, Faculty, FacultySubjectAssignment,
    ExamSchedule, StudentResult,  # ResultAnalytics removed - using real-time analytics
    ScrapeLog, AuditLog, VTUSemesterURL
)


# ============================================================================
# USER SERIALIZERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'profile_picture', 'is_active_user',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users with password."""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role', 'phone'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


# ============================================================================
# DEPARTMENT SERIALIZERS
# ============================================================================

class DepartmentSerializer(serializers.ModelSerializer):
    """Department serializer with counts."""

    student_count = serializers.SerializerMethodField()
    faculty_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'code', 'name', 'description', 'is_active',
            'student_count', 'faculty_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_count(self, obj):
        return obj.get_student_count()

    def get_faculty_count(self, obj):
        return obj.get_faculty_count()


# ============================================================================
# SUBJECT SERIALIZERS
# ============================================================================

class SubjectSerializer(serializers.ModelSerializer):
    """Subject serializer with department details."""

    department_name = serializers.CharField(source='department.name', read_only=True)
    total_marks = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            'id', 'code', 'name', 'short_name', 'subject_type',
            'credits', 'max_internal_marks', 'max_external_marks',
            'max_total_marks', 'min_internal_marks', 'min_external_marks',
            'min_total_marks', 'total_marks', 'department',
            'department_name', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_marks(self, obj):
        return obj.get_total_marks()


# ============================================================================
# SEMESTER SUBJECT SERIALIZERS
# ============================================================================

class SemesterSubjectSerializer(serializers.ModelSerializer):
    """Semester subject mapping serializer."""

    subject_details = SubjectSerializer(source='subject', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = SemesterSubject
        fields = [
            'id', 'subject', 'subject_details', 'department',
            'department_name', 'semester', 'academic_year',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ============================================================================
# STUDENT SERIALIZERS
# ============================================================================

class StudentSerializer(serializers.ModelSerializer):
    """Basic student serializer."""

    department_name = serializers.CharField(source='department.name', read_only=True)
    cgpa = serializers.SerializerMethodField()
    total_backlogs = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'usn', 'name', 'department', 'department_name',
            'current_semester', 'batch', 'admission_year',
            'date_of_birth', 'email', 'phone', 'is_active',
            'cgpa', 'total_backlogs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_cgpa(self, obj):
        return float(obj.calculate_cgpa())

    def get_total_backlogs(self, obj):
        return obj.get_total_backlogs_count()


class StudentDetailSerializer(StudentSerializer):
    """Detailed student serializer with additional computed fields."""

    semester_wise_sgpa = serializers.SerializerMethodField()
    subject_backlogs = serializers.SerializerMethodField()

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['semester_wise_sgpa', 'subject_backlogs']

    def get_semester_wise_sgpa(self, obj):
        """Get SGPA for each semester."""
        sgpa_data = {}
        for sem in range(1, obj.current_semester + 1):
            sgpa = obj.calculate_sgpa(sem)
            sgpa_data[f"semester_{sem}"] = float(sgpa)
        return sgpa_data

    def get_subject_backlogs(self, obj):
        """Get list of backlog subjects."""
        backlogs = obj.get_backlogs()
        return [{
            'subject_code': result.subject.code,
            'subject_name': result.subject.name,
            'semester': result.semester,
            'attempt_number': result.attempt_number
        } for result in backlogs]


# ============================================================================
# FACULTY SERIALIZERS
# ============================================================================

class FacultySerializer(serializers.ModelSerializer):
    """Faculty serializer."""

    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = [
            'id', 'employee_id', 'name', 'department', 'department_name',
            'designation', 'email', 'phone', 'is_active',
            'assigned_subjects_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_subjects_count(self, obj):
        return obj.subject_assignments.filter(is_active=True).count()


# ============================================================================
# FACULTY SUBJECT ASSIGNMENT SERIALIZERS
# ============================================================================

class FacultySubjectAssignmentSerializer(serializers.ModelSerializer):
    """Faculty subject assignment serializer."""

    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = FacultySubjectAssignment
        fields = [
            'id', 'faculty', 'faculty_name', 'subject', 'subject_name',
            'subject_code', 'semester', 'academic_year', 'section',
            'is_active', 'assigned_at'
        ]
        read_only_fields = ['id', 'assigned_at']


# ============================================================================
# EXAM SCHEDULE SERIALIZERS
# ============================================================================

class ExamScheduleSerializer(serializers.ModelSerializer):
    """Exam schedule serializer."""

    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'exam_name', 'exam_type', 'semester', 'academic_year',
            'start_date', 'end_date', 'result_declared_date',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ============================================================================
# STUDENT RESULT SERIALIZERS
# ============================================================================

class StudentResultSerializer(serializers.ModelSerializer):
    """Basic student result serializer."""

    student_usn = serializers.CharField(source='student.usn', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    percentage = serializers.SerializerMethodField()
    pass_status = serializers.SerializerMethodField()

    class Meta:
        model = StudentResult
        fields = [
            'id', 'student', 'student_usn', 'student_name',
            'subject', 'subject_code', 'subject_name',
            'exam_schedule', 'semester', 'internal_marks',
            'external_marks', 'total_marks', 'result_status', 'pass_status',
            'grade', 'grade_point', 'percentage', 'is_latest',
            'attempt_number', 'announced_date', 'scraped_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_marks', 'grade', 'grade_point', 'scraped_at', 'updated_at']

    def get_percentage(self, obj):
        return float(obj.get_percentage())

    def get_pass_status(self, obj):
        """Convert result_status 'P'/'F' to boolean."""
        return obj.result_status == 'P'


class StudentResultDetailSerializer(StudentResultSerializer):
    """Detailed student result serializer with nested objects."""

    subject_details = SubjectSerializer(source='subject', read_only=True)
    student_details = StudentSerializer(source='student', read_only=True)

    class Meta(StudentResultSerializer.Meta):
        fields = StudentResultSerializer.Meta.fields + ['subject_details', 'student_details']


# ============================================================================
# RESULT ANALYTICS SERIALIZERS
# ============================================================================

# NOTE: ResultAnalyticsSerializer removed - analytics now calculated in real-time via analytics_service.py
#
# class ResultAnalyticsSerializer(serializers.ModelSerializer):
#     """Result analytics serializer."""
#
#     department_name = serializers.CharField(source='department.name', read_only=True)
#     subject_name = serializers.CharField(source='subject.name', read_only=True, allow_null=True)
#
#     class Meta:
#         model = ResultAnalytics
#         fields = [
#             'id', 'department', 'department_name', 'semester',
#             'subject', 'subject_name', 'academic_year',
#             'total_students', 'students_passed', 'students_failed',
#             'students_absent', 'pass_percentage', 'avg_marks',
#             'highest_marks', 'lowest_marks', 'median_marks',
#             'avg_cgpa', 'last_updated'
#         ]
#         read_only_fields = ['id', 'last_updated']


# ============================================================================
# SCRAPE LOG SERIALIZERS
# ============================================================================

class ScrapeLogSerializer(serializers.ModelSerializer):
    """Scrape log serializer."""

    initiated_by_username = serializers.CharField(source='initiated_by.username', read_only=True)

    class Meta:
        model = ScrapeLog
        fields = [
            'id', 'initiated_by', 'initiated_by_username', 'usn',
            'status', 'records_created', 'records_updated',
            'error_message', 'captcha_attempts', 'execution_time',
            'scraped_at'
        ]
        read_only_fields = ['id', 'scraped_at']


# ============================================================================
# AUDIT LOG SERIALIZERS
# ============================================================================

class AuditLogSerializer(serializers.ModelSerializer):
    """Audit log serializer."""

    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'username', 'action', 'model_name',
            'object_id', 'description', 'ip_address', 'user_agent',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


# ============================================================================
# SPECIAL REQUEST/RESPONSE SERIALIZERS
# ============================================================================

class ScrapeRequestSerializer(serializers.Serializer):
    """Serializer for scrape requests."""

    usn = serializers.CharField(required=False, max_length=20)
    usn_list = serializers.ListField(
        child=serializers.CharField(max_length=20),
        required=False
    )

    def validate(self, attrs):
        usn = attrs.get('usn')
        usn_list = attrs.get('usn_list')

        if not usn and not usn_list:
            raise serializers.ValidationError("Either 'usn' or 'usn_list' must be provided.")

        if usn and usn_list:
            raise serializers.ValidationError("Provide either 'usn' or 'usn_list', not both.")

        return attrs


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""

    total_students = serializers.IntegerField()
    total_departments = serializers.IntegerField()
    total_subjects = serializers.IntegerField()
    total_results = serializers.IntegerField()
    avg_cgpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    total_backlogs = serializers.IntegerField()
    recent_scrapes = serializers.IntegerField()


class ExportRequestSerializer(serializers.Serializer):
    """Serializer for export requests."""

    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('xlsx', 'Excel'),
        ('pdf', 'PDF'),
    ]

    format = serializers.ChoiceField(choices=FORMAT_CHOICES, default='xlsx')
    department = serializers.UUIDField(required=False)
    semester = serializers.IntegerField(required=False, min_value=1, max_value=8)
    academic_year = serializers.CharField(required=False, max_length=20)


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True, label="Confirm New Password")

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class SemesterResultsSerializer(serializers.Serializer):
    """Serializer for semester-wise results grouping."""

    semester = serializers.IntegerField()
    sgpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    total_subjects = serializers.IntegerField()
    passed_subjects = serializers.IntegerField()
    failed_subjects = serializers.IntegerField()
    results = StudentResultSerializer(many=True)


# ============================================================================
# VTU SEMESTER URL SERIALIZERS
# ============================================================================

class VTUSemesterURLSerializer(serializers.ModelSerializer):
    """
    Serializer for VTU semester-wise result portal URLs.
    Handles CRUD operations for semester URL configuration.
    """

    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    url_type = serializers.SerializerMethodField()

    class Meta:
        model = VTUSemesterURL
        fields = [
            'id', 'semester', 'academic_year', 'url', 'is_active',
            'created_at', 'updated_at', 'updated_by', 'updated_by_username',
            'url_type'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']

    def get_url_type(self, obj):
        """Return URL type (even/odd semester)."""
        return obj.get_url_type()
