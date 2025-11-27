"""
Django Admin Configuration for UniSmart Result Analysis Module

This module configures the Django admin interface for all models.
Provides comprehensive admin views with filters, search, and custom actions.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Count

from .models import (
    User, Department, Subject, SemesterSubject,
    Student, Faculty, FacultySubjectAssignment,
    ExamSchedule, StudentResult,  # ResultAnalytics removed - using real-time analytics
    ScrapeLog, AuditLog, SystemSettings, Notification
)


# ============================================================================
# USER ADMIN
# ============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin."""

    list_display = ['username', 'email', 'role', 'is_active_user', 'created_at']
    list_filter = ['role', 'is_active_user', 'is_staff', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'profile_picture', 'is_active_user')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'email')
        }),
    )


# ============================================================================
# DEPARTMENT ADMIN
# ============================================================================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Department admin."""

    list_display = ['code', 'name', 'student_count_display', 'faculty_count_display', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['code']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def student_count_display(self, obj):
        count = obj.get_student_count()
        return format_html('<b>{}</b>', count)
    student_count_display.short_description = 'Students'

    def faculty_count_display(self, obj):
        count = obj.get_faculty_count()
        return format_html('<b>{}</b>', count)
    faculty_count_display.short_description = 'Faculty'


# ============================================================================
# SUBJECT ADMIN
# ============================================================================

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    """Subject admin."""

    list_display = ['code', 'short_name', 'subject_type', 'credits', 'max_internal_marks', 'max_external_marks', 'department', 'is_active']
    list_filter = ['subject_type', 'department', 'is_active', 'created_at']
    search_fields = ['code', 'name', 'short_name']
    ordering = ['code']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'short_name', 'subject_type', 'credits', 'department'),
            'description': (
                'Subject Type Guide:\n'
                '• Theory: Regular theory subjects (4 credits)\n'
                '• Laboratory: Lab practicals (2-3 credits)\n'
                '• Project: Project work (1-2 credits)\n'
                '• Internship: Industry internship (1-2 credits)\n'
                '• Seminar: Technical seminar (1 credit)\n'
                '• Non-Credit Mandatory: Yoga, IKS, Environmental Studies (0 credits)'
            )
        }),
        ('Maximum Marks Configuration', {
            'fields': ('max_internal_marks', 'max_external_marks', 'max_total_marks'),
            'description': 'Configure maximum marks for internal (CIE), external (SEE), and total.'
        }),
        ('Minimum Passing Marks', {
            'fields': ('min_internal_marks', 'min_external_marks', 'min_total_marks'),
            'description': (
                'Non-Credit Mandatory Courses:\n'
                '• Max Internal: 100, Max External: 0\n'
                '• Pass criteria: >= 35 marks\n'
                '• Credits: 0 (not counted in CGPA)\n\n'
                'Regular Subjects:\n'
                '• Internal >= 35%, External >= 35%, Total >= 40%'
            )
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Auto-configure Non-Credit Mandatory Courses and calculate minimum marks.
        """
        # Auto-configure Non-Credit Mandatory Courses
        if obj.subject_type == 'NON_CREDIT':
            obj.credits = 0
            obj.max_internal_marks = 100
            obj.max_external_marks = 0
            obj.max_total_marks = 100
            obj.min_internal_marks = 35
            obj.min_external_marks = 0
            obj.min_total_marks = 35
        else:
            # Calculate max total marks
            obj.max_total_marks = obj.max_internal_marks + obj.max_external_marks

            # Calculate minimum marks (35% for IA/Ext, 40% for total) if not provided
            if not obj.min_internal_marks:
                obj.min_internal_marks = int(obj.max_internal_marks * 0.35)

            if not obj.min_external_marks:
                obj.min_external_marks = int(obj.max_external_marks * 0.35)

            if not obj.min_total_marks:
                obj.min_total_marks = int(obj.max_total_marks * 0.40)

        super().save_model(request, obj, form, change)


# ============================================================================
# SEMESTER SUBJECT ADMIN
# ============================================================================

@admin.register(SemesterSubject)
class SemesterSubjectAdmin(admin.ModelAdmin):
    """Semester Subject mapping admin."""

    list_display = ['subject', 'department', 'semester', 'academic_year', 'is_active']
    list_filter = ['department', 'semester', 'academic_year', 'is_active']
    search_fields = ['subject__code', 'subject__name']
    ordering = ['semester', 'subject__code']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Mapping', {
            'fields': ('subject', 'department', 'semester', 'academic_year')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


# ============================================================================
# STUDENT ADMIN
# ============================================================================

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """Student admin."""

    list_display = ['usn', 'name', 'department', 'current_semester', 'batch', 'cgpa_display', 'backlogs_display', 'is_active']
    list_filter = ['department', 'current_semester', 'batch', 'is_active', 'admission_year']
    search_fields = ['usn', 'name', 'email']
    ordering = ['usn']
    readonly_fields = ['created_at', 'updated_at', 'cgpa_display', 'backlogs_display']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'usn', 'name', 'email', 'phone', 'date_of_birth')
        }),
        ('Academic Information', {
            'fields': ('department', 'current_semester', 'batch', 'admission_year')
        }),
        ('Performance', {
            'fields': ('cgpa_display', 'backlogs_display'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def cgpa_display(self, obj):
        cgpa = obj.calculate_cgpa()
        color = 'green' if cgpa >= 7.0 else 'orange' if cgpa >= 5.0 else 'red'
        return format_html('<b style="color: {};">{}</b>', color, f'{cgpa:.2f}')
    cgpa_display.short_description = 'CGPA'

    def backlogs_display(self, obj):
        count = obj.get_total_backlogs_count()
        color = 'green' if count == 0 else 'red'
        return format_html('<b style="color: {};">{}</b>', color, count)
    backlogs_display.short_description = 'Backlogs'


# ============================================================================
# FACULTY ADMIN
# ============================================================================

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    """Faculty admin."""

    list_display = ['employee_id', 'name', 'department', 'designation', 'email', 'is_active']
    list_filter = ['department', 'designation', 'is_active', 'created_at']
    search_fields = ['employee_id', 'name', 'email']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'employee_id', 'name', 'email', 'phone')
        }),
        ('Academic Information', {
            'fields': ('department', 'designation')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ============================================================================
# FACULTY SUBJECT ASSIGNMENT ADMIN
# ============================================================================

@admin.register(FacultySubjectAssignment)
class FacultySubjectAssignmentAdmin(admin.ModelAdmin):
    """Faculty Subject Assignment admin."""

    list_display = ['faculty', 'subject', 'semester', 'section', 'academic_year', 'is_active']
    list_filter = ['semester', 'academic_year', 'section', 'is_active']
    search_fields = ['faculty__name', 'subject__code', 'subject__name']
    ordering = ['-academic_year', 'semester']
    readonly_fields = ['assigned_at']


# ============================================================================
# EXAM SCHEDULE ADMIN
# ============================================================================

@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    """Exam Schedule admin."""

    list_display = ['exam_name', 'exam_type', 'semester', 'academic_year', 'start_date', 'end_date', 'is_active']
    list_filter = ['exam_type', 'semester', 'academic_year', 'is_active']
    search_fields = ['exam_name']
    ordering = ['-start_date']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Exam Information', {
            'fields': ('exam_name', 'exam_type', 'semester', 'academic_year')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'result_declared_date')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


# ============================================================================
# STUDENT RESULT ADMIN
# ============================================================================

@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    """Student Result admin."""

    list_display = [
        'student_usn', 'student_name', 'subject_code',
        'semester', 'internal_marks', 'external_marks', 'total_marks',
        'grade', 'result_status', 'attempt_number', 'is_latest'
    ]
    list_filter = [
        'semester', 'result_status', 'grade', 'is_latest',
        'student__department', 'announced_date'
    ]
    search_fields = ['student__usn', 'student__name', 'subject__code', 'subject__name']
    ordering = ['-announced_date', 'student__usn']
    readonly_fields = ['total_marks', 'grade', 'grade_point', 'result_status', 'scraped_at', 'updated_at']

    fieldsets = (
        ('Student & Subject', {
            'fields': ('student', 'subject', 'semester', 'exam_schedule')
        }),
        ('Marks', {
            'fields': ('internal_marks', 'external_marks', 'total_marks'),
            'description': 'Enter Internal and External marks. Total will be calculated automatically.'
        }),
        ('Result', {
            'fields': ('result_status', 'grade', 'grade_point'),
            'description': 'Result status, grade, and grade point are calculated automatically based on VTU CBCS 2015-16 criteria.'
        }),
        ('Attempt Tracking', {
            'fields': ('attempt_number', 'is_latest')
        }),
        ('Dates', {
            'fields': ('announced_date', 'scraped_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def student_usn(self, obj):
        return obj.student.usn
    student_usn.short_description = 'USN'
    student_usn.admin_order_field = 'student__usn'

    def student_name(self, obj):
        return obj.student.name
    student_name.short_description = 'Student'
    student_name.admin_order_field = 'student__name'

    def subject_code(self, obj):
        return obj.subject.code
    subject_code.short_description = 'Subject'
    subject_code.admin_order_field = 'subject__code'


# ============================================================================
# RESULT ANALYTICS ADMIN (REMOVED - Using real-time analytics via API)
# ============================================================================

# @admin.register(ResultAnalytics)
# class ResultAnalyticsAdmin(admin.ModelAdmin):
#     """Result Analytics admin."""
#
#     list_display = [
#         'department', 'semester', 'subject', 'academic_year',
#         'total_students', 'pass_percentage', 'avg_marks', 'last_updated'
#     ]
#     list_filter = ['department', 'semester', 'academic_year']
#     search_fields = ['department__name', 'subject__code']
#     ordering = ['-academic_year', 'semester']
#     readonly_fields = ['last_updated']


# ============================================================================
# SCRAPE LOG ADMIN
# ============================================================================

@admin.register(ScrapeLog)
class ScrapeLogAdmin(admin.ModelAdmin):
    """Scrape Log admin."""

    list_display = [
        'usn', 'status_display', 'records_created', 'records_updated',
        'captcha_attempts', 'execution_time', 'initiated_by', 'scraped_at'
    ]
    list_filter = ['status', 'scraped_at']
    search_fields = ['usn', 'initiated_by__username']
    ordering = ['-scraped_at']
    readonly_fields = ['scraped_at']

    fieldsets = (
        ('Request', {
            'fields': ('initiated_by', 'usn')
        }),
        ('Result', {
            'fields': ('status', 'records_created', 'records_updated', 'error_message')
        }),
        ('Performance', {
            'fields': ('captcha_attempts', 'execution_time')
        }),
        ('Timestamp', {
            'fields': ('scraped_at',)
        }),
    )

    def status_display(self, obj):
        colors = {
            'SUCCESS': 'green',
            'FAILED': 'red',
            'PARTIAL': 'orange'
        }
        color = colors.get(obj.status, 'black')
        return format_html('<b style="color: {};">{}</b>', color, obj.status)
    status_display.short_description = 'Status'


# ============================================================================
# AUDIT LOG ADMIN
# ============================================================================

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Audit Log admin."""

    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_id', 'description']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']

    fieldsets = (
        ('User & Action', {
            'fields': ('user', 'action', 'model_name', 'object_id')
        }),
        ('Details', {
            'fields': ('description',)
        }),
        ('Request Info', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )


# ============================================================================
# SYSTEM SETTINGS ADMIN
# ============================================================================

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin interface for System Settings"""

    list_display = ['key', 'value_preview', 'updated_at', 'updated_by']
    search_fields = ['key', 'value', 'description']
    readonly_fields = ['updated_at', 'updated_by']

    fieldsets = (
        ('Setting Information', {
            'fields': ('key', 'value', 'description')
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',)
        })
    )

    def value_preview(self, obj):
        """Show shortened value"""
        if len(obj.value) > 50:
            return f"{obj.value[:50]}..."
        return obj.value
    value_preview.short_description = 'Value'

    def save_model(self, request, obj, form, change):
        """Auto-set updated_by"""
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# ============================================================================
# NOTIFICATION ADMIN
# ============================================================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification admin interface."""

    list_display = [
        'title', 'priority_badge', 'created_by', 'target_department',
        'target_semester', 'is_active', 'expires_at', 'created_at'
    ]
    list_filter = ['priority', 'is_active', 'target_department', 'target_semester', 'created_at']
    search_fields = ['title', 'message', 'created_by__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Notification Content', {
            'fields': ('title', 'message', 'priority')
        }),
        ('Targeting', {
            'fields': ('target_department', 'target_semester'),
            'description': 'Leave blank to send to all departments/semesters'
        }),
        ('Status & Expiry', {
            'fields': ('is_active', 'expires_at')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def priority_badge(self, obj):
        """Display priority with color coding."""
        colors = {
            'LOW': '#3b82f6',  # blue
            'MEDIUM': '#f59e0b',  # amber
            'HIGH': '#f97316',  # orange
            'URGENT': '#ef4444',  # red
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 4px; font-weight: bold;">{}</span>',
            color, obj.priority
        )
    priority_badge.short_description = 'Priority'

    def save_model(self, request, obj, form, change):
        """Auto-set created_by to current user on creation."""
        if not change:  # Only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# Customize admin site headers
admin.site.site_header = "UniSmart Result Analysis Administration"
admin.site.site_title = "UniSmart Admin"
admin.site.index_title = "Welcome to UniSmart Administration Portal"
