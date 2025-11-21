# UniSmart Project Structure

Complete overview of the project file structure and organization.

---

## Directory Tree

```
unismart-backend/
│
├── config/                          # Project configuration
│   ├── __init__.py
│   ├── settings.py                  # Django settings
│   ├── urls.py                      # Root URL configuration
│   ├── wsgi.py                      # WSGI configuration
│   └── asgi.py                      # ASGI configuration
│
├── results/                         # Main application
│   ├── migrations/                  # Database migrations
│   │   └── __init__.py
│   │
│   ├── __init__.py
│   ├── admin.py                     # Django admin configuration
│   ├── apps.py                      # App configuration
│   ├── models.py                    # Database models (12 models)
│   ├── serializers.py               # DRF serializers
│   ├── views.py                     # API ViewSets
│   ├── urls.py                      # App URL routing
│   ├── permissions.py               # Custom permission classes
│   └── scraper_service.py           # VTU scraper service
│
├── logs/                            # Application logs
│   ├── django.log                   # General Django logs
│   └── scraper.log                  # Scraper-specific logs
│
├── media/                           # User-uploaded files
│   └── profile_pictures/            # User profile pictures
│
├── staticfiles/                     # Collected static files
│   └── admin/                       # Django admin static files
│
├── manage.py                        # Django management script
├── requirements.txt                 # Python dependencies
├── .env                             # Environment variables (not in git)
├── .env.example                     # Example environment file
├── .gitignore                       # Git ignore rules
├── README.md                        # Project overview
├── API_DOCUMENTATION.md             # Complete API reference
├── SETUP_GUIDE.md                   # Setup instructions
└── PROJECT_STRUCTURE.md             # This file
```

---

## Core Files Description

### Configuration Files

#### `config/settings.py`
- Django configuration
- Database settings
- Installed apps
- Middleware configuration
- REST Framework settings
- JWT configuration
- CORS settings
- Logging configuration
- Scraper settings

**Key Sections:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'rest_framework',
    'results',
    ...
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        ...
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    ...
}
```

#### `config/urls.py`
- Root URL routing
- Includes results app URLs
- Admin panel URL
- Static/media file serving (development)

#### `manage.py`
- Django command-line utility
- Used for:
  - Running server (`runserver`)
  - Migrations (`migrate`, `makemigrations`)
  - Creating users (`createsuperuser`)
  - Shell access (`shell`)
  - And more...

---

## Application Files

### Models (`results/models.py`)

Contains 12 Django models:

1. **User** - Custom user with role-based access
2. **Department** - Academic departments
3. **Subject** - Courses/subjects
4. **SemesterSubject** - Subject-semester mapping
5. **Student** - Student profiles
6. **Faculty** - Faculty profiles
7. **FacultySubjectAssignment** - Faculty-subject mapping
8. **ExamSchedule** - Exam schedules
9. **StudentResult** - Student exam results (main model)
10. **ResultAnalytics** - Pre-computed analytics
11. **ScrapeLog** - Scraping operation logs
12. **AuditLog** - System audit trail

**Key Features:**
- UUID primary keys
- Proper indexing
- Auto-calculation methods (CGPA, SGPA)
- Backlog tracking
- Referential integrity

### Serializers (`results/serializers.py`)

DRF serializers for all models:

- **Basic Serializers**: User, Department, Subject, Student, etc.
- **Detail Serializers**: StudentDetail, StudentResultDetail
- **Request Serializers**: ScrapeRequest, ExportRequest
- **Response Serializers**: DashboardStats, SemesterResults

**Features:**
- Nested serialization
- Computed fields
- Validation
- Write-only fields (passwords)

### Views (`results/views.py`)

8 ViewSets with custom actions:

1. **UserViewSet** - User management, profile, password change
2. **DepartmentViewSet** - Departments with subjects, students, performance
3. **SubjectViewSet** - Subjects with results, analytics
4. **StudentViewSet** - Students with results, analytics, transcript
5. **FacultyViewSet** - Faculty with subject assignments
6. **StudentResultViewSet** - Results (role-filtered)
7. **ScraperViewSet** - Scraping operations, logs
8. **AnalyticsViewSet** - Dashboard, trends

**Custom Actions:**
- `@action(detail=True)` - Object-level actions
- `@action(detail=False)` - Collection-level actions
- Role-based queryset filtering
- Permission classes per action

### Permissions (`results/permissions.py`)

Custom permission classes:

- **IsAdmin** - Admin-only access
- **IsFaculty** - Faculty-only access
- **IsStudent** - Student-only access
- **IsAdminOrFaculty** - Admin or Faculty
- **IsOwnerOrAdminOrFaculty** - Object-level permissions
- **IsAdminOrReadOnly** - Read for all, write for admin
- **CanAccessScraper** - Scraper permissions
- **CanViewAnalytics** - Analytics permissions

### Scraper Service (`results/scraper_service.py`)

VTU result scraper with:

**Main Class:**
- `VTUResultScraper` - Context manager for scraping

**Key Methods:**
- `_initialize_browser()` - Setup Selenium
- `_initialize_ocr()` - Setup EasyOCR
- `_preprocess_captcha_image()` - Image preprocessing
- `_extract_captcha_text()` - OCR extraction
- `_solve_captcha_and_login()` - CAPTCHA solving
- `_parse_result_page()` - Result extraction
- `_save_to_database()` - Database save with transaction
- `scrape_result()` - Single USN scrape
- `scrape_batch()` - Multiple USN scrape

**Features:**
- CAPTCHA solving with EasyOCR
- OpenCV image preprocessing
- Selenium WebDriver automation
- Django ORM integration
- Comprehensive logging
- Error handling

### Admin (`results/admin.py`)

Django admin configuration:

- Custom admin classes for all models
- List displays with computed fields
- Filters and search
- Custom fieldsets
- Colored status indicators
- Inline editing
- Custom actions

### URLs (`results/urls.py`)

API routing using DRF routers:

```python
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'students', StudentViewSet)
...
```

**Endpoints:**
- `/api/auth/login/` - JWT token
- `/api/users/` - Users
- `/api/students/` - Students
- `/api/scraper/scrape/` - Scraping
- And more...

---

## Configuration Files

### `.env`
Environment variables (not in git):
```env
SECRET_KEY=...
DEBUG=True
DB_NAME=unismart_db
DB_USER=root
DB_PASSWORD=...
CORS_ALLOWED_ORIGINS=...
SCRAPER_HEADLESS=True
```

### `.env.example`
Template for `.env` file (in git)

### `requirements.txt`
Python dependencies:
- Django 5.0+
- djangorestframework
- mysqlclient
- selenium
- easyocr
- opencv-python
- pandas
- And more...

### `.gitignore`
Files to exclude from git:
- `__pycache__/`
- `.env`
- `db.sqlite3`
- `logs/`
- `media/`
- `staticfiles/`
- Virtual environment

---

## Database Schema

### Relationships

```
User (1) ----< (1) Student
User (1) ----< (1) Faculty

Department (1) ----< (*) Student
Department (1) ----< (*) Faculty
Department (1) ----< (*) Subject

Student (*) ----< (*) StudentResult >---- (*) Subject
Faculty (*) ----< (*) FacultySubjectAssignment >---- (*) Subject

StudentResult (*) ---- (1) ExamSchedule

Department (1) ----< (*) ResultAnalytics
Subject (1) ----< (*) ResultAnalytics

User (1) ----< (*) ScrapeLog
User (1) ----< (*) AuditLog
```

### Indexes

Critical indexes for performance:
- User: role, email, username
- Student: usn, department, batch
- StudentResult: student+semester+is_latest, subject+result_status
- ScrapeLog: usn+scraped_at, status
- AuditLog: user+timestamp, action

---

## Key Design Patterns

### 1. Role-Based Access Control (RBAC)
```python
# Three roles: ADMIN, FACULTY, STUDENT
# Permissions enforced at:
# - ViewSet level (permission_classes)
# - Object level (has_object_permission)
# - Queryset level (get_queryset filtering)
```

### 2. UUID Primary Keys
```python
# All models use UUID instead of auto-incrementing integers
id = models.UUIDField(primary_key=True, default=uuid.uuid4)
```

### 3. Soft Delete Pattern
```python
# Models have is_active flag instead of deleting
is_active = models.BooleanField(default=True)
```

### 4. Audit Trail
```python
# All models have timestamps
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)

# Plus AuditLog model for operations
```

### 5. Attempt Tracking
```python
# StudentResult tracks multiple attempts
attempt_number = models.IntegerField(default=1)
is_latest = models.BooleanField(default=True)
```

### 6. Context Manager for Scraper
```python
# Clean resource management
with VTUResultScraper() as scraper:
    result = scraper.scrape_result(usn, user)
```

---

## Data Flow

### 1. Scraping Flow
```
User Request
    ↓
API Endpoint (POST /api/scraper/scrape/)
    ↓
ScraperViewSet.scrape()
    ↓
VTUResultScraper.scrape_result()
    ↓
├─> _solve_captcha_and_login()
│   ├─> _extract_captcha_text()
│   └─> Submit USN
│
├─> _parse_result_page()
│   └─> Extract all subject results
│
└─> _save_to_database()
    ├─> Create/Update Student
    ├─> Create/Update Subjects
    ├─> Create StudentResult entries
    └─> Create ScrapeLog
```

### 2. Analytics Flow
```
API Request
    ↓
AnalyticsViewSet.dashboard()
    ↓
Role-based filtering
    ↓
├─> ADMIN: All students, all analytics
├─> FACULTY: Department students, dept analytics
└─> STUDENT: Own data, own analytics
    ↓
Calculate metrics
    ↓
Return response
```

### 3. CGPA Calculation Flow
```
Student.calculate_cgpa()
    ↓
Get all latest results (is_latest=True)
    ↓
For each result:
    grade_point × credits
    ↓
Sum(grade_point × credits) / Sum(credits)
    ↓
Return CGPA
```

---

## Testing Structure

```
tests/
├── test_models.py           # Model tests
├── test_serializers.py      # Serializer tests
├── test_views.py            # View tests
├── test_permissions.py      # Permission tests
├── test_scraper.py          # Scraper tests
└── fixtures/                # Test data
    ├── departments.json
    ├── subjects.json
    └── students.json
```

---

## Deployment Structure (Production)

```
/var/www/unismart/
├── unismart-backend/        # Application code
├── venv/                    # Virtual environment
├── staticfiles/             # Collected static files
├── media/                   # User uploads
├── logs/                    # Application logs
├── .env                     # Environment variables
└── gunicorn/                # Gunicorn config
    └── gunicorn.conf.py
```

---

## Code Metrics

- **Total Models**: 12
- **Total ViewSets**: 8
- **Total Serializers**: 20+
- **Total Permission Classes**: 8
- **Total API Endpoints**: 50+
- **Lines of Code**: ~5000+

---

## Best Practices Implemented

1. ✅ UUID primary keys for security
2. ✅ Comprehensive indexing for performance
3. ✅ Role-based access control
4. ✅ Audit logging
5. ✅ Environment variables for configuration
6. ✅ Logging for debugging
7. ✅ Transaction handling
8. ✅ Error handling
9. ✅ Code documentation
10. ✅ DRY principle
11. ✅ RESTful API design
12. ✅ Proper validation

---

## Future Enhancements

Planned features:
- [ ] Celery for async scraping
- [ ] Redis caching
- [ ] GraphQL API
- [ ] WebSocket notifications
- [ ] Advanced analytics with charts
- [ ] PDF transcript generation
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Comprehensive test coverage

---

**Project Status**: ✅ Production Ready
