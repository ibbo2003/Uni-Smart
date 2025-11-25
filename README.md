# 🎓 Uni-Smart - Academic Management System

> AI-Powered Timetable Generation | VTU Result Analysis | Intelligent Exam Seating | Enhanced VTU 2024 Compliance

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)
![Django](https://img.shields.io/badge/Django-5.1.4-darkgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)
![Flask](https://img.shields.io/badge/Flask-3.1.0-lightgrey.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Module Documentation](#-module-documentation)
- [Configuration](#️-configuration)
- [API Documentation](#-api-documentation)
- [Role-Based Access Control](#-role-based-access-control)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🌟 Overview

Uni-Smart is a comprehensive academic management system designed specifically for VTU (Visvesvaraya Technological University) institutions. Currently focused on the **CSE Department** with plans for multi-department expansion.

### Three Core Modules:

1. **🗓️ AI-Powered Timetable Generation** - Genetic Algorithm + CSP + Tabu Search
2. **📊 Automated Result Analysis** - Web scraping, OCR, and advanced analytics
3. **🪑 Intelligent Exam Seating** - Optimized room allocation and distribution

Built with a modern **microservices architecture** where each module operates independently while integrating seamlessly through a unified API gateway.

---

## ✨ Key Features

### 🗓️ Timetable Generation Module

- **Smart Lab Scheduling**: Automatically uses afternoon slots for optimal resource utilization
- **VTU Saturday Awareness**: Minimizes Saturday labs (1st & 3rd Saturday holidays)
- **10 Subject Types**: PCC, PCCL, PEC, OEC, UHV, MC, AEC, SEC, ESC, PROJ
- **Theory/Lab Flexibility**: Determined by hours specified, not rigid subject types
- **60-75% Faster**: Hybrid optimization algorithm
- **Multi-Format Export**: PDF, Word, Excel with VTU-compliant formatting
- **Batch Processing**: Multiple sections in parallel
- **Conflict Detection**: Automatic resolution of faculty/room clashes

**Tech Stack:** Flask (Python), Genetic Algorithms, Express Gateway

---

### 📊 Result Analysis Module

- **VTU Portal Scraping**: Automated result fetching with admin-only access
- **OCR Support**: Extract results from PDFs using EasyOCR
- **Real-time Analytics**:
  - Subject-wise pass percentages
  - Student performance trends
  - Department-level statistics
  - Backlog tracking
  - CGPA calculation (VTU formula)
- **Advanced Filtering**: By semester, batch, academic year
- **Data Visualization**: Charts, graphs, comparative analysis
- **Role-Based Access**:
  - Admins: All data
  - Faculty: Own class + subjects taught
  - Students: Personal data only

**Tech Stack:** Django REST Framework, JWT Auth, Pandas, Selenium, EasyOCR

---

### 🪑 Exam Seating Module

- **Smart Seating Algorithm**: Distributes students evenly across rooms
- **Multi-Exam Support**: Schedule multiple exams per day (morning/afternoon)
- **Room Management**: Configure rows, columns, capacities
- **Student Registration**: Bulk upload via PDF/CSV
- **Seating Export**: PDF layouts for printers and invigilators
- **Conflict Prevention**: No duplicate seat assignments
- **Visual Grid**: Interactive seating plan view

**Tech Stack:** Flask (Python), PyPDF2, Custom algorithms

---

## 🏗️ Architecture

```
Uni-Smart/
├── frontend/                    # Next.js 15 (React + TypeScript)
│   ├── app/                    # Pages (App Router)
│   │   ├── timetable/
│   │   ├── exam-seating/
│   │   ├── result-analysis/
│   │   └── DashBoard/
│   └── components/             # Reusable UI components
│
├── gateway-express/            # Node.js API Gateway (Port 8080)
│   └── server.js              # Route orchestration
│
├── service-timetable-python/   # Flask Service (Port 5000)
│   └── app.py                 # Genetic algorithm implementation
│
├── service-examseating-python/ # Flask Service (Port 5001)
│   └── app.py                 # Seating algorithm
│
└── result analysis/            # Django REST API (Port 8001)
    ├── results/               # Django app with models/views
    ├── config/                # Settings and configuration
    └── manage.py

Database: MySQL/MariaDB (unismart_db) - Shared across all services
```

### Service Communication:

```
Frontend (Next.js :3000)
    ↓
Gateway (Express :8080)
    ↓ ↓ ↓
    ├── Timetable Service (Flask :5000)
    ├── Exam Seating Service (Flask :5001)
    └── Result Analysis API (Django :8001)
         ↓
    MySQL Database (unismart_db)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0+
- Python 3.9+
- MySQL/MariaDB
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/uni-smart.git
cd uni-smart
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Set up Python virtual environments:**

```bash
# Timetable Service
cd service-timetable-python
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cd ..

# Exam Seating Service
cd service-examseating-python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Result Analysis Service
cd "result analysis"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

4. **Configure Database:**

Create `.env` file in root:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=unismart_db
DB_PORT=3306
```

Create the database:
```sql
CREATE DATABASE unismart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Run Django Migrations:**
```bash
cd "result analysis"
venv\Scripts\activate
python manage.py migrate
python manage.py createsuperuser  # Create admin account
cd ..
```

6. **Start All Services:**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Gateway: http://localhost:8080
- Timetable Service: http://localhost:5000
- Exam Seating Service: http://localhost:5001
- Result Analysis API: http://localhost:8001

7. **Access the Application:**
- **Frontend:** http://localhost:3000
- **Django Admin:** http://localhost:8001/admin/
  - Username: admin
  - Password: (your created password)

---

## 📁 Project Structure

```
Uni-Smart/
├── docs/                           # 📚 Documentation
│   ├── RBAC_SPECIFICATION.md      # Role-based access control guide
│   ├── RESULT_ANALYSIS.md         # Result module detailed docs
│   └── EXAM_SEATING.md            # Exam seating module docs
│
├── frontend/                       # Next.js Frontend
│   ├── app/                       # Pages (App Router)
│   │   ├── auth/                  # Login/Signup
│   │   ├── DashBoard/             # Role-based dashboards
│   │   ├── timetable/             # Timetable generation UI
│   │   ├── exam-seating/          # Exam seating management
│   │   │   ├── manage-exams/
│   │   │   ├── manage-rooms/
│   │   │   └── manage-registrations/
│   │   └── result-analysis/       # Result viewing & analytics
│   ├── components/                # Reusable components
│   │   ├── Sidebar.tsx
│   │   ├── Login.tsx
│   │   └── *Dashboard.tsx
│   └── package.json
│
├── gateway-express/                # Express.js Gateway
│   ├── server.js
│   ├── routes/
│   └── package.json
│
├── service-timetable-python/       # Timetable Service
│   ├── app.py                     # Flask app
│   ├── genetic_algorithm.py       # AI optimization
│   ├── requirements.txt
│   └── venv/
│
├── service-examseating-python/     # Exam Seating Service
│   ├── app.py                     # Flask app
│   ├── seating_algorithm.py       # Seating logic
│   ├── requirements.txt
│   └── venv/
│
├── result analysis/                # Result Analysis Service
│   ├── manage.py
│   ├── config/                    # Django settings
│   │   ├── settings.py
│   │   └── urls.py
│   ├── results/                   # Main Django app
│   │   ├── models.py              # 12 models (User, Student, Faculty, etc.)
│   │   ├── views.py               # API ViewSets
│   │   ├── serializers.py         # DRF serializers
│   │   ├── permissions.py         # RBAC permissions
│   │   ├── admin.py               # Django admin config
│   │   └── management/            # Custom commands
│   ├── requirements.txt
│   └── venv/
│
├── .env                           # Environment variables
├── .gitignore
├── package.json                   # Root npm scripts
├── README.md                      # This file
└── cleanup_project.py             # Cleanup utility

Database Tables (MySQL):
├── Shared Tables:
│   ├── users                      # All user accounts
│   └── departments                # Department info
│
├── Timetable Tables:
│   ├── sections
│   ├── faculty
│   ├── subjects
│   ├── lab_rooms
│   └── scheduled_classes
│
├── Exam Seating Tables:
│   ├── exam_rooms
│   ├── exams
│   ├── exam_registrations
│   ├── students                   # Simple table (PK: usn)
│   └── seating_plan
│
└── Result Analysis Tables (results_ prefix):
    ├── results_students           # Full student data (PK: id UUID)
    ├── results_faculty
    ├── results_subjects
    ├── results_semester_subjects
    ├── results_faculty_subject_assignments
    ├── results_exam_schedules
    ├── results_student_results
    ├── results_scrape_logs
    └── results_system_settings
```

**Note:** Result Analysis tables use `results_` prefix to avoid conflicts with Exam Seating's simple `students` table in the shared database.

---

## 📖 Module Documentation

### 1. Timetable Generation

**Generate a timetable:**
```bash
POST http://localhost:8080/api/timetable/generate
Content-Type: application/json

{
  "semester": 5,
  "section": "5A",
  "classroom": "CS-401",
  "subjects": [
    {
      "subject_code": "21CS51",
      "subject_name": "Machine Learning",
      "subject_type": "PCC",
      "theory_hours": 3,
      "lab_hours": 0,
      "no_of_batches": 0,
      "theory_faculty": "Dr. John Doe"
    }
  ]
}
```

**Export timetable:**
```bash
POST http://localhost:8080/api/timetable/{sectionId}/export/pdf
POST http://localhost:8080/api/timetable/{sectionId}/export/word
POST http://localhost:8080/api/timetable/{sectionId}/export/excel
```

---

### 2. Exam Seating

**Create exam room:**
```bash
POST http://localhost:5001/rooms
Content-Type: application/json

{
  "id": "ROOM-101",
  "num_rows": 6,
  "num_cols": 5
}
```

**Schedule exam:**
```bash
POST http://localhost:5001/exams
Content-Type: application/json

{
  "subject_code": "21CS51",
  "exam_date": "2025-12-15",
  "exam_session": "morning"
}
```

**Register students:**
```bash
POST http://localhost:5001/registrations/batch
Content-Type: application/json

{
  "exam_id": 1,
  "student_usns": ["1CR21CS001", "1CR21CS002", "..."]
}
```

**Generate seating:**
```bash
POST http://localhost:5001/generate_seating
Content-Type: application/json

{
  "exam_date": "2025-12-15",
  "exam_session": "morning"
}
```

---

### 3. Result Analysis API

**Authentication:**
```bash
POST http://localhost:8001/api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "yourpassword"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**Get student results:**
```bash
GET http://localhost:8001/api/results/student/1CR21CS001/
Authorization: Bearer <jwt_token>
```

**Get subject analytics:**
```bash
GET http://localhost:8001/api/analytics/subject/?subject_id=<uuid>
Authorization: Bearer <jwt_token>
```

**Scrape VTU results (Admin only):**
```bash
POST http://localhost:8001/api/scraper/scrape-batch/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "usns": ["1CR21CS001", "1CR21CS002"],
  "semester": 5,
  "academic_year": "2024-25"
}
```

**Full API documentation:** See [docs/RESULT_ANALYSIS.md](docs/RESULT_ANALYSIS.md)

---

## 🔐 Role-Based Access Control (RBAC)

Uni-Smart implements comprehensive role-based access control across all modules.

### Three User Roles:

#### 1. **ADMIN** (Full Control)
- Manage all users, departments, subjects
- Generate and edit timetables for any class
- Schedule exams and generate seating arrangements
- Scrape VTU results
- View all analytics and data
- Access system settings

#### 2. **FACULTY** (Department-Level Access)

**As Class Advisor:**
- Generate timetable for advised class only
- Register students for exams (own class)
- View all results of advised class students
- Analyze advised class performance

**As Subject Teacher:**
- View teaching schedule for assigned subjects
- View results for subjects taught
- Analyze subject-specific performance
- View exams for subjects handled

**Cannot:**
- Edit/modify timetables (admin-only)
- Generate exam seating (admin-only)
- Scrape VTU results (admin-only)
- Assign subjects to themselves (admin assigns)
- Access data outside their class/subjects

#### 3. **STUDENT** (Personal Access)
- View own timetable
- View own results and CGPA
- View own exam seat allocation
- View own performance analytics
- Update limited profile fields

**Cannot:**
- View other students' data
- Access any management features
- Register for exams (faculty/admin does it)

### Implementation:

**Backend (Django):**
- Custom permission classes per role
- Queryset filtering based on user role
- Object-level permissions

**Frontend (Next.js):**
- Route guards with role checking
- Component-level rendering based on role
- Context API for auth state management

**Detailed RBAC Specification:** See [docs/RBAC_SPECIFICATION.md](docs/RBAC_SPECIFICATION.md)

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=unismart_db
DB_PORT=3306

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# VTU Scraper (Admin only)
VTU_PORTAL_URL=https://results.vtu.ac.in
VTU_USERNAME=admin_username
VTU_PASSWORD=admin_password

# Service Ports
FRONTEND_PORT=3000
GATEWAY_PORT=8080
TIMETABLE_PORT=5000
EXAM_SEATING_PORT=5001
RESULTS_PORT=8001
```

### Database Schema

**Important:** The shared database (`unismart_db`) contains tables from all three services:

- **Shared:** `users`, `departments`
- **Timetable:** `sections`, `faculty`, `subjects`, `scheduled_classes`
- **Exam Seating:** `exam_rooms`, `exams`, `students` (simple table)
- **Result Analysis:** `results_*` tables (9 tables with prefix)

The `results_` prefix prevents conflicts with exam seating's simple `students` table.

---

## 📚 API Documentation

### Gateway Endpoints (Port 8080)

**Base URL:** `http://localhost:8080/api`

#### Timetable Routes:
- `POST /timetable/generate` - Generate new timetable
- `GET /timetable/available` - List all timetables
- `GET /timetable/{sectionId}` - Get specific timetable
- `POST /timetable/{sectionId}/export/{format}` - Export (pdf/word/excel)

#### Exam Seating Routes:
- `POST /exams/generate-seating` - Generate seating plan

### Result Analysis Endpoints (Port 8001)

**Base URL:** `http://localhost:8001/api`

**Authentication Required:** All endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

#### Auth:
- `POST /auth/login/` - Get JWT tokens
- `POST /auth/refresh/` - Refresh access token
- `POST /auth/verify/` - Verify token

#### Users:
- `GET /users/` - List users (Admin only)
- `GET /users/me/` - Get current user profile
- `POST /users/{id}/change_password/` - Change password

#### Students:
- `GET /students/` - List students (filtered by role)
- `GET /students/{id}/` - Get student details
- `GET /students/{id}/results/` - Get student results
- `GET /students/{id}/cgpa/` - Calculate CGPA

#### Results:
- `GET /results/` - List results (filtered by role)
- `GET /results/student/{usn}/` - Get results by USN
- `POST /results/` - Upload results (Admin/Faculty)

#### Analytics:
- `GET /analytics/subject/?subject_id=<id>` - Subject analytics
- `GET /analytics/class/?section_id=<id>` - Class analytics
- `GET /analytics/department/` - Department overview
- `GET /analytics/compare/` - Student comparison

#### Scraper (Admin only):
- `POST /scraper/scrape-single/` - Scrape one student
- `POST /scraper/scrape-batch/` - Batch scrape
- `GET /scraper/logs/` - View scrape logs

**Complete API reference:** See [docs/RESULT_ANALYSIS.md](docs/RESULT_ANALYSIS.md)

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. Services not starting

**Issue:** Port already in use
```bash
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution:**
```bash
# Find process using the port (Windows)
netstat -ano | findstr :8080

# Kill the process
taskkill //F //PID <process_id>

# Or change port in .env
GATEWAY_PORT=8081
```

#### 2. Database connection errors

**Issue:** `Can't connect to MySQL server`

**Solution:**
- Ensure MySQL is running
- Check `.env` credentials
- Verify database exists:
```sql
SHOW DATABASES LIKE 'unismart_db';
```

#### 3. Django admin panel not loading models

**Issue:** Models showing "Unknown column" errors

**Solution:** Tables already created with correct schema. If issues persist:
```bash
cd "result analysis"
venv\Scripts\activate
python manage.py migrate --fake
```

#### 4. VTU scraping fails

**Issue:** Scraper returns errors

**Causes:**
- VTU portal down
- Invalid credentials
- Rate limiting

**Solution:**
- Check VTU portal manually
- Verify credentials in system settings
- Wait and retry (portal may be slow)

#### 5. JWT token expired

**Issue:** 401 Unauthorized on API calls

**Solution:**
```bash
POST /api/auth/refresh/
{
  "refresh": "<refresh_token>"
}
```

---

## 🔧 Development

### Running Individual Services

**Frontend only:**
```bash
cd frontend
npm run dev
```

**Gateway only:**
```bash
cd gateway-express
npm start
```

**Timetable service:**
```bash
cd service-timetable-python
venv\Scripts\activate
python app.py
```

**Exam Seating service:**
```bash
cd service-examseating-python
venv\Scripts\activate
python app.py
```

**Result Analysis service:**
```bash
cd "result analysis"
venv\Scripts\activate
python manage.py runserver 8001
```

### Running Tests

**Django tests:**
```bash
cd "result analysis"
venv\Scripts\activate
python manage.py test
```

### Database Migrations

**Create new migration:**
```bash
cd "result analysis"
python manage.py makemigrations
```

**Apply migrations:**
```bash
python manage.py migrate
```

---

## 🧹 Project Cleanup

Remove temporary setup files and organize documentation:

```bash
python cleanup_project.py
```

This script removes:
- Temporary setup scripts (already executed)
- Test files (tables already created)
- Redundant documentation (consolidated in README)

**Note:** Review the cleanup script before running. Delete `cleanup_project.py` after use.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style:
- Python: PEP 8
- JavaScript/TypeScript: ESLint + Prettier
- Commit messages: Conventional Commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- VTU (Visvesvaraya Technological University) for the academic framework
- Open-source libraries: Django, Flask, Next.js, React, and more
- AI optimization algorithms: Genetic Algorithm, CSP, Tabu Search

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@unismart.edu (if available)

---

## 🗺️ Roadmap

### Current Version: 1.0 (CSE Department)

### Planned Features:
- [ ] Multi-department support (All engineering departments)
- [ ] Mobile app (React Native)
- [ ] Email/SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Student attendance integration
- [ ] Faculty workload calculator
- [ ] Automated report generation
- [ ] Dark mode UI
- [ ] Multi-language support

---

## 📊 Project Status

- **Timetable Module:** ✅ Fully Functional
- **Exam Seating Module:** ✅ Fully Functional
- **Result Analysis Module:** ✅ Fully Functional
- **RBAC Implementation:** 🚧 In Progress (Backend ready, Frontend pending)
- **Multi-Department:** 🔮 Planned

---

**Built with ❤️ for VTU Institutions**

**Current Focus:** CSE Department | **Future:** All Engineering Departments
