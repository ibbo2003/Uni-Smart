"""
Custom Permission Classes for Role-Based Access Control (RBAC)

This module implements comprehensive RBAC for the UniSmart Result Analysis system.
Three roles: ADMIN, FACULTY, STUDENT

Access patterns:
- ADMIN: Full access to all data
- FACULTY:
  - As Class Advisor: Can access their advised class students
  - As Subject Teacher: Can access subjects they teach
- STUDENT: Can only access their own data
"""

from rest_framework import permissions
from results.models import Faculty, FacultySubjectAssignment


class IsAdmin(permissions.BasePermission):
    """
    Permission class that only allows users with ADMIN role.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsFaculty(permissions.BasePermission):
    """
    Permission class that only allows users with FACULTY role.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'FACULTY'
        )


class IsStudent(permissions.BasePermission):
    """
    Permission class that only allows users with STUDENT role.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'STUDENT'
        )


class IsAdminOrFaculty(permissions.BasePermission):
    """
    Permission class that allows users with ADMIN or FACULTY role.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'FACULTY']
        )


class IsOwnerOrAdminOrFaculty(permissions.BasePermission):
    """
    Object-level permission to only allow:
    - Students to access their own data
    - Faculty to access students in their department
    - Admins to access everything
    """

    def has_permission(self, request, view):
        # Must be authenticated
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'ADMIN':
            return True

        # Get the student object from various models
        student = None

        # Direct Student model
        if hasattr(obj, 'usn'):
            student = obj
        # StudentResult model
        elif hasattr(obj, 'student'):
            student = obj.student
        # User model with student_profile
        elif hasattr(obj, 'student_profile'):
            student = obj.student_profile

        if not student:
            return False

        # Faculty can access students in their department
        if request.user.role == 'FACULTY':
            try:
                faculty = request.user.faculty_profile
                return student.department == faculty.department
            except:
                return False

        # Students can only access their own data
        if request.user.role == 'STUDENT':
            try:
                return student == request.user.student_profile
            except:
                return False

        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Admins to perform any action
    - Other authenticated users to only read
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for admins
        return request.user.role == 'ADMIN'


class CanAccessScraper(permissions.BasePermission):
    """
    Permission class for scraper operations.
    - ADMIN can scrape any USN
    - STUDENT can scrape their own USN
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'STUDENT']
        )


class CanViewAnalytics(permissions.BasePermission):
    """
    Permission class for analytics views.
    All authenticated users can view analytics (with data filtering in view).
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsSameUserOrAdmin(permissions.BasePermission):
    """
    Permission class that allows:
    - Users to access their own account
    - Admins to access any account
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can access any user
        if request.user.role == 'ADMIN':
            return True

        # User can access their own account
        return obj == request.user


# ============================================================================
# ENHANCED RBAC PERMISSIONS
# ============================================================================

class CanViewStudentResult(permissions.BasePermission):
    """
    Permission for viewing student results.
    - ADMIN: All results
    - FACULTY: Results from advised class + subjects taught
    - STUDENT: Own results only
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        result = obj

        if user.role == 'ADMIN':
            return True

        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile
                # Check advised class
                if faculty.class_advisor_section and result.student.section == faculty.class_advisor_section:
                    return True
                # Check subject taught
                teaches_subject = FacultySubjectAssignment.objects.filter(
                    faculty=faculty,
                    subject=result.subject,
                    is_active=True
                ).exists()
                return teaches_subject
            except Faculty.DoesNotExist:
                return False

        elif user.role == 'STUDENT':
            try:
                return result.student.user == user
            except:
                return False

        return False


class CanGenerateTimetable(permissions.BasePermission):
    """
    Permission for generating timetables.
    - ADMIN: Any class
    - FACULTY: Only their advised class
    - STUDENT: No
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role == 'ADMIN':
            return True

        elif request.user.role == 'FACULTY':
            try:
                faculty = request.user.faculty_profile
                return faculty.class_advisor_section is not None
            except Faculty.DoesNotExist:
                return False

        return False


class CanModifyTimetable(permissions.BasePermission):
    """
    Permission for modifying timetables.
    - ADMIN: Yes
    - FACULTY: No
    - STUDENT: No
    """

    def has_permission(self, request, view):
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_authenticated and request.user.role == 'ADMIN'
        return True


class CanManageExamRegistration(permissions.BasePermission):
    """
    Permission for exam registrations.
    - ADMIN: All registrations
    - FACULTY: Own advised class students
    - STUDENT: No
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'FACULTY']


class CanAssignSubjects(permissions.BasePermission):
    """
    Permission for assigning subjects to faculty.
    - ADMIN: Yes
    - FACULTY: No (cannot self-assign)
    - STUDENT: No
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'
