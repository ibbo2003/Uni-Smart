"""
UniSmart Result Analysis Module - Database Models

This module contains all database models for the VTU Result Analysis System.
Includes 12 models with UUID primary keys, proper indexing, and business logic.
"""

import uuid
from decimal import Decimal
from datetime import date
from typing import Optional, List

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
import re


# ============================================================================
# EMAIL VALIDATORS
# ============================================================================

def validate_student_email(email):
    """
    Validate student email format: 2ab______@anjuman.edu.in
    Format: 2ab + year(2 digits) + branch(2 letters) + roll(3 digits) @anjuman.edu.in
    Example: 2ab22cs001@anjuman.edu.in
    """
    pattern = r'^2ab\d{2}[a-z]{2}\d{3}@anjuman\.edu\.in$'
    if not re.match(pattern, email.lower()):
        raise ValidationError(
            'Student email must be in format: 2abYYBBRRR@anjuman.edu.in '
            '(YY=year, BB=branch, RRR=roll number). Example: 2ab22cs001@anjuman.edu.in'
        )

def validate_faculty_email(email):
    """
    Validate faculty email format: ______@anjuman.edu.in
    Faculty can have any username before @anjuman.edu.in
    """
    pattern = r'^[a-z0-9._-]+@anjuman\.edu\.in$'
    if not re.match(pattern, email.lower()):
        raise ValidationError(
            'Faculty email must be in format: username@anjuman.edu.in'
        )


# ============================================================================
# 1. USER MODEL (Custom User extending AbstractUser)
# ============================================================================

class User(AbstractUser):
    """
    Custom User model with role-based access control.
    Extends Django's AbstractUser to add role, phone, and profile picture.
    """

    ROLE_CHOICES = (
        ('ADMIN', 'Administrator'),
        ('FACULTY', 'Faculty'),
        ('STUDENT', 'Student'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    phone = models.CharField(max_length=15, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    is_active_user = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['role', 'is_active_user']),
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.role})"

    def save(self, *args, **kwargs):
        """Override save to set username from email if not provided."""
        if not self.username and self.email:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)


# ============================================================================
# 2. DEPARTMENT MODEL
# ============================================================================

class Department(models.Model):
    """
    Represents academic departments (CS, EC, ME, etc.).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=10, unique=True, help_text="Department code (e.g., CS, EC, ME)")
    name = models.CharField(max_length=100, help_text="Full department name")
    description = models.TextField(blank=True, help_text="Department description")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]
        ordering = ['code']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_student_count(self):
        """Return total number of active students in this department."""
        return self.students.filter(is_active=True).count()

    def get_faculty_count(self):
        """Return total number of active faculty in this department."""
        return self.faculty_members.filter(is_active=True).count()


# ============================================================================
# 3. SUBJECT MODEL
# ============================================================================

class Subject(models.Model):
    """
    Represents academic subjects/courses offered by VTU.
    Updated for VTU CBCS 2015-16 regulations.
    """

    SUBJECT_TYPE_CHOICES = (
        ('THEORY', 'Theory'),
        ('LAB', 'Laboratory'),
        ('PROJECT', 'Project'),
        ('INTERNSHIP', 'Internship'),
        ('SEMINAR', 'Seminar'),
        ('NON_CREDIT', 'Non-Credit Mandatory Course'),
        ('AUDIT', 'Audit Course'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, help_text="VTU subject code")
    name = models.CharField(max_length=200, help_text="Full subject name")
    short_name = models.CharField(max_length=50, help_text="Abbreviated name")
    subject_type = models.CharField(max_length=15, choices=SUBJECT_TYPE_CHOICES, default='THEORY')
    credits = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Credit points (0-10)"
    )
    # Maximum marks distribution (VTU CBCS 2015-16: typically 20 CIE + 80 SEE = 100)
    max_internal_marks = models.IntegerField(
        default=20,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Maximum CIE marks"
    )
    max_external_marks = models.IntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(200)],
        help_text="Maximum SEE marks"
    )
    max_total_marks = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(300)],
        help_text="Maximum total marks (CIE + SEE)"
    )
    # Minimum passing marks (VTU CBCS 2015-16: 35% CIE, 35% SEE, 40% Total)
    min_internal_marks = models.IntegerField(
        default=7,
        validators=[MinValueValidator(0)],
        help_text="Minimum CIE marks to pass (35% of max_internal)"
    )
    min_external_marks = models.IntegerField(
        default=28,
        validators=[MinValueValidator(0)],
        help_text="Minimum SEE marks to pass (35% of max_external)"
    )
    min_total_marks = models.IntegerField(
        default=40,
        validators=[MinValueValidator(0)],
        help_text="Minimum total marks to pass (40% of max_total)"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subjects'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'results_subjects'
        indexes = [
            models.Index(fields=['code', 'is_active']),
            models.Index(fields=['department', 'is_active']),
        ]
        ordering = ['code']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return f"{self.code} - {self.short_name}"

    def clean(self):
        """
        Validate subject marks configuration based on type.
        """
        # Non-Credit Mandatory Course validation
        if self.subject_type == 'NON_CREDIT':
            if self.credits != 0:
                raise ValidationError({
                    'credits': 'Non-Credit Mandatory Courses must have 0 credits'
                })
            if self.max_internal_marks != 100:
                raise ValidationError({
                    'max_internal_marks': 'Non-Credit Mandatory Courses must have 100 internal marks'
                })
            if self.max_external_marks != 0:
                raise ValidationError({
                    'max_external_marks': 'Non-Credit Mandatory Courses must have 0 external marks'
                })

        # Audit Course validation
        if self.subject_type == 'AUDIT':
            if self.credits <= 0:
                raise ValidationError({
                    'credits': 'Audit Courses must have credits (typically 1)'
                })
            if self.max_internal_marks != 100:
                raise ValidationError({
                    'max_internal_marks': 'Audit Courses must have 100 internal marks'
                })
            if self.max_external_marks != 0:
                raise ValidationError({
                    'max_external_marks': 'Audit Courses must have 0 external marks'
                })

        super().clean()

    def save(self, *args, **kwargs):
        """Auto-configure marks for Non-Credit Mandatory and Audit Courses."""
        if self.subject_type == 'NON_CREDIT':
            self.credits = 0
            self.max_internal_marks = 100
            self.max_external_marks = 0
            self.max_total_marks = 100
            self.min_internal_marks = 35
            self.min_external_marks = 0
            self.min_total_marks = 35

        if self.subject_type == 'AUDIT':
            if not self.credits:
                self.credits = 1  # Default to 1 credit
            self.max_internal_marks = 100
            self.max_external_marks = 0
            self.max_total_marks = 100
            self.min_internal_marks = 35
            self.min_external_marks = 0
            self.min_total_marks = 35

        super().save(*args, **kwargs)

    def get_total_marks(self):
        """Return sum of internal and external maximum marks."""
        return self.max_internal_marks + self.max_external_marks


# ============================================================================
# 4. SEMESTER SUBJECT (Junction Table)
# ============================================================================

class SemesterSubject(models.Model):
    """
    Maps subjects to specific semesters, departments, and academic years.
    Junction table for many-to-many relationship with additional fields.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='semester_mappings')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='semester_subjects')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    academic_year = models.CharField(max_length=20, help_text="e.g., 2024-2025")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results_semester_subjects'
        unique_together = [['subject', 'department', 'semester', 'academic_year']]
        indexes = [
            models.Index(fields=['department', 'semester', 'academic_year']),
        ]
        ordering = ['semester', 'subject__code']
        verbose_name = 'Semester Subject Mapping'
        verbose_name_plural = 'Semester Subject Mappings'

    def __str__(self):
        return f"{self.subject.code} - Sem {self.semester} ({self.academic_year})"


# ============================================================================
# 5. STUDENT MODEL
# ============================================================================

class Student(models.Model):
    """
    Represents student profile with academic information.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    usn = models.CharField(max_length=20, unique=True, help_text="University Seat Number")
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='students')
    current_semester = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )
    batch = models.CharField(max_length=10, help_text="Admission year batch (e.g., 2022)")
    admission_year = models.IntegerField()

    # Section field - links to section in timetable service
    section = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Section ID (from timetable service sections table)"
    )

    date_of_birth = models.DateField(null=True, blank=True)
    email = models.EmailField(unique=True, validators=[validate_student_email])
    phone = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'results_students'
        indexes = [
            models.Index(fields=['usn']),
            models.Index(fields=['department', 'current_semester']),
            models.Index(fields=['batch', 'is_active']),
        ]
        ordering = ['usn']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

    def __str__(self):
        return f"{self.usn} - {self.name}"

    def calculate_cgpa(self) -> Decimal:
        """
        Calculate overall CGPA across all semesters using VTU formula.

        Formula:
        CGPA = Sum of (Grade Point × Credit) for all passed subjects / Total Credits

        Only includes passed subjects (result_status='P') with latest attempts.
        Excludes Non-Credit Mandatory and Audit Courses per VTU rules.

        Returns:
            CGPA rounded to 2 decimal places
        """
        results = self.results.filter(is_latest=True, result_status='P')

        if not results.exists():
            return Decimal('0.00')

        total_grade_points = Decimal('0.00')
        total_credits = Decimal('0.00')

        for result in results:
            # Skip Non-Credit Mandatory and Audit Courses
            if result.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
                continue

            if result.subject.credits:
                # Subject Grade Point = Grade Point × Credit
                total_grade_points += result.grade_point * result.subject.credits
                total_credits += result.subject.credits

        if total_credits == 0:
            return Decimal('0.00')

        # CGPA = Sum of all Subject Grade Points / Total Credits
        cgpa = total_grade_points / total_credits
        return round(cgpa, 2)

    def calculate_sgpa(self, semester: int) -> Decimal:
        """
        Calculate SGPA for a specific semester using VTU formula.

        Formula:
        SGPA = Sum of (Grade Point × Credit) / Sum of Credits

        Only includes passed subjects (result_status='P').
        Excludes Non-Credit Mandatory and Audit Courses per VTU rules.

        Args:
            semester: Semester number (1-8)

        Returns:
            SGPA rounded to 2 decimal places
        """
        results = self.results.filter(
            semester=semester,
            is_latest=True,
            result_status='P'
        )

        if not results.exists():
            return Decimal('0.00')

        total_grade_points = Decimal('0.00')
        total_credits = Decimal('0.00')

        for result in results:
            # Skip Non-Credit Mandatory and Audit Courses
            if result.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
                continue

            if result.subject.credits:
                # Subject Grade Point = Grade Point × Credit
                total_grade_points += result.grade_point * result.subject.credits
                total_credits += result.subject.credits

        if total_credits == 0:
            return Decimal('0.00')

        # SGPA = Sum of Subject Grade Points / Sum of Credits
        sgpa = total_grade_points / total_credits
        return round(sgpa, 2)

    def get_backlogs(self):
        """
        Get all failed subjects (backlogs) that haven't been cleared.
        Returns: QuerySet of StudentResult objects with status 'F'
        """
        return self.results.filter(is_latest=True, result_status='F')

    def get_total_backlogs_count(self) -> int:
        """Return total number of current backlogs."""
        return self.get_backlogs().count()


# ============================================================================
# 6. FACULTY MODEL
# ============================================================================

class Faculty(models.Model):
    """
    Represents faculty/teacher profile.
    Faculty can have two roles:
    1. Class Advisor - responsible for a specific section
    2. Subject Teacher - teaches specific subjects (via FacultySubjectAssignment)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='faculty_members')
    designation = models.CharField(max_length=100, help_text="e.g., Professor, Assistant Professor")
    email = models.EmailField(unique=True, validators=[validate_faculty_email])
    phone = models.CharField(max_length=15, blank=True)

    # Class Advisor field - links to section in timetable service
    class_advisor_section = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Section ID this faculty advises (from timetable service sections table)"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'results_faculty'
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['department', 'is_active']),
        ]
        ordering = ['name']
        verbose_name = 'Faculty'
        verbose_name_plural = 'Faculty'

    def __str__(self):
        return f"{self.employee_id} - {self.name}"

    @staticmethod
    def generate_next_faculty_id(department_code):
        """
        Generate next sequential faculty ID for a department.
        Format: DEPT-F-XXX (e.g., CS-F-001, CS-F-002)

        IDs are permanent once assigned and are NOT reassigned when new faculty joins.
        New faculty simply gets the next available sequential number.

        Args:
            department_code: Department code (e.g., 'CS', 'EC', 'ME')

        Returns:
            str: Next faculty ID in format DEPT-F-XXX

        Example:
            >>> Faculty.generate_next_faculty_id('CS')
            'CS-F-001'  # If no faculty exists
            >>> Faculty.generate_next_faculty_id('CS')
            'CS-F-003'  # If CS-F-002 was the last ID
        """
        # Find the last faculty ID in this department
        last_faculty = Faculty.objects.filter(
            employee_id__startswith=f"{department_code}-F-"
        ).order_by('-employee_id').first()

        if last_faculty:
            # Extract number from "CS-F-005" → 5
            try:
                last_number = int(last_faculty.employee_id.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                # Fallback if ID format is unexpected
                new_number = 1
        else:
            # First faculty in department
            new_number = 1

        return f"{department_code}-F-{new_number:03d}"


# ============================================================================
# 7. FACULTY SUBJECT ASSIGNMENT
# ============================================================================

class FacultySubjectAssignment(models.Model):
    """
    Maps faculty to subjects they teach in specific semesters.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='faculty_assignments')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    academic_year = models.CharField(max_length=20)
    section = models.CharField(max_length=5, help_text="e.g., A, B, C")
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results_faculty_subject_assignments'
        unique_together = [['faculty', 'subject', 'semester', 'academic_year', 'section']]
        indexes = [
            models.Index(fields=['faculty', 'academic_year']),
            models.Index(fields=['subject', 'semester']),
        ]
        ordering = ['-academic_year', 'semester']
        verbose_name = 'Faculty Subject Assignment'
        verbose_name_plural = 'Faculty Subject Assignments'

    def __str__(self):
        return f"{self.faculty.name} - {self.subject.code} (Sem {self.semester})"


# ============================================================================
# 8. EXAM SCHEDULE
# ============================================================================

class ExamSchedule(models.Model):
    """
    Represents exam schedules (Regular, Supplementary, Revaluation).
    """

    EXAM_TYPE_CHOICES = (
        ('REGULAR', 'Regular'),
        ('SUPPLEMENTARY', 'Supplementary'),
        ('REVALUATION', 'Revaluation'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_name = models.CharField(max_length=100, help_text="e.g., June/July 2025")
    exam_type = models.CharField(max_length=15, choices=EXAM_TYPE_CHOICES, default='REGULAR')
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    academic_year = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    result_declared_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results_exam_schedules'
        indexes = [
            models.Index(fields=['semester', 'academic_year']),
            models.Index(fields=['-start_date']),
        ]
        ordering = ['-start_date']
        verbose_name = 'Exam Schedule'
        verbose_name_plural = 'Exam Schedules'

    def __str__(self):
        return f"{self.exam_name} - {self.exam_type}"

    def clean(self):
        """Validate that end_date is after start_date."""
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date must be after start date.")


# ============================================================================
# 9. STUDENT RESULT (MOST IMPORTANT MODEL)
# ============================================================================

class StudentResult(models.Model):
    """
    Stores individual student results for each subject.
    Includes automatic grade calculation and backlog tracking.
    """

    RESULT_STATUS_CHOICES = (
        ('P', 'Pass'),
        ('F', 'Fail'),
        ('A', 'Absent'),
        ('W', 'Withheld'),
        ('X', 'Not Eligible'),
    )

    # VTU CBCS 2015-16 Grading Scale
    GRADE_CHOICES = (
        ('O', 'O - Outstanding (90-100%)'),
        ('S', 'S - Excellent (80-89%)'),
        ('A', 'A - Very Good (70-79%)'),
        ('B', 'B - Good (60-69%)'),
        ('C', 'C - Above Average (50-59%)'),
        ('D', 'D - Average (45-49%)'),
        ('E', 'E - Poor (Pass) (40-44%)'),
        ('F', 'F - Fail (<40%)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='results')
    exam_schedule = models.ForeignKey(
        ExamSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results'
    )
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    internal_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="CIE marks"
    )
    external_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="SEE marks"
    )
    total_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Auto-calculated total"
    )
    result_status = models.CharField(max_length=2, choices=RESULT_STATUS_CHOICES, default='P')
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES, blank=True)
    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        default=Decimal('0.00'),
        help_text="Grade point (0-10) for SGPA/CGPA calculation"
    )
    is_latest = models.BooleanField(
        default=True,
        help_text="Indicates if this is the latest attempt"
    )
    attempt_number = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    announced_date = models.DateField(null=True, blank=True)
    scraped_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'results_student_results'
        unique_together = [['student', 'subject', 'semester', 'attempt_number']]
        indexes = [
            models.Index(fields=['student', 'semester', 'is_latest']),
            models.Index(fields=['subject', 'result_status']),
            models.Index(fields=['student', 'is_latest']),
            models.Index(fields=['announced_date']),
        ]
        ordering = ['-announced_date', 'subject__code']
        verbose_name = 'Student Result'
        verbose_name_plural = 'Student Results'

    def __str__(self):
        return f"{self.student.usn} - {self.subject.code} (Attempt {self.attempt_number})"

    def save(self, *args, **kwargs):
        """
        Auto-calculate total marks, result status, grade, and grade point.
        Uses VTU CBCS 2015-16 pass/fail criteria.

        Note: If preserve_result_status=True in kwargs, the existing result_status
        from VTU portal will be preserved (used by scraper).
        """
        preserve_result_status = kwargs.pop('preserve_result_status', False)

        # Calculate total marks
        self.total_marks = self.internal_marks + self.external_marks

        # Get maximum marks
        max_internal = self.subject.max_internal_marks
        max_external = self.subject.max_external_marks
        max_total = max_internal + max_external

        # Pass/Fail Logic - Only calculate if not preserving VTU's result
        if not preserve_result_status:
            if self.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
                # Non-Credit Mandatory & Audit: Pass if >= 35 marks
                if self.total_marks >= 35:
                    self.result_status = 'P'
                else:
                    self.result_status = 'F'
            else:
                # Regular subjects: All three conditions must be met
                min_internal = max_internal * 0.35
                min_external = max_external * 0.35
                min_total = max_total * 0.40

                passes_internal = (max_internal == 0) or (self.internal_marks >= min_internal)
                passes_external = (max_external == 0) or (self.external_marks >= min_external)
                passes_total = self.total_marks >= min_total

                if passes_internal and passes_external and passes_total:
                    self.result_status = 'P'  # Pass
                else:
                    self.result_status = 'F'  # Fail

        # Calculate grade
        self.grade = self.calculate_grade()

        # Calculate grade point
        self.grade_point = self.get_grade_point()

        # Mark previous attempts as not latest if this is the latest
        if self.is_latest:
            StudentResult.objects.filter(
                student=self.student,
                subject=self.subject,
                semester=self.semester
            ).exclude(id=self.id).update(is_latest=False)

        super().save(*args, **kwargs)

    def calculate_grade(self) -> str:
        """
        Calculate letter grade based on VTU CBCS 2015-16 grading system.

        Pass Criteria:
        - Regular subjects: Internal >= 35%, External >= 35%, Total >= 40%
        - Non-Credit Mandatory: Total >= 35% (only internal marks)

        Returns:
            Grade letter (O, S, A, B, C, D, E, F)
        """
        # Get subject's maximum marks
        max_internal = self.subject.max_internal_marks
        max_external = self.subject.max_external_marks
        max_total = max_internal + max_external

        # Special handling for Non-Credit Mandatory & Audit Courses
        if self.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
            # Both types: Pass if >= 35% of 100 marks
            min_passing = 35
            if self.total_marks < min_passing:
                return 'F'

            # Calculate percentage for grading (already out of 100)
            percentage = self.total_marks

            # Grade based on percentage
            if percentage >= 90:
                return 'O'
            elif percentage >= 80:
                return 'S'
            elif percentage >= 70:
                return 'A'
            elif percentage >= 60:
                return 'B'
            elif percentage >= 50:
                return 'C'
            elif percentage >= 45:
                return 'D'
            elif percentage >= 35:
                return 'E'
            else:
                return 'F'

        # Regular subjects: Calculate minimum passing marks
        min_internal_required = max_internal * 0.35  # 35% of max internal
        min_external_required = max_external * 0.35  # 35% of max external
        min_total_required = max_total * 0.40  # 40% of max total

        # Check if passes all three conditions
        passes_internal = (max_internal == 0) or (self.internal_marks >= min_internal_required)
        passes_external = (max_external == 0) or (self.external_marks >= min_external_required)
        passes_total = self.total_marks >= min_total_required

        # If ANY condition fails, grade is F
        if not (passes_internal and passes_external and passes_total):
            return 'F'

        # Calculate percentage for grading
        if max_total == 0:
            return 'F'

        percentage = (Decimal(self.total_marks) / Decimal(max_total)) * 100

        # VTU CBCS 2015-16 Grading Scale
        if percentage >= 90:
            return 'O'   # Outstanding (90-100%)
        elif percentage >= 80:
            return 'S'   # Excellent (80-89%)
        elif percentage >= 70:
            return 'A'   # Very Good (70-79%)
        elif percentage >= 60:
            return 'B'   # Good (60-69%)
        elif percentage >= 50:
            return 'C'   # Above Average (50-59%)
        elif percentage >= 45:
            return 'D'   # Average (45-49%)
        elif percentage >= 40:
            return 'E'   # Poor but Pass (40-44%)
        else:
            return 'F'   # Fail (<40%)

    def get_grade_point(self) -> Decimal:
        """
        Get grade point for SGPA/CGPA calculation.
        Based on VTU CBCS 2015-16 grading system.

        Returns:
            Grade point (0-10)
        """
        grade_map = {
            'O': Decimal('10.00'),   # Outstanding
            'S': Decimal('9.00'),    # Excellent
            'A': Decimal('8.00'),    # Very Good
            'B': Decimal('7.00'),    # Good
            'C': Decimal('6.00'),    # Above Average
            'D': Decimal('5.00'),    # Average
            'E': Decimal('4.00'),    # Poor (Pass)
            'F': Decimal('0.00'),    # Fail
        }
        return grade_map.get(self.grade, Decimal('0.00'))

    def get_percentage(self) -> Decimal:
        """
        Calculate percentage based on total marks and subject max marks.
        Returns: Decimal percentage
        """
        max_marks = self.subject.get_total_marks()
        if max_marks == 0:
            return Decimal('0.00')

        percentage = (Decimal(self.total_marks) / Decimal(max_marks)) * 100
        return round(percentage, 2)


# ============================================================================
# 10. RESULT ANALYTICS (REMOVED - Now using analytics_service.py for real-time analytics)
# ============================================================================

# NOTE: ResultAnalytics model has been removed in favor of real-time analytics
# calculated via the analytics_service.py module. This eliminates manual data entry
# and ensures analytics are always up-to-date with actual student results.

# class ResultAnalytics(models.Model):
#     """
#     Pre-computed analytics for departments, semesters, and subjects.
#     Used for performance dashboards and reports.
#     """
#
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='analytics')
#     semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
#     subject = models.ForeignKey(
#         Subject,
#         on_delete=models.CASCADE,
#         null=True,
#         blank=True,
#         related_name='analytics'
#     )
#     academic_year = models.CharField(max_length=20)
#     total_students = models.IntegerField(default=0)
#     students_passed = models.IntegerField(default=0)
#     students_failed = models.IntegerField(default=0)
#     students_absent = models.IntegerField(default=0)
#     pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
#     avg_marks = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
#     highest_marks = models.IntegerField(default=0)
#     lowest_marks = models.IntegerField(default=0)
#     median_marks = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
#     avg_cgpa = models.DecimalField(
#         max_digits=4,
#         decimal_places=2,
#         default=Decimal('0.00'),
#         null=True,
#         blank=True
#     )
#     last_updated = models.DateTimeField(auto_now=True)
#
#     class Meta:
#         db_table = 'result_analytics'
#         unique_together = [['department', 'semester', 'subject', 'academic_year']]
#         indexes = [
#             models.Index(fields=['department', 'semester', 'academic_year']),
#             models.Index(fields=['subject', 'academic_year']),
#         ]
#         ordering = ['-academic_year', 'semester']
#         verbose_name = 'Result Analytics'
#         verbose_name_plural = 'Result Analytics'
#
#     def __str__(self):
#         subject_str = f" - {self.subject.code}" if self.subject else ""
#         return f"{self.department.code} - Sem {self.semester}{subject_str} ({self.academic_year})"


# ============================================================================
# 11. SCRAPE LOG
# ============================================================================

class ScrapeLog(models.Model):
    """
    Logs all scraping operations for audit and debugging.
    """

    STATUS_CHOICES = (
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('PARTIAL', 'Partial Success'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    initiated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scrape_logs'
    )
    usn = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    records_created = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    captcha_attempts = models.IntegerField(default=0)
    execution_time = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Execution time in seconds"
    )
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results_scrape_logs'
        indexes = [
            models.Index(fields=['usn', '-scraped_at']),
            models.Index(fields=['status', '-scraped_at']),
        ]
        ordering = ['-scraped_at']
        verbose_name = 'Scrape Log'
        verbose_name_plural = 'Scrape Logs'

    def __str__(self):
        return f"{self.usn} - {self.status} ({self.scraped_at.strftime('%Y-%m-%d %H:%M')})"


# ============================================================================
# 12. AUDIT LOG
# ============================================================================

class AuditLog(models.Model):
    """
    Comprehensive audit trail for all system operations.
    """

    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('SCRAPE', 'Scrape'),
        ('EXPORT', 'Export'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, help_text="Name of the model affected")
    object_id = models.CharField(max_length=100, help_text="ID of the object affected")
    description = models.TextField(help_text="Detailed description of the action")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        user_str = self.user.username if self.user else "System"
        return f"{user_str} - {self.action} on {self.model_name} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"


# ============================================================================
# 13. SYSTEM SETTINGS MODEL
# ============================================================================

class SystemSettings(models.Model):
    """
    System-wide settings and configurations.
    Used for managing dynamic values like VTU portal links.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(
        max_length=100,
        unique=True,
        help_text='Setting key (e.g., VTU_RESULTS_URL)'
    )
    value = models.TextField(
        help_text='Setting value'
    )
    description = models.TextField(
        blank=True,
        help_text='Description of this setting'
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settings_updates'
    )

    class Meta:
        db_table = 'results_system_settings'
        indexes = [
            models.Index(fields=['key']),
        ]
        ordering = ['key']
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return f"{self.key}: {self.value[:50]}"

    @classmethod
    def get_setting(cls, key: str, default: str = None) -> str:
        """
        Get a setting value by key.

        Args:
            key: Setting key
            default: Default value if setting doesn't exist

        Returns:
            Setting value or default
        """
        try:
            setting = cls.objects.get(key=key)
            return setting.value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_setting(cls, key: str, value: str, description: str = '', user: User = None):
        """
        Set or update a setting.

        Args:
            key: Setting key
            value: Setting value
            description: Optional description
            user: User making the change
        """
        setting, created = cls.objects.update_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'updated_by': user
            }
        )
        return setting


# ============================================================================
# VTU SEMESTER URL MANAGEMENT
# ============================================================================

class VTUSemesterURL(models.Model):
    """
    Stores semester-wise VTU result portal URLs.
    Each semester in each academic year can have its own URL.

    VTU publishes results with different URLs:
    - Even semesters (2,4,6,8): June/July exams → JJEcbcs25 pattern
    - Odd semesters (1,3,5,7): Dec/Jan exams → DJcbcs25 pattern
    """

    SEMESTER_CHOICES = [(i, f'Semester {i}') for i in range(1, 9)]

    semester = models.IntegerField(
        choices=SEMESTER_CHOICES,
        help_text="Which semester this URL is for (1-8)"
    )
    academic_year = models.CharField(
        max_length=10,
        help_text="Academic year (e.g., 2024-25)"
    )
    url = models.URLField(
        max_length=500,
        help_text="VTU result portal URL for this semester"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this URL is currently active",
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vtu_url_updates',
        help_text="Admin who last updated this URL"
    )

    class Meta:
        unique_together = ['semester', 'academic_year']
        ordering = ['-academic_year', '-semester']
        verbose_name = 'VTU Semester URL'
        verbose_name_plural = 'VTU Semester URLs'
        indexes = [
            models.Index(fields=['semester', 'academic_year', 'is_active']),
            models.Index(fields=['is_active', '-updated_at']),
        ]

    def __str__(self):
        return f"Sem {self.semester} - {self.academic_year} - {self.get_url_type()}"

    def get_url_type(self):
        """Return whether this is an odd or even semester URL."""
        return "Even (June/July)" if self.semester % 2 == 0 else "Odd (Dec/Jan)"

    def clean(self):
        """Validate URL format."""
        if not self.url.startswith('https://'):
            raise ValidationError('URL must start with https://')
        if 'vtu.ac.in' not in self.url:
            raise ValidationError('URL must be a VTU domain (vtu.ac.in)')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ============================================================================
# NOTIFICATION MODEL
# ============================================================================

class Notification(models.Model):
    """
    Model for storing notifications that can be posted by Admin/Faculty
    and viewed by Students.
    """
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    title = models.CharField(
        max_length=200,
        help_text="Notification title"
    )
    message = models.TextField(
        help_text="Notification message content"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        help_text="Priority level of the notification",
        db_index=True
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_created',
        help_text="Admin or Faculty who created this notification"
    )
    target_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        help_text="If set, notification is only for this department. Leave blank for all departments."
    )
    target_semester = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(8)],
        help_text="If set, notification is only for this semester. Leave blank for all semesters."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this notification is currently active",
        db_index=True
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this notification should expire (optional)"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['-created_at', 'is_active']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['target_department', 'target_semester', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.priority}) - {self.created_at.strftime('%Y-%m-%d')}"

    def is_expired(self):
        """Check if notification has expired."""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at

    def is_visible(self):
        """Check if notification should be visible to users."""
        return self.is_active and not self.is_expired()
