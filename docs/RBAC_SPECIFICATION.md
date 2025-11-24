# 🔐 Role-Based Access Control (RBAC) Specification for Uni-Smart

## Project Scope
**Current Focus:** CSE Department only
**Future Expansion:** All departments with similar access patterns

---

## Three User Roles:
1. **ADMIN** - Full system control and management
2. **FACULTY** - Class advisor + Subject teacher responsibilities
3. **STUDENT** - Personal data access only

---

## Key Faculty Concepts

### Faculty Has Two Roles:
1. **Class Advisor** - Responsible for a specific class/section
   - Can manage student registrations for their class
   - Can view all results of students in their advised class
   - Can analyze performance of their advised class

2. **Subject Teacher** - Handles specific subjects
   - Can generate timetable only for classes they teach
   - Can view timetable showing their teaching schedule
   - Can view results for subjects they teach
   - Can analyze subject-specific performance
   - Can see exam schedule for subjects they handle

### Assignment Model:
- **Admin assigns:** Subjects to Faculty (via Faculty-Subject Assignment)
- **Admin assigns:** Class Advisor responsibility to Faculty
- **Faculty operates:** Only within assigned scope

---

## 📊 Detailed Access Control Matrix

### 1️⃣ **TIMETABLE MODULE**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **Generate Timetable** | ✅ Any class | ✅ **Own advised class ONLY** | ❌ No | Faculty can only generate for the class they advise |
| **View Timetable** | ✅ All classes | ✅ **Classes they teach** | ✅ Own class | Faculty sees only their teaching schedule |
| **Edit/Modify Timetable** | ✅ Yes | ❌ No | ❌ No | **Only admin can modify after generation** |
| **Delete Timetable** | ✅ Yes | ❌ No | ❌ No | Admin-only operation |
| **Export (PDF/Excel/Word)** | ✅ All | ✅ Own teaching schedule | ✅ Own class | Download capabilities |
| **View Subject Schedule** | ✅ All subjects | ✅ **Assigned subjects only** | ✅ Own subjects | Filter by faculty_subject_assignment |

**Access Rules:**
- **Faculty Generate Access:** `WHERE faculty.class_advisor_section = section.id`
- **Faculty View Access:** `WHERE subject.faculty_id = user.faculty.id`
- **Student View Access:** `WHERE section.id = student.section_id`

**Access Denied:**
- ✗ Faculty cannot generate timetable for classes they don't advise
- ✗ Faculty cannot edit/modify any timetable (even their own)
- ✗ Faculty cannot view schedules of other faculty members
- ✗ Students cannot generate/edit timetables

---

### 2️⃣ **EXAM SEATING MODULE**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **Manage Rooms** | | | |
| - Create/Edit/Delete Rooms | ✅ Yes | ❌ No | ❌ No | Infrastructure management |
| - View Rooms | ✅ Yes | ✅ Yes | ✅ Yes | Public information |
| **Manage Exams** | | | |
| - Schedule Exams | ✅ Yes | ❌ No | ❌ No | Admin creates exam schedule |
| - View Exams | ✅ All exams | ✅ **Own subject exams ONLY** | ✅ Registered exams only | Filtered by subject assignment |
| - Delete Exams | ✅ Yes | ❌ No | ❌ No | Admin-only |
| **Student Registrations** | | | |
| - Register Students (Single) | ✅ Yes | ✅ **Own class students** | ❌ No | Faculty can register their advised class |
| - Bulk Register Students | ✅ Yes | ✅ **Own class students** | ❌ No | Batch registration for advised class |
| - View Registrations | ✅ All | ✅ **Own class + own subjects** | ✅ Own only | Faculty sees students in their scope |
| - Extract from PDF | ✅ Yes | ✅ Yes | ❌ No | Student list upload |
| - Delete Registrations | ✅ Yes | ✅ **Own class only** | ❌ No | Can undo registrations |
| **Generate Seating** | ✅ Yes | ❌ No | ❌ No | **Only admin can run algorithm** |
| **View Seating Plan** | ✅ All exams | ✅ **Own subject exams** | ✅ **Own seat allocation** | Student sees: Room, Seat, Date, Time |
| **Export Seating** | ✅ All | ✅ **Own subjects** | ❌ No | PDF export for invigilators |

**Access Rules:**
- **Faculty View Exams:** `WHERE exam.subject_code IN (SELECT subject_code FROM faculty_subject_assignments WHERE faculty_id = user.faculty.id)`
- **Faculty Register Students:** `WHERE student.section_id = faculty.class_advisor_section`
- **Student View Seating:** `WHERE seating_plan.student_usn = user.student.usn`

**Access Denied:**
- ✗ Faculty cannot generate seating arrangements (admin workflow)
- ✗ Faculty cannot see exams for subjects they don't handle
- ✗ Faculty cannot register students from other classes
- ✗ Students cannot see other students' seat allocations
- ✗ Students cannot register themselves (faculty/admin does it)

---

### 3️⃣ **RESULT ANALYSIS MODULE**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **Dashboard Access** | ✅ Full stats | ✅ Class + Subject stats | ✅ Personal stats | Role-filtered aggregates |
| **View Results** | | | |
| - All Students (CSE Dept) | ✅ Yes | ❌ No | ❌ No | Department-wide for admin |
| - Class Students Results | ✅ Yes | ✅ **Own advised class ONLY** | ❌ No | Faculty as class advisor |
| - Subject Results | ✅ All subjects | ✅ **Assigned subjects ONLY** | ❌ No | Faculty sees results for subjects they teach |
| - Own Results | ✅ Yes | ✅ Yes | ✅ Yes | Personal access |
| - Search by USN | ✅ Any student | ✅ **Own class students** | ❌ No | Privacy protection |
| - Download Results | ✅ All | ✅ **Own class + subjects** | ✅ Own only | Export control |
| **Scrape Results (VTU)** | | | |
| - Single Student Scrape | ✅ Yes | ❌ No | ❌ No | Admin-only (requires credentials) |
| - Batch Scrape (CSE) | ✅ Yes | ❌ No | ❌ No | Admin-only operation |
| - View Scrape Logs | ✅ Yes | ❌ No | ❌ No | System monitoring |
| **Analytics** | | | |
| - Subject Analytics | ✅ All subjects | ✅ **Assigned subjects ONLY** | ✅ Own subjects | Pass%, avg marks, distribution |
| - Class Analytics | ✅ All classes | ✅ **Own advised class ONLY** | ❌ No | Comparative analysis |
| - Batch Analytics (Year-wise) | ✅ All batches | ✅ **Own class batch** | ❌ No | Year-wise performance |
| - Student Comparison | ✅ Any students | ✅ **Within own class** | ❌ No | Rank, percentile |
| - Backlog Tracking | ✅ All | ✅ **Own class students** | ✅ Own only | Failed subjects list |
| - Performance Trends | ✅ All | ✅ **Own class + subjects** | ✅ Own only | Semester-wise CGPA/marks |
| - Top Performers | ✅ All | ✅ **Own class** | ✅ View only | Leaderboard |
| - Subject-wise Pass% | ✅ All subjects | ✅ **Own subjects** | ✅ View only | Department benchmark |
| **CGPA Calculation** | ✅ All | ✅ **Own class students** | ✅ Own only | VTU formula |
| **Student Management** | | | |
| - Create Students | ✅ Yes | ❌ No | ❌ No | Account creation |
| - Edit Student Info | ✅ Yes | ✅ **Own class (limited)** | ✅ **Profile only** | Faculty: phone, email; Student: phone only |
| - Delete Students | ✅ Yes | ❌ No | ❌ No | Admin-only |
| - Bulk Upload Students | ✅ Yes | ❌ No | ❌ No | CSV/Excel import |
| - Promote Students | ✅ Yes | ❌ No | ❌ No | Semester increment |
| **Subject Management** | | | |
| - Create Subjects (CSE) | ✅ Yes | ❌ No | ❌ No | Curriculum management |
| - Edit Subjects | ✅ Yes | ❌ No | ❌ No | Admin-only |
| - View Subjects | ✅ All | ✅ All (CSE) | ✅ All (CSE) | Public information |
| - Assign Subject to Semester | ✅ Yes | ❌ No | ❌ No | Academic planning |
| **Faculty Management** | | | |
| - Create Faculty | ✅ Yes | ❌ No | ❌ No | Admin creates accounts |
| - **Assign Subjects to Faculty** | ✅ **Yes (Admin only)** | ❌ **No (cannot self-assign)** | ❌ No | **Critical: Admin assigns teaching** |
| - Assign Class Advisor | ✅ Yes | ❌ No | ❌ No | Admin assigns advisor role |
| - View Assigned Subjects | ✅ All | ✅ Own only | ❌ No | Faculty sees their teaching load |
| - View Advised Class Students | ✅ All | ✅ **Own class** | ❌ No | Class advisor access |
| **Exam Schedules** | | | |
| - Create Schedule | ✅ Yes | ❌ No | ❌ No | Admin creates exam calendar |
| - View Schedule | ✅ All | ✅ **Own subjects** | ✅ All | Public exam dates |
| - Edit/Delete Schedule | ✅ Yes | ❌ No | ❌ No | Admin-only |

**Access Rules:**
- **Faculty View Class Results:** `WHERE student.section_id = faculty.class_advisor_section`
- **Faculty View Subject Results:** `WHERE result.subject_id IN (SELECT subject_id FROM faculty_subject_assignments WHERE faculty_id = user.faculty.id)`
- **Faculty Analytics Scope:** `(Own Class Students) UNION (Own Subject Results)`
- **Student View Results:** `WHERE result.student_id = user.student.id`

**Access Denied:**
- ✗ Faculty cannot scrape VTU results (security + credentials)
- ✗ Faculty cannot assign subjects to themselves (admin workflow)
- ✗ Faculty cannot view results outside their class/subjects
- ✗ Faculty cannot compare students across different classes
- ✗ Students cannot view other students' results
- ✗ Students cannot access any analytics beyond personal data

---

### 4️⃣ **USER MANAGEMENT**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **View All Users** | ✅ Yes (CSE only) | ❌ No | ❌ No | Admin dashboard |
| **Create Users** | ✅ Yes | ❌ No | ❌ No | Account provisioning |
| **Assign Roles** | ✅ Yes | ❌ No | ❌ No | ADMIN/FACULTY/STUDENT |
| **Assign Class Advisor** | ✅ Yes | ❌ No | ❌ No | Links faculty to section |
| **Assign Subjects to Faculty** | ✅ Yes | ❌ No | ❌ No | Teaching assignments |
| **Delete Users** | ✅ Yes | ❌ No | ❌ No | Account removal |
| **Deactivate Users** | ✅ Yes | ❌ No | ❌ No | Temporary disable |
| **View Own Profile** | ✅ Yes | ✅ Yes | ✅ Yes | Personal information |
| **Edit Own Profile** | ✅ Yes | ✅ Yes (limited) | ✅ Yes (limited) | Name, phone, email |
| **Upload Profile Picture** | ✅ Yes | ✅ Yes | ✅ Yes | Personal customization |
| **Change Own Password** | ✅ Yes | ✅ Yes | ✅ Yes | Security |
| **Reset Any User Password** | ✅ Yes | ❌ No | ❌ No | Admin privilege |
| **View Audit Logs** | ✅ Yes | ❌ No | ❌ No | System monitoring |

**Access Denied:**
- ✗ Faculty cannot create/delete users
- ✗ Faculty cannot assign subjects (even to themselves)
- ✗ Faculty cannot view other users' profiles
- ✗ Students cannot manage any users

---

### 5️⃣ **DEPARTMENT MANAGEMENT**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **Current Scope** | CSE Only | CSE Only | CSE Only | Single department for now |
| **Create Departments** | ✅ Yes (future) | ❌ No | ❌ No | Multi-dept expansion |
| **Edit Department Info** | ✅ Yes | ❌ No | ❌ No | Admin-only |
| **View Department** | ✅ Yes | ✅ Yes | ✅ Yes | Public info |
| **View Dept Students** | ✅ All CSE | ✅ **Own class** | ❌ No | Filtered access |
| **View Dept Subjects** | ✅ All CSE | ✅ All CSE | ✅ All CSE | Curriculum info |
| **View Dept Faculty** | ✅ All CSE | ✅ All CSE | ✅ All CSE | Public directory |

**Note:** Department selection is hardcoded to CSE for now. Future expansion will add department picker for admin.

---

### 6️⃣ **DASHBOARD ACCESS**

| Dashboard View | Admin | Faculty | Student | Widgets/Components |
|----------------|-------|---------|---------|-------------------|
| **Admin Dashboard** | ✅ Yes | ❌ No | ❌ No | System stats, user management, all modules |
| **Faculty Dashboard** | ✅ (view mode) | ✅ Yes | ❌ No | Class + Subject specific data |
| **Student Dashboard** | ✅ (view mode) | ❌ No | ✅ Yes | Personal data only |

**Admin Dashboard Widgets:**
- Total Students (CSE)
- Total Faculty (CSE)
- Total Subjects
- Recent Results Upload
- Pending Registrations
- System Health Status
- Quick Actions: Create Users, Schedule Exams, Scrape Results

**Faculty Dashboard Widgets:**
- **As Class Advisor:**
  - My Advised Class: {Section Name}
  - Total Students in Class: {count}
  - Class Average CGPA
  - Students with Backlogs
  - Upcoming Exams (class-wise)

- **As Subject Teacher:**
  - My Assigned Subjects: {list}
  - Classes I Teach: {sections}
  - My Teaching Timetable
  - Subject-wise Pass Percentage
  - Upcoming Exams (subject-wise)

- **Quick Actions:**
  - View My Class Students
  - View Subject Results
  - Register Students for Exam
  - View My Timetable

**Student Dashboard Widgets:**
- My Current Semester
- My CGPA
- Recent Results
- Upcoming Exams
- My Timetable (Current Week)
- Backlog Subjects (if any)
- Notifications
- **Quick Actions:**
  - View All Results
  - View Timetable
  - Check Exam Seat

---

### 7️⃣ **SYSTEM SETTINGS**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **VTU Scraper Config** | ✅ Yes | ❌ No | ❌ No | VTU portal URL, credentials |
| **Academic Calendar** | ✅ Yes | ✅ View only | ✅ View only | Semester dates, holidays |
| **Pass/Fail Criteria** | ✅ Yes | ❌ No | ❌ No | Minimum marks settings |
| **CGPA Calculation Rules** | ✅ Yes | ❌ No | ❌ No | Grade point mapping |
| **Notification Preferences** | ✅ Yes | ✅ Own only | ✅ Own only | Email/SMS settings |
| **Department Settings (CSE)** | ✅ Yes | ❌ No | ❌ No | HOD name, contact |
| **Backup/Restore** | ✅ Yes | ❌ No | ❌ No | Database operations |

---

### 8️⃣ **NOTIFICATIONS & ANNOUNCEMENTS**

| Feature | Admin | Faculty | Student | Implementation Notes |
|---------|-------|---------|---------|---------------------|
| **Send System-wide Notification** | ✅ Yes | ❌ No | ❌ No | All users |
| **Send to Class** | ✅ Yes | ✅ **Own class** | ❌ No | Class advisor capability |
| **Send to Subject Students** | ✅ Yes | ✅ **Own subjects** | ❌ No | Subject-specific announcements |
| **View Notifications** | ✅ Yes | ✅ Yes | ✅ Yes | Personal inbox |
| **Mark as Read** | ✅ Yes | ✅ Yes | ✅ Yes | Notification management |
| **Result Announcement Alerts** | Auto-sent | Auto-sent | Auto-sent | Triggered on result upload |

---

## 🚨 **CRITICAL ACCESS DENIALS** (Security Priority)

### **High Priority Security Rules:**

#### **Students CANNOT:**
1. ✗ View other students' results (PRIVACY VIOLATION)
2. ✗ Access VTU scraper (SECURITY RISK)
3. ✗ Modify any timetables (DATA INTEGRITY)
4. ✗ Generate exam seating (ADMIN WORKFLOW)
5. ✗ See comparative analytics (PRIVACY)
6. ✗ Register for exams themselves (WORKFLOW CONTROL)
7. ✗ Access user management (SECURITY)
8. ✗ View system audit logs (SECURITY)
9. ✗ See other students' seat allocations (PRIVACY)

#### **Faculty CANNOT:**
1. ✗ Scrape VTU results (ADMIN-ONLY, CREDENTIAL RISK)
2. ✗ Modify/edit timetables after generation (ONLY ADMIN)
3. ✗ Generate exam seating arrangements (ADMIN WORKFLOW)
4. ✗ Assign subjects to themselves (ADMIN ASSIGNS)
5. ✗ View results outside their class/subjects (DATA ISOLATION)
6. ✗ Access students not in their advised class (PRIVACY)
7. ✗ Delete exams or rooms (ADMIN FUNCTION)
8. ✗ Manage user accounts (ADMIN FUNCTION)
9. ✗ View system settings or audit logs (SECURITY)
10. ✗ Schedule/edit exam dates (ADMIN WORKFLOW)
11. ✗ Compare students across different classes (PRIVACY)
12. ✗ Generate timetable for classes they don't advise (SCOPE LIMIT)

#### **Public/Unauthenticated CANNOT:**
1. ✗ Access any internal pages
2. ✗ View any data
3. ✗ Access any API endpoints (except login)

---

## 🔑 **DATABASE SCHEMA FOR RBAC**

### **New/Modified Tables Needed:**

```sql
-- Faculty has class advisor assignment
ALTER TABLE results_faculty ADD COLUMN class_advisor_section_id VARCHAR(255) NULL;
ALTER TABLE results_faculty ADD FOREIGN KEY (class_advisor_section_id)
    REFERENCES sections(id);

-- Faculty-Subject Assignment (already exists)
-- results_faculty_subject_assignments table links:
-- - faculty_id (FK to results_faculty)
-- - subject_id (FK to results_subjects)
-- - semester
-- - academic_year
-- - section (which class they teach this subject to)

-- Students belong to a section
-- students table should have:
ALTER TABLE students ADD COLUMN section_id VARCHAR(255) NULL;
ALTER TABLE students ADD FOREIGN KEY (section_id) REFERENCES sections(id);
```

### **Key Relationships:**

```
Faculty (1) <---> (1) User [role=FACULTY]
Faculty (1) <---> (0..1) Section [as class_advisor]
Faculty (1) <---> (M) Faculty_Subject_Assignments [subjects they teach]

Student (1) <---> (1) User [role=STUDENT]
Student (1) <---> (1) Section [their class]
Student (M) <---> (M) Results [via student_results]

Section (1) <---> (M) Students [class students]
Section (1) <---> (0..1) Faculty [class advisor]
Section (1) <---> (M) Scheduled_Classes [timetable]
```

---

## 🛡️ **IMPLEMENTATION STRATEGY**

### **Phase 1: Backend Permissions (Django)**

#### **1. Update User Model:**
```python
# result analysis/results/models.py
class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('FACULTY', 'Faculty'),
        ('STUDENT', 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
```

#### **2. Update Faculty Model:**
```python
# result analysis/results/models.py
class Faculty(models.Model):
    # ... existing fields ...
    class_advisor_section = models.OneToOneField(
        'Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='class_advisor',
        help_text="Section this faculty advises as class advisor"
    )
```

#### **3. Custom Permission Classes:**
```python
# result analysis/results/permissions.py

class IsAdmin(BasePermission):
    """Only admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsFaculty(BasePermission):
    """Only faculty users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'FACULTY'

class IsStudent(BasePermission):
    """Only student users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'

class IsAdminOrFaculty(BasePermission):
    """Admin or Faculty users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'FACULTY']

class CanViewStudentResult(BasePermission):
    """
    - Admin: All results
    - Faculty: Own advised class + own subject results
    - Student: Own results only
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        result = obj  # StudentResult object

        if user.role == 'ADMIN':
            return True

        elif user.role == 'FACULTY':
            faculty = user.faculty
            # Can view if student is in advised class
            if faculty.class_advisor_section == result.student.section:
                return True
            # Can view if result is for a subject they teach
            teaches_subject = FacultySubjectAssignment.objects.filter(
                faculty=faculty,
                subject=result.subject,
                is_active=True
            ).exists()
            return teaches_subject

        elif user.role == 'STUDENT':
            # Can only view own results
            return result.student.user == user

        return False

class CanManageExamRegistration(BasePermission):
    """
    - Admin: All registrations
    - Faculty: Only for students in their advised class
    - Student: Cannot manage
    """
    def has_permission(self, request, view):
        user = request.user
        if user.role in ['ADMIN', 'FACULTY']:
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'ADMIN':
            return True

        elif user.role == 'FACULTY':
            faculty = user.faculty
            student = obj.student  # From exam_registration
            # Can only manage if student is in their advised class
            return student.section == faculty.class_advisor_section

        return False

class CanGenerateTimetable(BasePermission):
    """
    - Admin: Any class
    - Faculty: Only their advised class
    - Student: Cannot generate
    """
    def has_permission(self, request, view):
        user = request.user

        if user.role == 'ADMIN':
            return True

        elif user.role == 'FACULTY':
            # Check if faculty is class advisor
            faculty = user.faculty
            return faculty.class_advisor_section is not None

        return False

class CanModifyTimetable(BasePermission):
    """Only admin can modify timetables"""
    def has_permission(self, request, view):
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_authenticated and request.user.role == 'ADMIN'
        return True

class CanAccessVTUScraper(BasePermission):
    """Only admin can scrape VTU results"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class CanViewSubjectAnalytics(BasePermission):
    """
    - Admin: All subjects
    - Faculty: Only assigned subjects
    - Student: Own enrolled subjects
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def get_allowed_subjects(self, user):
        if user.role == 'ADMIN':
            return Subject.objects.all()

        elif user.role == 'FACULTY':
            # Only subjects they teach
            assignments = FacultySubjectAssignment.objects.filter(
                faculty=user.faculty,
                is_active=True
            )
            return Subject.objects.filter(
                id__in=assignments.values_list('subject_id', flat=True)
            )

        elif user.role == 'STUDENT':
            # Only subjects in their current semester
            return Subject.objects.filter(
                semester_subjects__semester=user.student.current_semester,
                semester_subjects__department=user.student.department
            )

        return Subject.objects.none()
```

#### **4. ViewSet Queryset Filtering:**
```python
# result analysis/results/views.py

class StudentResultViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewStudentResult]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            # Admin sees all CSE results
            return StudentResult.objects.filter(
                student__department__code='CSE'
            )

        elif user.role == 'FACULTY':
            faculty = user.faculty

            # Results from advised class
            class_results = StudentResult.objects.filter(
                student__section=faculty.class_advisor_section
            )

            # Results from subjects they teach
            subject_assignments = FacultySubjectAssignment.objects.filter(
                faculty=faculty,
                is_active=True
            )
            subject_results = StudentResult.objects.filter(
                subject__id__in=subject_assignments.values_list('subject_id', flat=True)
            )

            # Combine both querysets
            return (class_results | subject_results).distinct()

        elif user.role == 'STUDENT':
            # Only own results
            return StudentResult.objects.filter(
                student__user=user
            )

        return StudentResult.objects.none()

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return Student.objects.filter(department__code='CSE')

        elif user.role == 'FACULTY':
            # Only students in their advised class
            return Student.objects.filter(
                section=user.faculty.class_advisor_section
            )

        elif user.role == 'STUDENT':
            # Only themselves
            return Student.objects.filter(user=user)

        return Student.objects.none()

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def subject_analytics(self, request):
        """Subject-wise analytics"""
        user = request.user
        subject_id = request.query_params.get('subject_id')

        # Verify user has access to this subject
        if user.role == 'ADMIN':
            pass  # Admin can view any subject

        elif user.role == 'FACULTY':
            # Check if faculty teaches this subject
            has_access = FacultySubjectAssignment.objects.filter(
                faculty=user.faculty,
                subject_id=subject_id,
                is_active=True
            ).exists()

            if not has_access:
                return Response(
                    {"error": "You do not teach this subject"},
                    status=status.HTTP_403_FORBIDDEN
                )

        else:
            return Response(
                {"error": "Students cannot view subject analytics"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Proceed with analytics calculation...
        results = StudentResult.objects.filter(subject_id=subject_id)
        # ... analytics logic ...

    @action(detail=False, methods=['get'])
    def class_analytics(self, request):
        """Class-wise analytics"""
        user = request.user
        section_id = request.query_params.get('section_id')

        if user.role == 'ADMIN':
            pass  # Admin can view any class

        elif user.role == 'FACULTY':
            # Check if this is their advised class
            if str(user.faculty.class_advisor_section.id) != section_id:
                return Response(
                    {"error": "You are not the class advisor for this section"},
                    status=status.HTTP_403_FORBIDDEN
                )

        else:
            return Response(
                {"error": "Students cannot view class analytics"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Proceed with class analytics...
```

---

### **Phase 2: Frontend Route Guards (Next.js)**

#### **1. Auth Context Provider:**
```typescript
// frontend/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  profile?: {
    faculty?: {
      id: string;
      class_advisor_section?: string;
      assigned_subjects: string[];
    };
    student?: {
      id: string;
      usn: string;
      section: string;
    };
  };
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  canAccessSection: (sectionId: string) => boolean;
  canAccessSubject: (subjectId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:8001/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();

    setToken(data.access);
    setUser(data.user);

    localStorage.setItem('token', data.access);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const canAccessSection = (sectionId: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'FACULTY') {
      return user.profile?.faculty?.class_advisor_section === sectionId;
    }
    if (user.role === 'STUDENT') {
      return user.profile?.student?.section === sectionId;
    }
    return false;
  };

  const canAccessSubject = (subjectId: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'FACULTY') {
      return user.profile?.faculty?.assigned_subjects.includes(subjectId);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        canAccessSection,
        canAccessSubject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

#### **2. Protected Route Component:**
```typescript
// frontend/components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'FACULTY' | 'STUDENT')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
```

#### **3. Role-Based Component Rendering:**
```typescript
// frontend/components/RoleGuard.tsx
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'FACULTY' | 'STUDENT')[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

#### **4. Usage in Pages:**
```typescript
// frontend/app/timetable/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function TimetablePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT']}>
      <div>
        <h1>Timetable</h1>

        {/* Only show generate button to admin and class advisors */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <button>Generate Timetable (Any Class)</button>
        </RoleGuard>

        <RoleGuard allowedRoles={['FACULTY']}>
          {user?.profile?.faculty?.class_advisor_section ? (
            <button>Generate Timetable (My Advised Class)</button>
          ) : (
            <p>You are not assigned as a class advisor</p>
          )}
        </RoleGuard>

        {/* Only admin can edit */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <button>Edit Timetable</button>
          <button>Delete Timetable</button>
        </RoleGuard>

        {/* Everyone can view */}
        <TimetableView />
      </div>
    </ProtectedRoute>
  );
}
```

```typescript
// frontend/app/exam-seating/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';

export default function ExamSeatingPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT']}>
      <div>
        <h1>Exam Seating</h1>

        {/* Only admin can generate seating */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <button>Generate Seating Arrangement</button>
          <button>Manage Rooms</button>
        </RoleGuard>

        {/* Admin and faculty can register students */}
        <RoleGuard allowedRoles={['ADMIN', 'FACULTY']}>
          <button>Register Students for Exam</button>
        </RoleGuard>

        {/* Different views for each role */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <AllExamsView />
        </RoleGuard>

        <RoleGuard allowedRoles={['FACULTY']}>
          <MySubjectExamsView />
        </RoleGuard>

        <RoleGuard allowedRoles={['STUDENT']}>
          <MySeatAllocationView />
        </RoleGuard>
      </div>
    </ProtectedRoute>
  );
}
```

```typescript
// frontend/app/result-analysis/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';

export default function ResultAnalysisPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'STUDENT']}>
      <div>
        <h1>Result Analysis</h1>

        {/* Only admin can scrape VTU */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <button>Scrape VTU Results</button>
        </RoleGuard>

        {/* Different analytics access */}
        <RoleGuard allowedRoles={['ADMIN']}>
          <h2>All Students Analytics</h2>
          <AllStudentsAnalytics />
        </RoleGuard>

        <RoleGuard allowedRoles={['FACULTY']}>
          <h2>My Class & Subjects Analytics</h2>
          <MyClassAnalytics />
          <MySubjectsAnalytics />
        </RoleGuard>

        <RoleGuard allowedRoles={['STUDENT']}>
          <h2>My Performance</h2>
          <MyResultsView />
        </RoleGuard>
      </div>
    </ProtectedRoute>
  );
}
```

---

### **Phase 3: API Integration with RBAC**

#### **Axios Interceptor with JWT:**
```typescript
// frontend/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8001/api',
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 403 Forbidden responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      alert('Access Denied: You do not have permission to perform this action');
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### **API Calls with Role Awareness:**
```typescript
// frontend/services/resultService.ts
import api from '@/lib/api';

export const resultService = {
  // Get results - backend filters by role automatically
  getResults: async (filters?: { semester?: number; subject_id?: string }) => {
    const response = await api.get('/results/', { params: filters });
    return response.data;
  },

  // Get student by USN - only if user has permission
  getStudentByUSN: async (usn: string) => {
    try {
      const response = await api.get(`/students/?usn=${usn}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this student');
      }
      throw error;
    }
  },

  // Scrape VTU - only admin can call this
  scrapeVTU: async (data: { usns: string[] }) => {
    const response = await api.post('/scraper/scrape-batch/', data);
    return response.data;
  },

  // Get analytics - filtered by backend based on role
  getSubjectAnalytics: async (subjectId: string) => {
    const response = await api.get(`/analytics/subject/?subject_id=${subjectId}`);
    return response.data;
  },

  getClassAnalytics: async (sectionId: string) => {
    const response = await api.get(`/analytics/class/?section_id=${sectionId}`);
    return response.data;
  },
};
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Backend (Django) Tasks:**
- [ ] Update User model with role field
- [ ] Update Faculty model with class_advisor_section field
- [ ] Update Student model with section field
- [ ] Create all permission classes in permissions.py
- [ ] Update all ViewSets with permission_classes
- [ ] Implement get_queryset() filtering in all ViewSets
- [ ] Add role-based checks in custom actions
- [ ] Test API endpoints with different user roles
- [ ] Create admin interface for assigning class advisors
- [ ] Create admin interface for subject assignments

### **Frontend (Next.js) Tasks:**
- [ ] Create AuthContext with role management
- [ ] Implement ProtectedRoute component
- [ ] Implement RoleGuard component
- [ ] Update all pages with ProtectedRoute wrapper
- [ ] Add role-based UI rendering (RoleGuard)
- [ ] Create API service layer with JWT interceptor
- [ ] Update Sidebar with role-based navigation
- [ ] Create role-specific dashboard components
- [ ] Add "Access Denied" page
- [ ] Test all routes with different user roles

### **Database Tasks:**
- [ ] Add class_advisor_section_id to results_faculty table
- [ ] Add section_id to students table
- [ ] Create foreign key constraints
- [ ] Migrate existing data (if any)
- [ ] Create indexes for performance

### **Flask Services Tasks:**
- [ ] Add JWT verification in Timetable service
- [ ] Add JWT verification in Exam Seating service
- [ ] Implement role checking in Flask routes
- [ ] Update API responses with filtered data

---

## 🎯 **SUMMARY**

### **Key Changes from Initial Analysis:**

1. **Timetable:**
   - ✅ Faculty can only generate timetable for their advised class
   - ✅ Faculty can only view their own teaching schedule
   - ✅ Only admin can edit/modify timetables

2. **Exam Seating:**
   - ✅ Only admin can generate seating arrangements
   - ✅ Faculty can only see exams for subjects they handle
   - ✅ Students can only see their own seat allocation
   - ✅ Faculty can register students only from their advised class

3. **Result Analysis:**
   - ✅ Faculty can see results for: (advised class students) + (subjects they teach)
   - ✅ Analytics for faculty limited to: (own class) + (own subjects)
   - ✅ Admin assigns subjects to faculty (faculty cannot self-assign)

4. **Scope:**
   - ✅ Currently focused on CSE department only
   - ✅ Future expansion planned for all departments

---

This specification provides a complete, practical, and secure RBAC implementation for the Uni-Smart project that aligns with real academic workflows.
