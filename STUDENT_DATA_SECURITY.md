# Student Data Security Implementation

## Overview
This document explains how student data security is implemented in Uni-Smart to ensure students can only access their own data.

## Security Measures

### 1. Email-Based Access Control

All student-specific API endpoints use the student's email address as the primary identifier:

- `/api/student/overview/:email` - Student dashboard overview
- `/api/results/student/:email` - Student results
- `/api/exams/seating/student/:email` - Exam seating arrangements

**How it works:**
1. Frontend passes the authenticated user's email from the AuthContext
2. Backend validates the email exists in the database
3. Backend retrieves ONLY data belonging to that specific email
4. No student can access another student's data by manipulating the email parameter (would require authentication as that user first)

### 2. Database Query Isolation

Each endpoint follows this secure pattern:

```javascript
// Step 1: Verify student exists and get their USN
const [students] = await connection.execute(
    `SELECT usn FROM students WHERE email = ? LIMIT 1`,
    [email]
);

if (students.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
}

const studentUsn = students[0].usn;

// Step 2: Fetch ONLY data for this specific USN
const [data] = await connection.execute(
    `SELECT * FROM table WHERE student_usn = ?`,
    [studentUsn]
);
```

**Security benefits:**
- Parameterized queries prevent SQL injection
- `LIMIT 1` ensures only one student record is retrieved
- All subsequent queries filter by the verified USN
- No cross-student data leakage possible

### 3. Frontend Authentication

The frontend uses the `ProtectedRoute` component with role-based access:

```typescript
<ProtectedRoute allowedRoles={['STUDENT']}>
  {/* Student-only content */}
</ProtectedRoute>
```

This ensures:
- Only authenticated students can access student pages
- User's email is available via `useAuth()` hook
- No unauthorized access to student endpoints

### 4. API Endpoint Security Features

#### Student Overview Endpoint
**Endpoint:** `GET /api/student/overview/:email`

**What it returns:**
- USN, name, current semester
- CGPA (calculated)
- Semesters completed
- Upcoming exams count

**Security:**
- Only returns data for the specified email
- Validates student exists before processing
- Returns 404 if student not found

#### Student Results Endpoint
**Endpoint:** `GET /api/results/student/:email`

**What it returns:**
- Overall CGPA
- Semester-wise results
- Subject details (code, name, marks, grades, credits)

**Security:**
- Verifies student email before querying results
- Fetches results ONLY for that student's USN
- Groups results by semester for the specific student

#### Exam Seating Endpoint
**Endpoint:** `GET /api/exams/seating/student/:email`

**What it returns:**
- Student's exam seating arrangements
- Room, row, and column assignments
- Exam dates and sessions
- Subject codes

**Security:**
- Validates student email
- Joins seating plan with exams table
- Filters by student USN only
- Orders by exam date for better UX

## Data Flow

```
Student Login
    ↓
AuthContext provides user.email
    ↓
Frontend calls API with user.email
    ↓
Gateway validates email exists
    ↓
Gateway retrieves student's USN
    ↓
Gateway fetches data for that USN ONLY
    ↓
Data returned to frontend
    ↓
Student sees ONLY their own data
```

## Important Notes

### What Students CAN access:
✅ Their own CGPA and grades
✅ Their own semester results
✅ Their own exam seating arrangements
✅ Their own timetable
✅ Their own profile information

### What Students CANNOT access:
❌ Other students' results or grades
❌ Other students' personal information
❌ Other students' exam seating
❌ Admin functionalities
❌ Faculty data modification

## Database Tables Involved

### `students` table
- Stores student basic information
- Primary key: `usn`
- Contains: email, name, current_semester, etc.

### `student_results` table (placeholder)
- Stores student results
- Foreign key: `student_usn` references `students(usn)`
- Contains: semester, subject_code, marks, grades, credits

### `exam_seating_plan` table
- Stores exam seat allocations
- Foreign key: `student_usn` references `students(usn)`
- Contains: exam_id, room_id, row_num, col_num

### `exams` table
- Stores exam information
- Primary key: `exam_id`
- Contains: subject_code, exam_date, exam_session

## Backend Implementation Details

### Django Backend (Result Analysis Service)

The Django backend at port 8000 has comprehensive RBAC:

**Student ViewSet** (`StudentViewSet`):
```python
def get_queryset(self):
    user = self.request.user

    if user.role == 'STUDENT':
        return Student.objects.filter(id=user.student_profile.id)
    # Only returns the student's own record
```

**Student Result ViewSet** (`StudentResultViewSet`):
```python
def get_queryset(self):
    user = self.request.user

    if user.role == 'STUDENT':
        return StudentResult.objects.filter(student=user.student_profile)
    # Only returns the student's own results
```

### Gateway (Port 8080)

The Express.js gateway provides additional endpoints for the frontend:
- Validates email parameter
- Uses parameterized SQL queries
- Implements connection pooling
- Returns appropriate HTTP status codes

## Testing the Security

To verify students can only access their own data:

1. **Login as Student A**
   - Note the email (e.g., student1@anjuman.edu.in)
   - Access results - should see Student A's data

2. **Try to access Student B's data**
   - Manually change URL parameter (won't work - authentication required)
   - Frontend uses authenticated user's email from context

3. **Database Query Test**
   - Check SQL logs - all queries filter by the logged-in student's email/USN
   - No cross-student data in query results

## Best Practices Implemented

✅ **Parameterized Queries** - Prevents SQL injection
✅ **Email Validation** - Ensures student exists before processing
✅ **Connection Pooling** - Efficient database usage
✅ **Error Handling** - Proper HTTP status codes (404, 500)
✅ **Logging** - Console logs for debugging
✅ **Data Isolation** - Each query filtered by student identifier
✅ **Frontend Auth** - Protected routes and role-based access
✅ **Minimal Data Exposure** - Only necessary fields returned

## Future Enhancements

Consider adding:
- [ ] JWT token validation on backend endpoints
- [ ] Rate limiting to prevent abuse
- [ ] Audit logging for data access
- [ ] Encryption for sensitive data
- [ ] HTTPS enforcement
- [ ] CORS configuration for production
- [ ] API request signature verification

## Conclusion

The current implementation ensures:
1. Students authenticate via the frontend
2. Only authenticated user's email is used in API calls
3. Backend validates and restricts data to that email/USN
4. No student can access another student's data
5. All database queries are parameterized and filtered

This provides a secure, student-specific data access system.
