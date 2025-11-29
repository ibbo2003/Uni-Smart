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
    ScrapeLog, AuditLog, SystemSettings, VTUSemesterURL, Notification
)
from .serializers import (
    UserSerializer, UserCreateSerializer, DepartmentSerializer,
    SubjectSerializer, SemesterSubjectSerializer, StudentSerializer,
    StudentDetailSerializer, FacultySerializer, FacultySubjectAssignmentSerializer,
    ExamScheduleSerializer, StudentResultSerializer, StudentResultDetailSerializer,
    # ResultAnalyticsSerializer removed - using real-time analytics
    ScrapeLogSerializer, AuditLogSerializer,
    ScrapeRequestSerializer, DashboardStatsSerializer, PasswordChangeSerializer,
    SemesterResultsSerializer, VTUSemesterURLSerializer, NotificationSerializer
)
from .permissions import (
    IsAdmin, IsFaculty, IsStudent, IsAdminOrFaculty,
    IsOwnerOrAdminOrFaculty, IsAdminOrReadOnly,
    CanAccessScraper, CanViewAnalytics, IsSameUserOrAdmin,
    CanViewStudentResult, CanAssignSubjects
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
# AUTHENTICATION ENDPOINTS
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user (Student or Faculty).

    Expected payload:
    {
        "email": "2ab22cs001@anjuman.edu.in" or "john.smith@anjuman.edu.in",
        "password": "securepassword",
        "role": "STUDENT" or "FACULTY",
        "name": "Full Name",
        "usn": "2AB22CS001" (for students only),
        "department_code": "CS",
        "current_semester": 6 (for students only),
        "batch": "2022" (for students only),
        "designation": "Professor" (for faculty only),
        "employee_id": "CS-F-001" (optional for faculty, auto-generated if not provided)
    }
    """
    from .models import Department, validate_student_email, validate_faculty_email
    from django.core.exceptions import ValidationError as DjangoValidationError

    try:
        # Extract and validate required fields
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        role = request.data.get('role', '').upper()
        name = request.data.get('name', '').strip()
        department_code = request.data.get('department_code', '').upper().strip()

        # Validation
        if not all([email, password, role, name, department_code]):
            return Response(
                {'error': 'Email, password, role, name, and department_code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if role not in ['STUDENT', 'FACULTY']:
            return Response(
                {'error': 'Role must be STUDENT or FACULTY'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate email format based on role
        try:
            if role == 'STUDENT':
                validate_student_email(email)
            else:
                validate_faculty_email(email)
        except DjangoValidationError as e:
            return Response(
                {'error': str(e.message)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get department
        try:
            department = Department.objects.get(code=department_code)
        except Department.DoesNotExist:
            return Response(
                {'error': f'Department with code {department_code} not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create User
        if role == 'STUDENT':
            usn = request.data.get('usn', '').upper().strip()
            if not usn:
                return Response(
                    {'error': 'USN is required for students'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if USN already exists
            if Student.objects.filter(usn=usn).exists():
                return Response(
                    {'error': 'Student with this USN already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            username = usn.lower()  # Use USN as username for students
        else:
            # For faculty, use employee_id or generate it
            employee_id = request.data.get('employee_id')
            if not employee_id:
                employee_id = Faculty.generate_next_faculty_id(department_code)

            username = employee_id  # Use employee_id as username for faculty

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        )

        # Create role-specific profile
        if role == 'STUDENT':
            current_semester = request.data.get('current_semester', 1)
            batch = request.data.get('batch', '')

            if not batch:
                return Response(
                    {'error': 'Batch is required for students'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            student = Student.objects.create(
                user=user,
                usn=usn,
                name=name,
                department=department,
                current_semester=current_semester,
                batch=batch,
                admission_year=int(batch),
                email=email
            )

            return Response({
                'message': 'Student registered successfully',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'student_usn': student.usn
                }
            }, status=status.HTTP_201_CREATED)

        else:  # FACULTY
            designation = request.data.get('designation', '')
            if not designation:
                return Response(
                    {'error': 'Designation is required for faculty'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            employee_id = request.data.get('employee_id')
            if not employee_id:
                employee_id = Faculty.generate_next_faculty_id(department_code)

            # Check if employee_id already exists
            if Faculty.objects.filter(employee_id=employee_id).exists():
                return Response(
                    {'error': 'Faculty with this employee ID already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            faculty = Faculty.objects.create(
                user=user,
                employee_id=employee_id,
                name=name,
                department=department,
                designation=designation,
                email=email
            )

            return Response({
                'message': 'Faculty registered successfully',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'employee_id': faculty.employee_id
                }
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
    ViewSet for Student management with RBAC.
    - ADMIN: View all students
    - FACULTY: View students in their advised section (if class advisor) OR department
    - STUDENT: View only their own data
    """

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'current_semester', 'batch', 'is_active', 'section']
    search_fields = ['usn', 'name', 'email']
    ordering_fields = ['usn', 'name', 'batch']
    ordering = ['usn']

    def get_queryset(self):
        """
        Filter queryset based on user role with enhanced RBAC.
        - ADMIN: All students
        - FACULTY: Students in advised section (priority) OR entire department
        - STUDENT: Own data only
        """
        user = self.request.user

        if user.role == 'ADMIN':
            return Student.objects.all()

        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile

                # If faculty is a class advisor, prioritize advised section
                if faculty.class_advisor_section:
                    return Student.objects.filter(
                        section=faculty.class_advisor_section,
                        is_active=True
                    )

                # Otherwise, show all students in faculty's department
                return Student.objects.filter(
                    department=faculty.department,
                    is_active=True
                )
            except Faculty.DoesNotExist:
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
# FACULTY SUBJECT ASSIGNMENT VIEWSET
# ============================================================================

class FacultySubjectAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FacultySubjectAssignment management with RBAC.
    - ADMIN: Can create, view, update, delete assignments
    - FACULTY: Can only view their own assignments
    - STUDENT: Can view assignments (read-only)
    """

    queryset = FacultySubjectAssignment.objects.all()
    serializer_class = FacultySubjectAssignmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['faculty', 'subject', 'semester', 'academic_year', 'is_active']
    search_fields = ['faculty__name', 'subject__code', 'subject__name']
    ordering_fields = ['semester', 'academic_year']
    ordering = ['-academic_year', 'semester']

    def get_permissions(self):
        """
        Set permissions based on action.
        - create, update, partial_update, destroy: Admin only (CanAssignSubjects)
        - list, retrieve: Authenticated users
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanAssignSubjects()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Filter queryset based on user role.
        - ADMIN: All assignments
        - FACULTY: Only their own assignments
        - STUDENT: All active assignments (for viewing who teaches what)
        """
        user = self.request.user

        if user.role == 'ADMIN':
            return FacultySubjectAssignment.objects.all()

        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile
                return FacultySubjectAssignment.objects.filter(faculty=faculty)
            except Faculty.DoesNotExist:
                return FacultySubjectAssignment.objects.none()

        elif user.role == 'STUDENT':
            # Students can see all active assignments to know who teaches what
            return FacultySubjectAssignment.objects.filter(is_active=True)

        return FacultySubjectAssignment.objects.none()


# ============================================================================
# STUDENT RESULT VIEWSET
# ============================================================================

class StudentResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudentResult management with enhanced RBAC.
    - ADMIN: All results
    - FACULTY: Results from advised class + subjects they teach
    - STUDENT: Own results only
    """

    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer
    permission_classes = [IsAuthenticated, CanViewStudentResult]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'subject', 'semester', 'result_status', 'is_latest']
    search_fields = ['student__usn', 'student__name', 'subject__code', 'subject__name']
    ordering_fields = ['announced_date', 'total_marks']
    ordering = ['-announced_date']

    def get_queryset(self):
        """
        Filter queryset based on user role with enhanced RBAC.
        - ADMIN: All results
        - FACULTY: Results from advised class students + subjects they teach
        - STUDENT: Own results only
        """
        user = self.request.user

        if user.role == 'ADMIN':
            return StudentResult.objects.all()

        elif user.role == 'FACULTY':
            try:
                faculty = user.faculty_profile

                # Start with empty queryset
                results = StudentResult.objects.none()

                # Add results from advised class
                if faculty.class_advisor_section:
                    class_results = StudentResult.objects.filter(
                        student__section=faculty.class_advisor_section
                    )
                    results = results | class_results

                # Add results from subjects they teach
                subject_assignments = FacultySubjectAssignment.objects.filter(
                    faculty=faculty,
                    is_active=True
                ).values_list('subject_id', flat=True)

                if subject_assignments:
                    subject_results = StudentResult.objects.filter(
                        subject__id__in=subject_assignments
                    )
                    results = results | subject_results

                return results.distinct()

            except Faculty.DoesNotExist:
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

        Body:
        {
            "usn": "2AB22CS008",  // or "usn_list": ["2AB22CS008", "2AB22CS009"]
            "semester": 6,        // Required: Which semester to scrape
            "academic_year": "2024-25",  // Required: Academic year
            "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/index.php"  // Required: VTU portal URL
        }
        """
        serializer = ScrapeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usn = serializer.validated_data.get('usn')
        usn_list = serializer.validated_data.get('usn_list')

        # Get scraper configuration from request
        semester = request.data.get('semester')
        academic_year = request.data.get('academic_year')
        vtu_url = request.data.get('vtu_url')

        # Validate required configuration
        if not all([semester, academic_year, vtu_url]):
            return Response(
                {
                    'error': 'Missing required configuration',
                    'details': 'semester, academic_year, and vtu_url are required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if usn:
                # Single USN scrape
                result = scrape_single_usn(
                    usn,
                    request.user,
                    headless=True,
                    semester=semester,
                    academic_year=academic_year,
                    vtu_url=vtu_url
                )
                return Response(result, status=status.HTTP_200_OK)
            else:
                # Batch scrape
                result = scrape_batch_usns(
                    usn_list,
                    request.user,
                    headless=True,
                    delay_seconds=3,
                    semester=semester,
                    academic_year=academic_year,
                    vtu_url=vtu_url
                )
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
            # Faculty sees statistics based on their role
            try:
                faculty = user.faculty_profile
                department = faculty.department

                # If class advisor, show advised class statistics
                if faculty.class_advisor_section:
                    students = Student.objects.filter(
                        section=faculty.class_advisor_section,
                        is_active=True
                    )

                    stats = {
                        'role': 'Class Advisor',
                        'section': faculty.class_advisor_section,
                        'department': department.name,
                        'total_students': students.count(),
                        'total_subjects': Subject.objects.filter(department=department, is_active=True).count(),
                        'total_results': StudentResult.objects.filter(
                            student__section=faculty.class_advisor_section,
                            is_latest=True
                        ).count(),
                        'avg_cgpa': 0,
                        'total_backlogs': StudentResult.objects.filter(
                            student__section=faculty.class_advisor_section,
                            is_latest=True,
                            result_status='F'
                        ).count()
                    }

                    cgpa_sum = sum([student.calculate_cgpa() for student in students])
                    stats['avg_cgpa'] = float(cgpa_sum / students.count()) if students.count() > 0 else 0

                else:
                    # Otherwise, show department statistics
                    students = Student.objects.filter(department=department, is_active=True)

                    stats = {
                        'role': 'Subject Teacher',
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

            except Faculty.DoesNotExist:
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


# ============================================================================
# VTU SEMESTER URL VIEWSET
# ============================================================================

import logging
import datetime

logger = logging.getLogger(__name__)


class VTUSemesterURLViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing semester-wise VTU result URLs.

    Endpoints:
    - GET /api/vtu-semester-urls/ - List all semester URLs
    - POST /api/vtu-semester-urls/ - Create a new semester URL
    - GET /api/vtu-semester-urls/{id}/ - Get specific URL
    - PUT/PATCH /api/vtu-semester-urls/{id}/ - Update URL
    - DELETE /api/vtu-semester-urls/{id}/ - Delete URL
    - POST /api/vtu-semester-urls/bulk-update/ - Bulk update URLs
    - GET /api/vtu-semester-urls/get-for-student/?usn=XXX - Get URL for student
    """

    queryset = VTUSemesterURL.objects.all()
    serializer_class = VTUSemesterURLSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['semester', 'academic_year', 'is_active']
    search_fields = ['academic_year', 'url']
    ordering_fields = ['semester', 'academic_year', 'updated_at']
    ordering = ['-academic_year', '-semester']

    def get_permissions(self):
        """
        Allow read access for all authenticated users.
        Only admin can create, update, or delete.
        """
        if self.action in ['list', 'retrieve', 'get_for_student']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        """Set updated_by on creation."""
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        """Set updated_by on update."""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Bulk update URLs for multiple semesters in an academic year.

        POST /api/vtu-semester-urls/bulk-update/
        {
            "academic_year": "2024-25",
            "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
            "semesters": [2, 4, 6, 8]
        }
        """
        academic_year = request.data.get('academic_year')
        url = request.data.get('url')
        semesters = request.data.get('semesters', [])

        if not academic_year or not url:
            return Response(
                {'error': 'academic_year and url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not semesters:
            return Response(
                {'error': 'semesters list cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate semesters are in range 1-8
        if not all(1 <= sem <= 8 for sem in semesters):
            return Response(
                {'error': 'All semesters must be between 1 and 8'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        updated_count = 0
        results = []

        for semester in semesters:
            obj, created = VTUSemesterURL.objects.update_or_create(
                semester=semester,
                academic_year=academic_year,
                defaults={
                    'url': url,
                    'is_active': True,
                    'updated_by': request.user
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            results.append({
                'semester': semester,
                'academic_year': academic_year,
                'url': url,
                'action': 'created' if created else 'updated'
            })

        logger.info(
            f"Bulk URL update by {request.user.username}: "
            f"{created_count} created, {updated_count} updated for {academic_year}"
        )

        return Response({
            'message': 'URLs updated successfully',
            'created': created_count,
            'updated': updated_count,
            'results': results
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='get-for-student')
    def get_for_student(self, request):
        """
        Get the appropriate VTU URL for a student.

        GET /api/vtu-semester-urls/get-for-student/?usn=2AB22CS019
        """
        usn = request.query_params.get('usn')

        if not usn:
            return Response(
                {'error': 'usn parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student = Student.objects.get(usn=usn)
            semester = student.current_semester
            academic_year = get_current_academic_year(student)

            # Try to get semester-specific URL
            url_config = VTUSemesterURL.objects.filter(
                semester=semester,
                academic_year=academic_year,
                is_active=True
            ).first()

            if url_config:
                return Response({
                    'usn': usn,
                    'semester': semester,
                    'academic_year': academic_year,
                    'url': url_config.url,
                    'source': 'semester_specific'
                })

            # Fallback to most recent active URL
            fallback = VTUSemesterURL.objects.filter(is_active=True).first()
            if fallback:
                return Response({
                    'usn': usn,
                    'semester': semester,
                    'academic_year': academic_year,
                    'url': fallback.url,
                    'source': 'fallback',
                    'warning': 'No semester-specific URL found, using fallback'
                })

            return Response(
                {'error': 'No VTU URLs configured'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Student.DoesNotExist:
            return Response(
                {'error': f'Student {usn} not found'},
                status=status.HTTP_404_NOT_FOUND
            )


def get_current_academic_year(student):
    """
    Calculate current academic year based on student's admission year and semester.

    Example:
    - 2022 admission + Sem 6 = 2024-25 academic year
    - 2023 admission + Sem 4 = 2024-25 academic year
    - 2024 admission + Sem 2 = 2024-25 academic year
    """
    # Years since admission (0-indexed)
    years_since_admission = (student.current_semester - 1) // 2

    # Calculate which academic year they're in
    current_date = datetime.date.today()

    if current_date.month >= 6:  # June onwards = new academic year
        start_year = student.admission_year + years_since_admission
    else:  # Jan-May = second half of academic year
        start_year = student.admission_year + years_since_admission

    end_year = start_year + 1
    return f"{start_year}-{str(end_year)[2:]}"


# ============================================================================
# NOTIFICATION VIEWSET
# ============================================================================

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notifications with RBAC.
    - Admin: Can create, update, delete, and deactivate notifications
    - Faculty: Can only create notifications (cannot edit/delete/deactivate)
    - Students: Can only view notifications relevant to them
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['priority', 'is_active', 'target_department', 'target_semester']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'expires_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter notifications based on user role.
        - Admin/Faculty: See all notifications
        - Students: See only visible notifications relevant to them (their department/semester)
        """
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == 'ADMIN' or user.role == 'FACULTY':
            # Admin and Faculty can see all notifications
            return queryset

        elif user.role == 'STUDENT':
            try:
                student = user.student_profile
                # Students see notifications that are:
                # 1. Active and not expired
                # 2. Either general (no target) or targeted to their department/semester
                queryset = queryset.filter(is_active=True)

                # Filter by expiration
                now = timezone.now()
                queryset = queryset.filter(
                    Q(expires_at__isnull=True) | Q(expires_at__gt=now)
                )

                # Filter by department and semester
                queryset = queryset.filter(
                    Q(target_department__isnull=True) | Q(target_department=student.department)
                ).filter(
                    Q(target_semester__isnull=True) | Q(target_semester=student.current_semester)
                )

                return queryset
            except Exception as e:
                return Notification.objects.none()

        return Notification.objects.none()

    def get_permissions(self):
        """
        Define permissions for different actions.
        - List/Retrieve: All authenticated users
        - Create: Admin and Faculty
        - Update/Delete: Admin only
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action == 'create':
            return [IsAuthenticated(), IsAdminOrFaculty()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)


# ============================================================================
# PERFORMANCE ANALYSIS ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrFaculty])
def comprehensive_performance_analysis(request):
    """
    Get comprehensive student performance analysis with advanced analytics.

    Query Parameters:
    - department_code: Department code (e.g., 'CS')
    - batch: Student batch (e.g., '2022')
    - semester: Semester number (1-8, optional)
    - subject_code: Specific subject code (optional)

    Returns detailed analytics including:
    - Overall statistics
    - Subject-wise performance
    - Student rankings
    - Grade distributions
    - Trend analysis
    - Pass/fail rates
    """
    from .analytics_service import ResultAnalytics
    from django.db.models import Count, Avg, Q

    department_code = request.query_params.get('department_code')
    batch = request.query_params.get('batch')
    semester = request.query_params.get('semester')
    subject_code = request.query_params.get('subject_code')

    if not department_code or not batch:
        return Response(
            {'error': 'department_code and batch are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        department = Department.objects.get(code=department_code)
    except Department.DoesNotExist:
        return Response(
            {'error': 'Department not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get all students in this batch and department
    students = Student.objects.filter(
        department=department,
        batch=batch,
        is_active=True
    )

    total_students = students.count()

    if total_students == 0:
        return Response(
            {'error': 'No students found for this criteria'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Build response data
    response_data = {
        'department_code': department_code,
        'department_name': department.name,
        'batch': batch,
        'total_students': total_students,
        'analysis_date': timezone.now().date(),
    }

    # If specific subject requested
    if subject_code and semester:
        semester_int = int(semester)
        subject_analytics = ResultAnalytics.get_subject_analytics(
            department_code=department_code,
            semester=semester_int,
            subject_code=subject_code,
            batch=batch
        )
        response_data['subject_analysis'] = subject_analytics
        response_data['analysis_type'] = 'subject'

    # If semester specified (but no specific subject)
    elif semester:
        semester_int = int(semester)
        batch_analytics = ResultAnalytics.get_batch_semester_analytics(
            batch=batch,
            semester=semester_int,
            department_code=department_code
        )
        response_data['semester_analysis'] = batch_analytics
        response_data['analysis_type'] = 'semester'

    # Overall batch performance across all semesters
    else:
        # Get semester-wise overview
        semester_performance = []

        for sem in range(1, 9):
            results = StudentResult.objects.filter(
                student__in=students,
                semester=sem,
                is_latest=True
            )

            if results.exists():
                total = results.count()
                passed = results.filter(result_status='P').count()
                failed = results.filter(result_status='F').count()
                absent = results.filter(result_status='A').count()
                appeared = total - absent

                pass_rate = (passed / appeared * 100) if appeared > 0 else 0

                # Calculate average SGPA
                sgpa_list = []
                for student in students:
                    sgpa = student.calculate_sgpa(sem)
                    if sgpa > 0:
                        sgpa_list.append(float(sgpa))

                avg_sgpa = sum(sgpa_list) / len(sgpa_list) if sgpa_list else 0

                semester_performance.append({
                    'semester': sem,
                    'total_results': total,
                    'appeared': appeared,
                    'passed': passed,
                    'failed': failed,
                    'absent': absent,
                    'pass_rate': round(pass_rate, 2),
                    'average_sgpa': round(avg_sgpa, 2),
                    'students_with_sgpa': len(sgpa_list)
                })

        # Overall CGPA statistics
        cgpa_list = []
        students_with_backlogs = 0
        backlog_distribution = {}

        for student in students:
            cgpa = student.calculate_cgpa()
            if cgpa > 0:
                cgpa_list.append({
                    'usn': student.usn,
                    'name': student.name,
                    'cgpa': float(cgpa)
                })

            # Count backlogs
            backlog_count = student.get_total_backlogs_count()
            if backlog_count > 0:
                students_with_backlogs += 1
                backlog_distribution[backlog_count] = backlog_distribution.get(backlog_count, 0) + 1

        # Sort by CGPA
        cgpa_list.sort(key=lambda x: x['cgpa'], reverse=True)

        # Calculate statistics
        avg_cgpa = sum(s['cgpa'] for s in cgpa_list) / len(cgpa_list) if cgpa_list else 0
        highest_cgpa = cgpa_list[0]['cgpa'] if cgpa_list else 0
        lowest_cgpa = cgpa_list[-1]['cgpa'] if cgpa_list else 0

        # CGPA distribution
        cgpa_ranges = {
            '9.0-10.0': 0,
            '8.0-8.9': 0,
            '7.0-7.9': 0,
            '6.0-6.9': 0,
            '5.0-5.9': 0,
            'Below 5.0': 0
        }

        for student in cgpa_list:
            cgpa_val = student['cgpa']
            if cgpa_val >= 9.0:
                cgpa_ranges['9.0-10.0'] += 1
            elif cgpa_val >= 8.0:
                cgpa_ranges['8.0-8.9'] += 1
            elif cgpa_val >= 7.0:
                cgpa_ranges['7.0-7.9'] += 1
            elif cgpa_val >= 6.0:
                cgpa_ranges['6.0-6.9'] += 1
            elif cgpa_val >= 5.0:
                cgpa_ranges['5.0-5.9'] += 1
            else:
                cgpa_ranges['Below 5.0'] += 1

        response_data.update({
            'analysis_type': 'batch_overall',
            'semester_wise_performance': semester_performance,
            'cgpa_statistics': {
                'average_cgpa': round(avg_cgpa, 2),
                'highest_cgpa': round(highest_cgpa, 2),
                'lowest_cgpa': round(lowest_cgpa, 2),
                'total_students_with_cgpa': len(cgpa_list),
                'cgpa_distribution': cgpa_ranges,
                'top_10_students': cgpa_list[:10],
                'bottom_10_students': cgpa_list[-10:] if len(cgpa_list) >= 10 else cgpa_list
            },
            'backlog_statistics': {
                'students_with_backlogs': students_with_backlogs,
                'students_without_backlogs': total_students - students_with_backlogs,
                'backlog_distribution': backlog_distribution,
                'percentage_with_backlogs': round((students_with_backlogs / total_students * 100), 2) if total_students > 0 else 0
            }
        })

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrFaculty])
def student_performance_report(request):
    """
    Get individual student performance report.

    Query Parameters:
    - usn: Student USN

    Returns:
    - Complete academic record
    - Semester-wise SGPA
    - Overall CGPA
    - Subject-wise performance
    - Backlogs if any
    - Performance trends
    """
    usn = request.query_params.get('usn')

    if not usn:
        return Response(
            {'error': 'usn is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        student = Student.objects.get(usn=usn)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Basic info
    response_data = {
        'usn': student.usn,
        'name': student.name,
        'department': student.department.code,
        'department_name': student.department.name,
        'batch': student.batch,
        'current_semester': student.current_semester,
        'email': student.email,
    }

    # Calculate CGPA
    cgpa = student.calculate_cgpa()
    response_data['cgpa'] = float(cgpa)

    # Semester-wise performance
    semester_data = []
    for sem in range(1, student.current_semester + 1):
        results = student.results.filter(semester=sem, is_latest=True)

        if results.exists():
            sgpa = student.calculate_sgpa(sem)

            # Subject details
            subjects = []
            for result in results:
                subjects.append({
                    'subject_code': result.subject.code,
                    'subject_name': result.subject.name,
                    'credits': float(result.subject.credits),
                    'internal_marks': result.internal_marks,
                    'external_marks': result.external_marks,
                    'total_marks': result.total_marks,
                    'grade': result.grade,
                    'grade_point': float(result.grade_point),
                    'result_status': result.result_status
                })

            total_credits = sum(float(r.subject.credits) for r in results if r.subject.subject_type not in ['NON_CREDIT', 'AUDIT'])

            semester_data.append({
                'semester': sem,
                'sgpa': float(sgpa),
                'total_subjects': results.count(),
                'total_credits': total_credits,
                'passed': results.filter(result_status='P').count(),
                'failed': results.filter(result_status='F').count(),
                'subjects': subjects
            })

    response_data['semester_wise_performance'] = semester_data

    # Backlogs
    backlogs = student.get_backlogs()
    backlog_list = []
    for backlog in backlogs:
        backlog_list.append({
            'subject_code': backlog.subject.code,
            'subject_name': backlog.subject.name,
            'semester': backlog.semester,
            'internal_marks': backlog.internal_marks,
            'external_marks': backlog.external_marks,
            'total_marks': backlog.total_marks,
            'attempt_number': backlog.attempt_number
        })

    response_data['backlogs'] = {
        'total_backlogs': len(backlog_list),
        'backlog_details': backlog_list
    }

    return Response(response_data, status=status.HTTP_200_OK)
