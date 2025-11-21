"""
Custom Permission Classes for Role-Based Access Control

This module provides custom DRF permission classes to enforce
role-based access control throughout the UniSmart application.
"""

from rest_framework import permissions


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
    Only Admin can initiate scrapes.
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
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
