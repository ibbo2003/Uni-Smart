# UniSmart API Documentation

Complete API reference for the UniSmart Result Analysis Module.

## Base URL
```
http://localhost:8000/api/
```

## Authentication

All API endpoints (except login) require JWT authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Login (Obtain Token)
```http
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Refresh Token
```http
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Verify Token
```http
POST /api/auth/verify/
```

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## User Endpoints

### 1. List Users
```http
GET /api/users/
```

**Query Parameters:**
- `role` - Filter by role (ADMIN, FACULTY, STUDENT)
- `is_active_user` - Filter by active status (true/false)
- `search` - Search by username, email, name

**Response (200 OK):**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-here",
      "username": "admin",
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "ADMIN",
      "phone": "+911234567890",
      "profile_picture": null,
      "is_active_user": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Current User
```http
GET /api/users/me/
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "username": "student123",
  "email": "student@example.com",
  "role": "STUDENT",
  ...
}
```

### 3. Change Password
```http
POST /api/users/change_password/
```

**Request Body:**
```json
{
  "old_password": "oldpass123",
  "new_password": "newpass456",
  "new_password2": "newpass456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully."
}
```

---

## Department Endpoints

### 1. List Departments
```http
GET /api/departments/
```

**Query Parameters:**
- `code` - Filter by department code
- `is_active` - Filter by active status
- `search` - Search by code, name, description

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid-here",
      "code": "CS",
      "name": "Computer Science & Engineering",
      "description": "Department of Computer Science",
      "is_active": true,
      "student_count": 150,
      "faculty_count": 12,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Department Details
```http
GET /api/departments/{id}/
```

### 3. Get Department Subjects
```http
GET /api/departments/{id}/subjects/
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "code": "21CS51",
    "name": "Database Management Systems",
    "short_name": "DBMS",
    "subject_type": "THEORY",
    "credits": "4.0",
    "max_internal_marks": 50,
    "max_external_marks": 100,
    "total_marks": 150,
    "department": "uuid-here",
    "department_name": "Computer Science & Engineering"
  }
]
```

### 4. Get Department Students
```http
GET /api/departments/{id}/students/?semester=5
```

**Query Parameters:**
- `semester` - Filter by current semester

### 5. Get Department Performance
```http
GET /api/departments/{id}/performance/?semester=5&academic_year=2024-2025
```

**Query Parameters:**
- `semester` - Filter by semester
- `academic_year` - Filter by academic year

---

## Subject Endpoints

### 1. List Subjects
```http
GET /api/subjects/
```

**Query Parameters:**
- `code` - Filter by subject code
- `subject_type` - Filter by type (THEORY, LAB, PROJECT, etc.)
- `department` - Filter by department ID
- `is_active` - Filter by active status
- `search` - Search by code, name

**Response (200 OK):**
```json
{
  "count": 50,
  "results": [
    {
      "id": "uuid-here",
      "code": "21CS51",
      "name": "Database Management Systems",
      "short_name": "DBMS",
      "subject_type": "THEORY",
      "credits": "4.0",
      "max_internal_marks": 50,
      "max_external_marks": 100,
      "min_passing_marks": 40,
      "total_marks": 150,
      "department": "uuid-here",
      "department_name": "Computer Science & Engineering",
      "is_active": true
    }
  ]
}
```

### 2. Get Subject Results
```http
GET /api/subjects/{id}/results/?semester=5
```

**Query Parameters:**
- `semester` - Filter by semester

### 3. Get Subject Analytics
```http
GET /api/subjects/{id}/analytics/?semester=5
```

**Response (200 OK):**
```json
{
  "subject_code": "21CS51",
  "subject_name": "Database Management Systems",
  "total_students": 120,
  "passed": 110,
  "failed": 8,
  "absent": 2,
  "pass_percentage": 91.67,
  "average_marks": 118.5
}
```

---

## Student Endpoints

### 1. List Students
```http
GET /api/students/
```

**Query Parameters:**
- `department` - Filter by department ID
- `current_semester` - Filter by semester
- `batch` - Filter by batch year
- `is_active` - Filter by active status
- `search` - Search by USN, name, email

**Response (200 OK):**
```json
{
  "count": 150,
  "results": [
    {
      "id": "uuid-here",
      "usn": "2AB22CS008",
      "name": "John Doe",
      "department": "uuid-here",
      "department_name": "Computer Science & Engineering",
      "current_semester": 5,
      "batch": "22",
      "admission_year": 2022,
      "email": "john@example.com",
      "phone": "+911234567890",
      "cgpa": 8.75,
      "total_backlogs": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Student Details
```http
GET /api/students/{id}/
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "usn": "2AB22CS008",
  "name": "John Doe",
  "department": "uuid-here",
  "department_name": "Computer Science & Engineering",
  "current_semester": 5,
  "batch": "22",
  "cgpa": 8.75,
  "total_backlogs": 1,
  "semester_wise_sgpa": {
    "semester_1": 8.5,
    "semester_2": 8.8,
    "semester_3": 8.9,
    "semester_4": 8.6,
    "semester_5": 8.7
  },
  "subject_backlogs": [
    {
      "subject_code": "21CS51",
      "subject_name": "Database Management Systems",
      "semester": 5,
      "attempt_number": 1
    }
  ]
}
```

### 3. Get Student Results
```http
GET /api/students/{id}/results/
```

**Response (200 OK):**
```json
[
  {
    "semester": 1,
    "sgpa": 8.5,
    "total_subjects": 8,
    "passed_subjects": 8,
    "failed_subjects": 0,
    "results": [
      {
        "id": "uuid-here",
        "subject_code": "21MAT11",
        "subject_name": "Mathematics-I",
        "internal_marks": 45,
        "external_marks": 95,
        "total_marks": 140,
        "result_status": "P",
        "grade": "S",
        "grade_point": "10.00",
        "percentage": 93.33,
        "attempt_number": 1
      }
    ]
  }
]
```

### 4. Get Student Analytics
```http
GET /api/students/{id}/analytics/
```

**Response (200 OK):**
```json
{
  "usn": "2AB22CS008",
  "name": "John Doe",
  "cgpa": 8.75,
  "total_backlogs": 1,
  "backlogs": [
    {
      "subject_code": "21CS51",
      "subject_name": "Database Management Systems",
      "semester": 5,
      "attempt_number": 1
    }
  ],
  "semester_wise_sgpa": {
    "semester_1": 8.5,
    "semester_2": 8.8,
    "semester_3": 8.9,
    "semester_4": 8.6,
    "semester_5": 8.7
  },
  "grade_distribution": {
    "S": 10,
    "A": 15,
    "B": 8,
    "C": 3,
    "D": 0,
    "E": 0,
    "F": 1
  },
  "total_credits_earned": "148.0"
}
```

### 5. Get Student Transcript
```http
GET /api/students/{id}/transcript/
```

**Response (200 OK):**
```json
{
  "student": {
    "usn": "2AB22CS008",
    "name": "John Doe",
    ...
  },
  "cgpa": 8.75,
  "results": [
    // All results with full details
  ]
}
```

---

## Result Endpoints

### 1. List Results
```http
GET /api/results/
```

**Query Parameters:**
- `student` - Filter by student ID
- `subject` - Filter by subject ID
- `semester` - Filter by semester
- `result_status` - Filter by status (P, F, A, W, NE)
- `is_latest` - Filter by latest attempt
- `search` - Search by USN, student name, subject

**Response (200 OK):**
```json
{
  "count": 500,
  "results": [
    {
      "id": "uuid-here",
      "student": "uuid-here",
      "student_usn": "2AB22CS008",
      "student_name": "John Doe",
      "subject": "uuid-here",
      "subject_code": "21CS51",
      "subject_name": "Database Management Systems",
      "semester": 5,
      "internal_marks": 45,
      "external_marks": 95,
      "total_marks": 140,
      "result_status": "P",
      "grade": "S",
      "grade_point": "10.00",
      "percentage": 93.33,
      "is_latest": true,
      "attempt_number": 1,
      "announced_date": "2024-06-15",
      "scraped_at": "2024-06-16T10:30:00Z"
    }
  ]
}
```

---

## Scraper Endpoints (Admin Only)

### 1. Scrape Single USN
```http
POST /api/scraper/scrape/
```

**Request Body:**
```json
{
  "usn": "2AB22CS008"
}
```

**Response (200 OK):**
```json
{
  "usn": "2AB22CS008",
  "status": "SUCCESS",
  "records_created": 8,
  "records_updated": 0,
  "error_message": "",
  "execution_time": 45.67,
  "captcha_attempts": 2
}
```

### 2. Scrape Multiple USNs
```http
POST /api/scraper/scrape/
```

**Request Body:**
```json
{
  "usn_list": ["2AB22CS008", "2AB22CS009", "2AB22CS010"]
}
```

**Response (200 OK):**
```json
{
  "total_usns": 3,
  "success_count": 3,
  "failed_count": 0,
  "total_records_created": 24,
  "total_records_updated": 0,
  "results": [
    {
      "usn": "2AB22CS008",
      "status": "SUCCESS",
      "records_created": 8,
      ...
    }
  ]
}
```

### 3. Get Scrape Logs
```http
GET /api/scraper/logs/?status=SUCCESS&usn=2AB22CS008
```

**Query Parameters:**
- `status` - Filter by status (SUCCESS, FAILED, PARTIAL)
- `usn` - Filter by USN

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "initiated_by": "uuid-here",
    "initiated_by_username": "admin",
    "usn": "2AB22CS008",
    "status": "SUCCESS",
    "records_created": 8,
    "records_updated": 0,
    "error_message": "",
    "captcha_attempts": 2,
    "execution_time": "45.67",
    "scraped_at": "2024-06-16T10:30:00Z"
  }
]
```

---

## Analytics Endpoints

### 1. Get Dashboard Statistics
```http
GET /api/analytics/dashboard/
```

**Response for Admin (200 OK):**
```json
{
  "total_students": 500,
  "total_departments": 10,
  "total_subjects": 120,
  "total_results": 4000,
  "avg_cgpa": 7.85,
  "total_backlogs": 45,
  "recent_scrapes": 15
}
```

**Response for Faculty (200 OK):**
```json
{
  "department": "Computer Science & Engineering",
  "total_students": 150,
  "total_subjects": 40,
  "total_results": 1200,
  "avg_cgpa": 8.1,
  "total_backlogs": 12
}
```

**Response for Student (200 OK):**
```json
{
  "usn": "2AB22CS008",
  "name": "John Doe",
  "cgpa": 8.75,
  "current_semester": 5,
  "total_backlogs": 1,
  "total_subjects_taken": 37
}
```

### 2. Get Performance Trends
```http
GET /api/analytics/performance_trends/?department={dept-id}
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "department": "uuid-here",
    "department_name": "Computer Science & Engineering",
    "semester": 1,
    "academic_year": "2024-2025",
    "total_students": 150,
    "students_passed": 145,
    "students_failed": 3,
    "students_absent": 2,
    "pass_percentage": "96.67",
    "avg_marks": "115.50",
    "highest_marks": 148,
    "lowest_marks": 65
  }
]
```

---

## System Settings Endpoints (Admin Only)

### 1. Get All System Settings
```http
GET /api/settings/
```

**Description:** Retrieve all system configuration settings.

**Authorization:** JWT Token (Admin or Faculty)

**Response (200 OK):**
```json
[
  {
    "key": "VTU_RESULTS_URL",
    "value": "https://results.vtu.ac.in/JJEcbcs25/index.php",
    "description": "Current VTU Results Portal URL (updates every semester)",
    "updated_at": "2025-11-10T00:00:00Z",
    "updated_by": "admin"
  }
]
```

### 2. Get VTU Portal URL
```http
GET /api/settings/vtu-link/
```

**Description:** Get the current VTU results portal URL.

**Authorization:** JWT Token (Any authenticated user)

**Response (200 OK):**
```json
{
  "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
  "last_updated": "2025-11-10T00:00:00Z",
  "updated_by": "admin"
}
```

**Response (404 Not Found):**
```json
{
  "error": "VTU URL not configured"
}
```

### 3. Update VTU Portal URL
```http
PUT /api/settings/vtu-link/update/
```

**Description:** Update the VTU results portal URL. Use this when VTU changes their semester portal URL.

**Authorization:** JWT Token (Admin Only)

**Request Body:**
```json
{
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php"
}
```

**Response (200 OK):**
```json
{
  "message": "VTU URL updated successfully",
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php",
  "updated_by": "admin"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid VTU URL format. Must start with https://results.vtu.ac.in/"
}
```

**Response (403 Forbidden):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Use Cases

**When VTU Updates Semester Portal:**

1. **Identify New URL**
   ```
   Old: https://results.vtu.ac.in/JJEcbcs25/index.php
   New: https://results.vtu.ac.in/JJEcbcs26/index.php
   ```

2. **Update via API**
   ```bash
   curl -X PUT http://localhost:8000/api/settings/vtu-link/update/ \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}'
   ```

3. **Verify Update**
   ```bash
   curl -X GET http://localhost:8000/api/settings/vtu-link/ \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Test Scraping**
   ```bash
   curl -X POST http://localhost:8000/api/scraper/scrape/ \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"usn": "TEST_USN"}'
   ```

**Alternative Update Methods:**

**Via Django Admin:**
```
1. Login to /admin/
2. Navigate to "System Settings"
3. Click on "VTU_RESULTS_URL"
4. Update value field
5. Save
```

**Via Management Command:**
```bash
python manage.py shell
from results.models import SystemSettings
SystemSettings.set_setting('VTU_RESULTS_URL', 'new-url')
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid data",
  "details": {
    "field_name": ["This field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred."
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider adding:
- Django REST Framework throttling
- Nginx rate limiting
- Cloudflare protection

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 50, max: 100)

**Response Format:**
```json
{
  "count": 500,
  "next": "http://localhost:8000/api/students/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Filtering & Search

Most endpoints support:
- **Filtering**: Using query parameters matching field names
- **Search**: Using `?search=query` parameter
- **Ordering**: Using `?ordering=field_name` or `?ordering=-field_name` (descending)

Example:
```
GET /api/students/?department=uuid-here&current_semester=5&ordering=-cgpa
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Refresh tokens before they expire**
4. **Handle errors gracefully**
5. **Implement request retry logic**
6. **Log API calls for debugging**
7. **Use batch endpoints for multiple operations**

---

## Postman Collection

Import the Postman collection for easy testing:
[Download Postman Collection](./postman_collection.json) *(create this file separately)*

---

## Support

For API support or questions:
- Email: api-support@unismart.com
- GitHub Issues: https://github.com/yourusername/unismart-backend/issues
