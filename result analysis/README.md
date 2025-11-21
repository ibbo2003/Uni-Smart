# UniSmart Result Analysis Module

A comprehensive Django REST Framework backend for managing VTU (Visvesvaraya Technological University) student results with automated scraping, analytics, and role-based access control.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0+-green.svg)
![DRF](https://img.shields.io/badge/DRF-3.14+-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Features
- **Automated Result Scraping**: Extract student results from VTU portal with CAPTCHA solving
- **Role-Based Access Control**: Admin, Faculty, and Student roles with granular permissions
- **Comprehensive Analytics**: CGPA, SGPA, performance trends, and backlog tracking
- **RESTful API**: Full-featured API with JWT authentication
- **Django Admin Interface**: Easy data management through admin panel

### Academic Features
- **Student Management**: Complete student profiles with academic history
- **Result Tracking**: Track results across semesters with attempt history
- **Backlog Management**: Automatic identification and tracking of failed subjects
- **Performance Analytics**: Department-wise, subject-wise, and student-wise analytics
- **Grade Calculation**: Automatic grade and grade point calculation
- **Audit Course Support**: Handle VTU Audit Courses (credited but excluded from CGPA)
- **Multiple Subject Types**: Theory, Lab, Project, Internship, Seminar, Non-Credit, and Audit

### Technical Features
- **CAPTCHA Solving**: Automated CAPTCHA solving using EasyOCR
- **Batch Processing**: Scrape multiple USNs in one operation
- **Dynamic Configuration**: VTU portal URL managed dynamically via database
- **System Settings API**: RESTful API for managing system configurations
- **Audit Logging**: Comprehensive audit trail for all operations
- **Export Capabilities**: Export data to CSV, Excel, and PDF formats
- **Database Optimization**: Proper indexing for high performance
- **Management Commands**: Custom Django commands for admin tasks

---

## 🛠 Technology Stack

### Backend
- **Framework**: Django 5.0+
- **API**: Django REST Framework 3.14+
- **Database**: MySQL 8.0+
- **Authentication**: JWT (djangorestframework-simplejwt)

### Scraping & OCR
- **Web Automation**: Selenium 4.x
- **CAPTCHA Solving**: EasyOCR 1.7+
- **Image Processing**: OpenCV 4.9+
- **Browser Driver**: Chrome WebDriver (auto-managed)

### Data Processing
- **Excel/CSV**: Pandas, OpenPyxl, XlsxWriter
- **PDF Generation**: ReportLab
- **Data Analysis**: NumPy

### Additional
- **Filtering**: django-filter
- **CORS**: django-cors-headers
- **Environment**: python-dotenv

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│         (Web App, Mobile App, Admin Panel)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/JWT
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Django REST Framework                      │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  ViewSets    │ Serializers  │   Permissions            │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │    Models    │   Services   │    Validators            │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┬─────────────────┐
         ▼                           ▼                 ▼
┌─────────────────┐      ┌──────────────────┐  ┌──────────────┐
│  MySQL Database │      │  VTU Scraper     │  │ File Storage │
│  (Student Data, │      │  (Selenium +     │  │  (Media,     │
│   Results,      │      │   EasyOCR)       │  │   Exports)   │
│   Analytics)    │      │                  │  │              │
└─────────────────┘      └──────────────────┘  └──────────────┘
```

### Database Schema
- **13 Core Models**: User, Department, Subject, SemesterSubject, Student, Faculty, FacultySubjectAssignment, ExamSchedule, StudentResult, ScrapeLog, AuditLog, SystemSettings
- **UUID Primary Keys**: All models use UUID for better security
- **Optimized Indexing**: Strategic indexes for high performance
- **Referential Integrity**: Proper foreign key relationships
- **Real-time Analytics**: Calculated on-the-fly from actual data (no pre-computed tables)

---

## 📦 Installation

### Prerequisites
- Python 3.10 or higher
- MySQL 8.0 or higher
- Chrome browser (for scraping)
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/unismart-backend.git
cd unismart-backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Install EasyOCR Models
```bash
# This will download OCR models (~500MB)
python -c "import easyocr; reader = easyocr.Reader(['en'])"
```

---

## ⚙️ Configuration

### Step 1: Create Environment File
```bash
cp .env.example .env
```

### Step 2: Edit .env File
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=unismart_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# CORS (for frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Scraper
SCRAPER_HEADLESS=True
SCRAPER_MAX_CAPTCHA_ATTEMPTS=5
```

### Step 3: Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 🗄 Database Setup

### Step 1: Create MySQL Database
```sql
CREATE DATABASE unismart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'unismart_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON unismart_db.* TO 'unismart_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 3: Create Superuser
```bash
python manage.py createsuperuser
```

### Step 4: Initialize System Settings
```bash
# Initialize default VTU portal URL and other settings
python manage.py init_settings
```

### Step 5: Load Initial Data (Optional)
```bash
# Create sample departments
python manage.py shell
```

```python
from results.models import Department

Department.objects.create(code='CS', name='Computer Science & Engineering')
Department.objects.create(code='EC', name='Electronics & Communication Engineering')
Department.objects.create(code='ME', name='Mechanical Engineering')
Department.objects.create(code='CV', name='Civil Engineering')
```

### Step 6: Migrate Existing Audit Courses (If Upgrading)
```bash
# If you have existing data, migrate subjects to Audit Course type
python manage.py migrate_audit_courses
```

---

## 🚀 Running the Application

### Development Server
```bash
python manage.py runserver
```

The server will start at `http://127.0.0.1:8000/`

### Access Points
- **API Root**: http://127.0.0.1:8000/api/
- **Admin Panel**: http://127.0.0.1:8000/admin/
- **API Documentation**: http://127.0.0.1:8000/api/ (DRF Browsable API)

### Create Test Data
```bash
python manage.py shell
```

```python
from results.scraper_service import scrape_single_usn
from results.models import User

# Get admin user
admin = User.objects.filter(role='ADMIN').first()

# Scrape a test USN (replace with valid VTU USN)
result = scrape_single_usn('2AB22CS008', admin, headless=False)
print(result)
```

---

## 📚 API Documentation

### 📦 Postman Collection Available!

**Quick API Testing:**
1. Import `UniSmart_API.postman_collection.json` into Postman
2. Import `UniSmart_Environment.postman_environment.json`
3. Run "Login" request to get token
4. Start testing all endpoints!

**Features:**
- ✅ 35+ pre-configured requests
- ✅ Automatic token management
- ✅ Test scripts included
- ✅ Example responses
- ✅ Complete documentation

**See:** [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md) for detailed instructions

### Authentication

#### Obtain JWT Token
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Core Endpoints

#### Departments
- `GET /api/departments/` - List all departments
- `POST /api/departments/` - Create department (Admin only)
- `GET /api/departments/{id}/` - Get department details
- `GET /api/departments/{id}/subjects/` - Get department subjects
- `GET /api/departments/{id}/students/` - Get department students
- `GET /api/departments/{id}/performance/` - Get department analytics

#### Students
- `GET /api/students/` - List students (filtered by role)
- `GET /api/students/{id}/` - Get student details
- `GET /api/students/{id}/results/` - Get student results grouped by semester
- `GET /api/students/{id}/analytics/` - Get student analytics (CGPA, SGPA, backlogs)
- `GET /api/students/{id}/transcript/` - Get full academic transcript

#### Subjects
- `GET /api/subjects/` - List all subjects
- `POST /api/subjects/` - Create subject (Admin only)
- `GET /api/subjects/{id}/` - Get subject details
- `GET /api/subjects/{id}/results/` - Get all results for subject
- `GET /api/subjects/{id}/analytics/` - Get subject performance analytics

#### Results
- `GET /api/results/` - List results (filtered by role)
- `GET /api/results/{id}/` - Get result details
- `POST /api/results/` - Create result (Admin only)

#### Scraper (Admin Only)
- `POST /api/scraper/scrape/` - Scrape results
- `GET /api/scraper/logs/` - View scrape logs

#### Analytics
- `GET /api/analytics/dashboard/` - Get dashboard statistics (role-based)
- `GET /api/analytics/performance_trends/` - Get performance trends

#### System Settings (Admin Only)
- `GET /api/settings/` - List all system settings
- `GET /api/settings/vtu-link/` - Get current VTU portal URL
- `PUT /api/settings/vtu-link/update/` - Update VTU portal URL

### Example Requests

#### Scrape Single USN
```bash
curl -X POST http://localhost:8000/api/scraper/scrape/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"usn": "2AB22CS008"}'
```

#### Scrape Multiple USNs
```bash
curl -X POST http://localhost:8000/api/scraper/scrape/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"usn_list": ["2AB22CS008", "2AB22CS009", "2AB22CS010"]}'
```

#### Get Student Analytics
```bash
curl -X GET http://localhost:8000/api/students/{student-id}/analytics/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get VTU Portal URL
```bash
curl -X GET http://localhost:8000/api/settings/vtu-link/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update VTU Portal URL (Admin Only)
```bash
curl -X PUT http://localhost:8000/api/settings/vtu-link/update/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}'
```

---

## 🧪 Testing

### Run Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=results --cov-report=html
```

### Test Scraper Manually
```bash
python manage.py shell
```

```python
from results.scraper_service import VTUResultScraper
from results.models import User

admin = User.objects.filter(role='ADMIN').first()

with VTUResultScraper(headless=False) as scraper:
    result = scraper.scrape_result('2AB22CS008', admin)
    print(result)
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Set `DEBUG=False` in .env
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Setup production database (MySQL)
- [ ] Configure static files with WhiteNoise
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure proper CORS settings
- [ ] Setup error monitoring (Sentry)
- [ ] Configure email settings
- [ ] Setup backup strategy
- [ ] Run `python manage.py collectstatic`

### Using Gunicorn
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Using Docker (Optional)
```dockerfile
# Dockerfile example
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## 📚 Subject Types & Audit Courses

The system supports multiple subject types as per VTU regulations:

### Subject Type Comparison

| Type | Credits | Internal Marks | External Marks | Pass Criteria | Included in CGPA | Examples |
|------|---------|----------------|----------------|---------------|------------------|----------|
| **THEORY** | 3-4 | 20 | 80 | IA≥7, Ext≥28, Total≥40 | ✅ Yes | BCS601, BCS602 |
| **LAB** | 2-3 | 20 | 80 | IA≥7, Ext≥28, Total≥40 | ✅ Yes | BCSL606 |
| **PROJECT** | 1-2 | 0 | 100 | Total≥40 | ✅ Yes | BCS685 |
| **INTERNSHIP** | 2 | 50 | 50 | Total≥40 | ✅ Yes | Internship |
| **SEMINAR** | 1 | 100 | 0 | Total≥40 | ✅ Yes | Seminar |
| **NON_CREDIT** | 0 | 100 | 0 | Total≥35 | ❌ No | Yoga (BYOK), IKS (BIKS) |
| **AUDIT** | 1 | 100 | 0 | Total≥35 | ❌ No | Environmental Studies (BES), Constitution (BCIV) |

### Understanding Audit Courses

**What are Audit Courses?**
- Audit courses are unique VTU courses that carry credits but are **NOT included in CGPA/SGPA calculations**
- Students must pass these courses (≥35 marks) to graduate
- They appear on transcripts with grades but don't affect GPA
- Examples: Environmental Studies (BES), Constitution of India (BCIV)

**Key Differences:**
```
Non-Credit Mandatory:
✓ 0 credits
✓ Pass/Fail only
✓ Not in CGPA
✓ Examples: Yoga, Physical Education, IKS

Audit Courses:
✓ Have credits (typically 1)
✓ Graded (O/S/A/B/C/D/E/F)
✓ Not in CGPA (per VTU rules)
✓ Examples: Environmental Studies, Constitution
```

### Auto-Detection

The scraper automatically detects subject types based on:
- **Keywords**: ENVIRONMENTAL, CONSTITUTION, YOGA, LAB, PROJECT, etc.
- **Subject Codes**: BES, BCIV, BYOK, BIKS, BCSL, etc.
- **Naming Patterns**: Laboratory, Project Work, Internship, etc.

---

## 📊 Key Features Deep Dive

### CGPA/SGPA Calculation
The system automatically calculates:
- **CGPA**: Cumulative Grade Point Average across all semesters
- **SGPA**: Semester Grade Point Average for each semester
- **Grade Points**: Based on VTU grading system (O=10, S=9, A=8, B=7, C=6, D=5, E=4, F=0)
- **Exclusions**: Non-Credit Mandatory and Audit courses are excluded from GPA calculations per VTU rules

### Backlog Tracking
- Automatically identifies failed subjects
- Tracks multiple attempts for same subject
- Marks latest attempt with `is_latest=True`
- Provides backlog count and details in student analytics

### Role-Based Access Control

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| View All Students | ✅ | Department Only | Own Data |
| Scrape Results | ✅ | ❌ | ❌ |
| View Analytics | ✅ | Department | Own Data |
| Manage Data | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | Own Data |

### Dynamic VTU Portal Management

**Problem Solved:**
VTU changes their results portal URL every semester (e.g., JJEcbcs25 → JJEcbcs26). Previously, this required code changes and redeployment.

**Solution:**
- VTU portal URL stored in database (`system_settings` table)
- Update via Django Admin, API, or management command
- No code changes or redeployment needed
- Automatic retrieval by scraper on initialization

**Update Methods:**

**1. Django Admin Panel**
```
Login → System Settings → VTU_RESULTS_URL → Edit → Save
```

**2. REST API (Admin Only)**
```http
PUT /api/settings/vtu-link/update/
{
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php"
}
```

**3. Management Command**
```bash
python manage.py shell
from results.models import SystemSettings
SystemSettings.set_setting('VTU_RESULTS_URL', 'new-url')
```

**4. Django Shell**
```python
from results.models import SystemSettings
url = SystemSettings.get_setting('VTU_RESULTS_URL')
print(f"Current URL: {url}")
```

### Management Commands

The system includes custom management commands for admin tasks:

**Initialize System Settings**
```bash
python manage.py init_settings
```
- Creates default VTU portal URL
- Run once after initial migration
- Safe to run multiple times (idempotent)

**Migrate Audit Courses**
```bash
python manage.py migrate_audit_courses
```
- Migrates existing subjects to Audit type
- Updates BES, BCIV subjects automatically
- Recalculates all affected student results
- Use when upgrading from older versions

---

## 🔧 Troubleshooting

### CAPTCHA Solving Issues
If CAPTCHA solving fails frequently:
1. Increase `SCRAPER_MAX_CAPTCHA_ATTEMPTS` in .env
2. Run scraper in non-headless mode: `SCRAPER_HEADLESS=False`
3. Check Chrome and ChromeDriver versions

### Database Connection Errors
```bash
# Check MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;
```

### Import Errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

---

## 📝 API Response Examples

### Student Analytics Response
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
    "S": 5,
    "A": 10,
    "B": 8,
    "C": 2,
    "D": 0,
    "E": 0,
    "F": 1
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- VTU for the education system
- Django and DRF communities
- EasyOCR for CAPTCHA solving
- Selenium for web automation

---

## 📞 Support

For support, email support@unismart.com or open an issue on GitHub.

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time notifications for new results
- [ ] Mobile app integration
- [ ] Advanced analytics with graphs and charts
- [ ] Batch export to PDF with custom templates
- [ ] Email notifications for result updates
- [ ] Celery integration for async scraping
- [ ] Redis caching for performance optimization
- [ ] GraphQL API alongside REST
- [ ] WebSocket for real-time updates
- [ ] Multi-semester comparison reports
- [ ] Predictive analytics using ML

### Recently Implemented ✅
- [x] Audit Course support with CGPA exclusion
- [x] Dynamic VTU portal URL management
- [x] System settings API and admin interface
- [x] Real-time analytics (no pre-computed tables)
- [x] Management commands for admin tasks

---

**Made with ❤️ for VTU Students**
