"""
DRF ViewSets for UniSmart Result Analysis Module

This module contains all API ViewSets with role-based access control,
custom actions, filtering, and analytics endpoints.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from decimal import Decimal

from .models import (
    User, Department, Subject, SemesterSubject,
    Student, Faculty, FacultySubjectAssignment,
    ExamSchedule, StudentResult,  # ResultAnalytics removed - using real-time analytics
    ScrapeLog, AuditLog, SystemSettings
)
from .serializers import (
    UserSerializer, UserCreateSerializer, DepartmentSerializer,
    SubjectSerializer, SemesterSubjectSerializer, StudentSerializer,
    StudentDetailSerializer, FacultySerializer, FacultySubjectAssignmentSerializer,
    ExamScheduleSerializer, StudentResultSerializer, StudentResultDetailSerializer,
    # ResultAnalyticsSerializer removed - using real-time analytics
    ScrapeLogSerializer, AuditLogSerializer,
    ScrapeRequestSerializer, DashboardStatsSerializer, PasswordChangeSerializer,
    SemesterResultsSerializer
)
from .permissions import (
    IsAdmin, IsFaculty, IsStudent, IsAdminOrFaculty,
    IsOwnerOrAdminOrFaculty, IsAdminOrReadOnly,
    CanAccessScraper, CanViewAnalytics, IsSameUserOrAdmin
)
from .scraper_service import scrape_single_usn, scrape_batch_usns


# ============================================================================
# USER VIEWSET
# ============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User management.
    Admin can perform all operations.
    Users can view and update their own profile.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active_user']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [IsAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsSameUserOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password."""
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Wrong password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


# ============================================================================
# DEPARTMENT VIEWSET
# ============================================================================

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department management.
    Admin can perform write operations.
    All authenticated users can read.
    """

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['code', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    @action(detail=True, methods=['get'])
    def subjects(self, request, pk=None):
        """Get all subjects for a department."""
        department = self.get_object()
        subjects = Subject.objects.filter(department=department, is_active=True)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in a department."""
        department = self.get_object()
        semester = request.query_params.get('semester')

        students = Student.objects.filter(department=department, is_active=True)

        if semester:
            students = students.filter(current_semester=semester)

        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    # NOTE: Commented out - analytics now available via /api/analytics/ endpoints
    # @action(detail=True, methods=['get'])
    # def performance(self, request, pk=None):
    #     """Get performance analytics for a department."""
    #     department = self.get_object()
    #     semester = request.query_params.get('semester')
    #     academic_year = request.query_params.get('academic_year', '2024-2025')
    #
    #     analytics_filter = {
    #         'department': department,
    #         'academic_year': academic_year
    #     }
    #
    #     if semester:
    #         analytics_filter['semester'] = semester
    #
    #     analytics = ResultAnalytics.objects.filter(**analytics_filter)
    #     serializer = ResultAnalyticsSerializer(analytics, many=True)
    #
    #     return Response(serializer.data)


# ============================================================================
# SUBJECT VIEWSET
# ============================================================================

class SubjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Subject management.
    Admin can perform write operations.
    All authenticated users can read.
    """

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['code', 'subject_type', 'department', 'is_active']
    search_fields = ['code', 'name', 'short_name']
    ordering_fields = ['code', 'name', 'credits']
    ordering = ['code']

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all results for a subject."""
        subject = self.get_object()
        results = StudentResult.objects.filter(subject=subject, is_latest=True)

        # Filter by semester if provided
        semester = request.query_params.get('semester')
        if semester:
            results = results.filter(semester=semester)

        serializer = StudentResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for a subject."""
        subject = self.get_object()
        semester = request.query_params.get('semester')

        results = StudentResult.objects.filter(subject=subject, is_latest=True)

        if semester:
            results = results.filter(semester=semester)

        total = results.count()
        passed = results.filter(result_status='P').count()
        failed = results.filter(result_status='F').count()
        absent = results.filter(result_status='A').count()

        avg_marks = results.aggregate(Avg('total_marks'))['total_marks__avg'] or 0
        pass_percentage = (passed / total * 100) if total > 0 else 0

        analytics_data = {
            'subject_code': subject.code,
            'subject_name': subject.name,
            'total_students': total,
            'passed': passed,
            'failed': failed,
            'absent': absent,
            'pass_percentage': round(pass_percentage, 2),
            'average_marks': round(avg_marks, 2)
        }

        return Response(analytics_data)


# ============================================================================
# STUDENT VIEWSET
# ============================================================================

class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student management.
    Students can only view their own data.
    Faculty can view students in their department.
    Admin can view all students.
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'current_semester', 'batch', 'is_active']
    search_fields = ['usn', 'name', 'email']
    ordering_fields = ['usn', 'name', 'batch']
    ordering = ['usn']

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user

        if user.role == 'ADMIN':
            return Student.objects.all()
        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile
                return Student.objects.filter(department=faculty.department)
            except:
                return Student.objects.none()
        elif user.role == 'STUDENT':
            try:
                return Student.objects.filter(id=user.student_profile.id)
            except:
                return Student.objects.none()

        return Student.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all results for a student, grouped by semester."""
        student = self.get_object()

        # Get all semesters
        semesters = StudentResult.objects.filter(
            student=student,
            is_latest=True
        ).values_list('semester', flat=True).distinct().order_by('semester')

        semester_data = []

        for sem in semesters:
            results = StudentResult.objects.filter(
                student=student,
                semester=sem,
                is_latest=True
            )

            sgpa = student.calculate_sgpa(sem)
            passed = results.filter(result_status='P').count()
            failed = results.filter(result_status='F').count()

            semester_data.append({
                'semester': sem,
                'sgpa': float(sgpa),
                'total_subjects': results.count(),
                'passed_subjects': passed,
                'failed_subjects': failed,
                'results': StudentResultSerializer(results, many=True).data
            })

        return Response(semester_data)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for a student."""
        student = self.get_object()

        cgpa = student.calculate_cgpa()
        backlogs = student.get_backlogs()

        # Semester-wise SGPA
        sgpa_data = {}
        for sem in range(1, student.current_semester + 1):
            sgpa_data[f'semester_{sem}'] = float(student.calculate_sgpa(sem))

        # Grade distribution
        results = StudentResult.objects.filter(student=student, is_latest=True)
        grade_distribution = {}
        for grade_choice in ['S', 'A', 'B', 'C', 'D', 'E', 'F']:
            count = results.filter(grade=grade_choice).count()
            grade_distribution[grade_choice] = count

        analytics_data = {
            'usn': student.usn,
            'name': student.name,
            'cgpa': float(cgpa),
            'total_backlogs': backlogs.count(),
            'backlogs': [{
                'subject_code': b.subject.code,
                'subject_name': b.subject.name,
                'semester': b.semester,
                'attempt_number': b.attempt_number
            } for b in backlogs],
            'semester_wise_sgpa': sgpa_data,
            'grade_distribution': grade_distribution,
            'total_credits_earned': results.filter(result_status='P').aggregate(
                Sum('subject__credits')
            )['subject__credits__sum'] or 0
        }

        return Response(analytics_data)

    @action(detail=True, methods=['get'])
    def transcript(self, request, pk=None):
        """Get full academic transcript for a student."""
        student = self.get_object()

        results = StudentResult.objects.filter(
            student=student,
            is_latest=True
        ).order_by('semester', 'subject__code')

        transcript_data = {
            'student': StudentDetailSerializer(student).data,
            'cgpa': float(student.calculate_cgpa()),
            'results': StudentResultDetailSerializer(results, many=True).data
        }

        return Response(transcript_data)


# ============================================================================
# FACULTY VIEWSET
# ============================================================================

class FacultyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Faculty management.
    Admin can perform write operations.
    All authenticated users can read.
    """

    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'designation', 'is_active']
    search_fields = ['employee_id', 'name', 'email']
    ordering_fields = ['employee_id', 'name']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def subjects(self, request, pk=None):
        """Get all subjects assigned to a faculty member."""
        faculty = self.get_object()
        assignments = FacultySubjectAssignment.objects.filter(
            faculty=faculty,
            is_active=True
        )

        # Group by academic year and semester
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            assignments = assignments.filter(academic_year=academic_year)

        serializer = FacultySubjectAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


# ============================================================================
# STUDENT RESULT VIEWSET
# ============================================================================

class StudentResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentResult management.
    Results are filtered based on user role.
    """

    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'subject', 'semester', 'result_status', 'is_latest']
    search_fields = ['student__usn', 'student__name', 'subject__code', 'subject__name']
    ordering_fields = ['announced_date', 'total_marks']
    ordering = ['-announced_date']

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user

        if user.role == 'ADMIN':
            return StudentResult.objects.all()
        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile
                return StudentResult.objects.filter(student__department=faculty.department)
            except:
                return StudentResult.objects.none()
        elif user.role == 'STUDENT':
            try:
                return StudentResult.objects.filter(student=user.student_profile)
            except:
                return StudentResult.objects.none()

        return StudentResult.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentResultDetailSerializer
        return StudentResultSerializer


# ============================================================================
# SCRAPER VIEWSET
# ============================================================================

class ScraperViewSet(viewsets.ViewSet):
    """
    ViewSet for VTU result scraping operations.
    Only Admin can access.
    """

    permission_classes = [CanAccessScraper]

    @action(detail=False, methods=['post'])
    def scrape(self, request):
        """
        Scrape results for one or multiple USNs.
        Body: {"usn": "2AB22CS008"} or {"usn_list": ["2AB22CS008", "2AB22CS009"]}
        """
        serializer = ScrapeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usn = serializer.validated_data.get('usn')
        usn_list = serializer.validated_data.get('usn_list')

        try:
            if usn:
                # Single USN scrape
                result = scrape_single_usn(usn, request.user, headless=True)
                return Response(result, status=status.HTTP_200_OK)
            else:
                # Batch scrape
                result = scrape_batch_usns(usn_list, request.user, headless=True, delay_seconds=3)
                return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def logs(self, request):
        """Get scraping logs."""
        logs = ScrapeLog.objects.all()

        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            logs = logs.filter(status=status_filter)

        # Filter by USN if provided
        usn_filter = request.query_params.get('usn')
        if usn_filter:
            logs = logs.filter(usn=usn_filter)

        # Pagination
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = ScrapeLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ScrapeLogSerializer(logs, many=True)
        return Response(serializer.data)

    def paginate_queryset(self, queryset):
        """Simple pagination helper."""
        return None  # Use DRF's pagination in production


# ============================================================================
# ANALYTICS VIEWSET
# ============================================================================

class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for analytics and dashboard statistics.
    All authenticated users can access (with role-based filtering).
    """

    permission_classes = [CanViewAnalytics]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics based on user role."""
        user = request.user

        if user.role == 'ADMIN':
            # Admin sees everything
            stats = {
                'total_students': Student.objects.filter(is_active=True).count(),
                'total_departments': Department.objects.filter(is_active=True).count(),
                'total_subjects': Subject.objects.filter(is_active=True).count(),
                'total_results': StudentResult.objects.filter(is_latest=True).count(),
                'avg_cgpa': 0,
                'total_backlogs': StudentResult.objects.filter(is_latest=True, result_status='F').count(),
                'recent_scrapes': ScrapeLog.objects.filter(
                    scraped_at__gte=timezone.now().replace(hour=0, minute=0, second=0)
                ).count()
            }

            # Calculate average CGPA
            students = Student.objects.filter(is_active=True)
            cgpa_sum = sum([student.calculate_cgpa() for student in students])
            stats['avg_cgpa'] = float(cgpa_sum / students.count()) if students.count() > 0 else 0

        elif user.role == 'FACULTY':
            # Faculty sees department statistics
            try:
                faculty = user.faculty_profile
                department = faculty.department

                students = Student.objects.filter(department=department, is_active=True)

                stats = {
                    'department': department.name,
                    'total_students': students.count(),
                    'total_subjects': Subject.objects.filter(department=department, is_active=True).count(),
                    'total_results': StudentResult.objects.filter(
                        student__department=department,
                        is_latest=True
                    ).count(),
                    'avg_cgpa': 0,
                    'total_backlogs': StudentResult.objects.filter(
                        student__department=department,
                        is_latest=True,
                        result_status='F'
                    ).count()
                }

                cgpa_sum = sum([student.calculate_cgpa() for student in students])
                stats['avg_cgpa'] = float(cgpa_sum / students.count()) if students.count() > 0 else 0

            except:
                stats = {}

        elif user.role == 'STUDENT':
            # Student sees their own statistics
            try:
                student = user.student_profile

                stats = {
                    'usn': student.usn,
                    'name': student.name,
                    'cgpa': float(student.calculate_cgpa()),
                    'current_semester': student.current_semester,
                    'total_backlogs': student.get_total_backlogs_count(),
                    'total_subjects_taken': StudentResult.objects.filter(
                        student=student,
                        is_latest=True
                    ).count()
                }
            except:
                stats = {}

        else:
            stats = {}

        return Response(stats)

    # NOTE: Commented out - analytics now available via /api/analytics/ endpoints
    # @action(detail=False, methods=['get'])
    # def performance_trends(self, request):
    #     """Get performance trends over semesters."""
    #     department_id = request.query_params.get('department')
    #
    #     if not department_id:
    #         return Response(
    #             {'error': 'Department ID is required'},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )
    #
    #     try:
    #         department = Department.objects.get(id=department_id)
    #     except Department.DoesNotExist:
    #         return Response(
    #             {'error': 'Department not found'},
    #             status=status.HTTP_404_NOT_FOUND
    #         )
    #
    #     # Get analytics for all semesters
    #     analytics = ResultAnalytics.objects.filter(
    #         department=department,
    #         subject__isnull=True  # Overall department analytics
    #     ).order_by('semester')
    #
    #     serializer = ResultAnalyticsSerializer(analytics, many=True)
    #     return Response(serializer.data)


# ============================================================================
# EXAM SCHEDULE VIEWSET
# ============================================================================

class ExamScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Exam Schedule management.
    Admin can perform write operations.
    All authenticated users can read.
    """

    queryset = ExamSchedule.objects.all()
    serializer_class = ExamScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam_type', 'semester', 'academic_year', 'is_active']
    search_fields = ['exam_name']
    ordering_fields = ['start_date', 'exam_name']
    ordering = ['-start_date']


# ============================================================================
# ANALYTICS API VIEWS (Real-time calculation)
# ============================================================================

from .analytics_service import ResultAnalytics as AnalyticsService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_analytics_view(request):
    """
    GET /api/analytics/subject/

    Query params:
    - department: CS, EC, ME, etc. (required)
    - semester: 1-8 (required)
    - subject: Subject code, e.g., BCS601 (required)
    - batch: 22, 23, etc. (optional)

    Returns subject-level analytics including pass rates, toppers, grade distribution.
    """
    department = request.query_params.get('department')
    semester = request.query_params.get('semester')
    subject = request.query_params.get('subject')
    batch = request.query_params.get('batch')

    if not all([department, semester, subject]):
        return Response(
            {'error': 'Required parameters: department, semester, subject'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        semester = int(semester)
        if not (1 <= semester <= 8):
            raise ValueError
    except ValueError:
        return Response(
            {'error': 'Semester must be a number between 1-8'},
            status=status.HTTP_400_BAD_REQUEST
        )

    analytics = AnalyticsService.get_subject_analytics(
        department_code=department.upper(),
        semester=semester,
        subject_code=subject.upper(),
        batch=batch
    )

    if 'error' in analytics:
        return Response(analytics, status=status.HTTP_404_NOT_FOUND)

    return Response(analytics, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def batch_analytics_view(request):
    """
    GET /api/analytics/batch/

    Query params:
    - batch: 22, 23, etc. (required)
    - semester: 1-8 (required)
    - department: CS, EC, ME, etc. (required)

    Returns batch-level analytics for a semester including SGPA, subject stats, toppers.
    """
    batch = request.query_params.get('batch')
    semester = request.query_params.get('semester')
    department = request.query_params.get('department')

    if not all([batch, semester, department]):
        return Response(
            {'error': 'Required parameters: batch, semester, department'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        semester = int(semester)
        if not (1 <= semester <= 8):
            raise ValueError
    except ValueError:
        return Response(
            {'error': 'Semester must be a number between 1-8'},
            status=status.HTTP_400_BAD_REQUEST
        )

    analytics = AnalyticsService.get_batch_semester_analytics(
        batch=batch,
        semester=semester,
        department_code=department.upper()
    )

    if 'error' in analytics:
        return Response(analytics, status=status.HTTP_404_NOT_FOUND)

    return Response(analytics, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_overview_view(request):
    """
    GET /api/analytics/department/

    Query params:
    - department: CS, EC, ME, etc. (required)
    - batch: 22, 23, etc. (optional)

    Returns department-wide overview with semester-wise statistics.
    """
    department = request.query_params.get('department')
    batch = request.query_params.get('batch')

    if not department:
        return Response(
            {'error': 'Required parameter: department'},
            status=status.HTTP_400_BAD_REQUEST
        )

    analytics = AnalyticsService.get_department_overview(
        department_code=department.upper(),
        batch=batch
    )

    if 'error' in analytics:
        return Response(analytics, status=status.HTTP_404_NOT_FOUND)

    return Response(analytics, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def student_comparison_view(request):
    """
    POST /api/analytics/compare/

    Body:
    {
        "usns": ["2AB22CS008", "2AB22CS062"],
        "semester": 6  // optional
    }

    Returns comparison of students with their GPAs and pass rates.
    """
    usns = request.data.get('usns', [])
    semester = request.data.get('semester')

    if not usns or not isinstance(usns, list):
        return Response(
            {'error': 'Required: usns array'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if semester:
        try:
            semester = int(semester)
            if not (1 <= semester <= 8):
                raise ValueError
        except ValueError:
            return Response(
                {'error': 'Semester must be between 1-8'},
                status=status.HTTP_400_BAD_REQUEST
            )

    comparison = AnalyticsService.get_student_comparison(
        usn_list=usns,
        semester=semester
    )

    return Response(comparison, status=status.HTTP_200_OK)


# ============================================================================
# SYSTEM SETTINGS ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_settings(request):
    """
    GET /api/settings/

    Get all system settings
    """
    settings = SystemSettings.objects.all()

    data = [
        {
            'key': setting.key,
            'value': setting.value,
            'description': setting.description,
            'updated_at': setting.updated_at,
            'updated_by': setting.updated_by.username if setting.updated_by else None
        }
        for setting in settings
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vtu_link(request):
    """
    GET /api/settings/vtu-link/

    Get current VTU results portal URL
    """
    vtu_url = SystemSettings.get_setting('VTU_RESULTS_URL')

    if not vtu_url:
        return Response(
            {'error': 'VTU URL not configured'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        setting = SystemSettings.objects.get(key='VTU_RESULTS_URL')

        return Response({
            'url': vtu_url,
            'last_updated': setting.updated_at,
            'updated_by': setting.updated_by.username if setting.updated_by else None
        }, status=status.HTTP_200_OK)
    except SystemSettings.DoesNotExist:
        return Response({
            'url': vtu_url,
            'last_updated': None,
            'updated_by': None
        }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_vtu_link(request):
    """
    PUT /api/settings/vtu-link/

    Update VTU results portal URL

    Body:
    {
        "url": "https://results.vtu.ac.in/JJEcbcs26/index.php"
    }

    Only admin users can update
    """
    new_url = request.data.get('url')

    if not new_url:
        return Response(
            {'error': 'URL is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Basic validation
    if not new_url.startswith('https://results.vtu.ac.in/'):
        return Response(
            {'error': 'Invalid VTU URL format. Must start with https://results.vtu.ac.in/'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update setting
    SystemSettings.set_setting(
        key='VTU_RESULTS_URL',
        value=new_url,
        description='Current VTU Results Portal URL (updates every semester)',
        user=request.user
    )

    return Response({
        'message': 'VTU URL updated successfully',
        'url': new_url,
        'updated_by': request.user.username
    }, status=status.HTTP_200_OK)
