"""
URL Configuration for UniSmart Results API

This module defines all API endpoints using Django REST Framework routers.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

from . import views
from .views import (
    UserViewSet, DepartmentViewSet, SubjectViewSet,
    StudentViewSet, FacultyViewSet, FacultySubjectAssignmentViewSet,
    StudentResultViewSet, ScraperViewSet, AnalyticsViewSet, ExamScheduleViewSet,
    VTUSemesterURLViewSet, NotificationViewSet,
    # Real-time analytics views
    subject_analytics_view, batch_analytics_view,
    department_overview_view, student_comparison_view
)

# Create router and register viewsets
router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'faculty', FacultyViewSet, basename='faculty')
router.register(r'faculty-assignments', FacultySubjectAssignmentViewSet, basename='faculty-assignment')
router.register(r'results', StudentResultViewSet, basename='result')
router.register(r'scraper', ScraperViewSet, basename='scraper')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'exams', ExamScheduleViewSet, basename='exam')
router.register(r'vtu-semester-urls', VTUSemesterURLViewSet, basename='vtu-semester-url')
router.register(r'notifications', NotificationViewSet, basename='notification')

# URL patterns
urlpatterns = [
    # JWT Authentication endpoints
    path('auth/register/', views.register_user, name='register_user'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Real-time Analytics API endpoints
    path('analytics/subject/', subject_analytics_view, name='analytics_subject'),
    path('analytics/batch/', batch_analytics_view, name='analytics_batch'),
    path('analytics/department/', department_overview_view, name='analytics_department'),
    path('analytics/compare/', student_comparison_view, name='analytics_compare'),

    # System Settings endpoints
    path('settings/', views.get_all_settings, name='get_all_settings'),
    path('settings/vtu-link/', views.get_vtu_link, name='get_vtu_link'),
    path('settings/vtu-link/update/', views.update_vtu_link, name='update_vtu_link'),

    # Include router URLs
    path('', include(router.urls)),
]
