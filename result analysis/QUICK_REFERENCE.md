# UniSmart Quick Reference Guide

Fast reference for common tasks and commands.

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and navigate
git clone <repo-url>
cd unismart-backend

# 2. Setup environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure
cp .env.example .env
# Edit .env with your database credentials

# 5. Setup database
python manage.py migrate
python manage.py createsuperuser

# 6. Initialize system settings
python manage.py init_settings

# 7. Run server
python manage.py runserver

# 8. Access
# Admin: http://127.0.0.1:8000/admin/
# API: http://127.0.0.1:8000/api/
```

---

## 📝 Common Commands

### Development
```bash
# Start server
python manage.py runserver

# Start on different port
python manage.py runserver 8001

# Run in background (Linux/Mac)
nohup python manage.py runserver &

# Django shell
python manage.py shell
```

### Database
```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations

# Reset database (careful!)
python manage.py flush

# Backup database
mysqldump -u root -p unismart_db > backup.sql

# Restore database
mysql -u root -p unismart_db < backup.sql
```

### Users
```bash
# Create superuser
python manage.py createsuperuser

# Change password
python manage.py changepassword username
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=results

# Run specific test
pytest tests/test_models.py::TestStudentModel
```

---

## 🔑 API Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass"}'

# Use token
curl -X GET http://localhost:8000/api/students/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Endpoints
```bash
# List students
GET /api/students/

# Get student details
GET /api/students/{id}/

# Student results
GET /api/students/{id}/results/

# Student analytics
GET /api/students/{id}/analytics/

# Scrape USN
POST /api/scraper/scrape/
Body: {"usn": "2AB22CS008"}

# Dashboard
GET /api/analytics/dashboard/

# System Settings (NEW!)
GET /api/settings/vtu-link/
PUT /api/settings/vtu-link/update/
Body: {"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}
```

---

## ⚙️ System Settings Management (NEW!)

### VTU Portal URL

```bash
# Get current VTU URL
curl -X GET http://localhost:8000/api/settings/vtu-link/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update VTU URL (Admin only)
curl -X PUT http://localhost:8000/api/settings/vtu-link/update/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}'
```

### Management Commands

```bash
# Initialize default settings
python manage.py init_settings

# View VTU URL
python manage.py shell -c "from results.models import SystemSettings; print(SystemSettings.get_setting('VTU_RESULTS_URL'))"
```

### Django Shell

```python
from results.models import SystemSettings

# Get setting
url = SystemSettings.get_setting('VTU_RESULTS_URL')
print(f"Current URL: {url}")

# Update setting
SystemSettings.set_setting(
    key='VTU_RESULTS_URL',
    value='https://results.vtu.ac.in/JJEcbcs26/index.php',
    description='Current VTU Results Portal URL'
)
```

---

## 📚 Audit Courses Management (NEW!)

### Subject Types

| Type | Credits | In CGPA? | Examples |
|------|---------|----------|----------|
| THEORY | 3-4 | ✅ Yes | BCS601 |
| LAB | 2-3 | ✅ Yes | BCSL606 |
| PROJECT | 1-2 | ✅ Yes | BCS685 |
| NON_CREDIT | 0 | ❌ No | Yoga |
| **AUDIT** | 1 | **❌ No** | **Environmental (BES)** |

### Migrate Existing Audit Courses

```bash
# Auto-migrate subjects to Audit type
python manage.py migrate_audit_courses
```

### Create Audit Course

```python
from results.models import Subject, Department

dept = Department.objects.get(code='CS')

Subject.objects.create(
    code='BES',
    name='Environmental Studies',
    short_name='Environmental',
    subject_type='AUDIT',  # Key difference!
    credits=1,
    department=dept
)
# Marks auto-configured: 100 internal, 0 external
```

### Check CGPA (Excludes Audit Courses)

```python
from results.models import Student

student = Student.objects.get(usn='2AB22CS008')
cgpa = student.calculate_cgpa()
print(f"CGPA (excludes Audit & Non-Credit): {cgpa}")

# Verify Audit courses are excluded
audit_results = student.results.filter(subject__subject_type='AUDIT')
print(f"Audit courses (NOT in CGPA): {audit_results.count()}")
```

---

## 🛠 Troubleshooting

### Server won't start
```bash
# Check port is free
netstat -ano | findstr :8000  # Windows
lsof -ti:8000                 # Linux/Mac

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 $(lsof -ti:8000)      # Linux/Mac
```

### Database connection error
```bash
# Test MySQL connection
mysql -u unismart_user -p unismart_db

# Check MySQL is running
# Windows
net start MySQL80

# Linux
sudo service mysql status

# Mac
brew services list
```

### Import errors
```bash
# Ensure venv is activated
which python  # Should show venv path

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### Migration conflicts
```bash
# Show migrations
python manage.py showmigrations

# Squash migrations (advanced)
python manage.py squashmigrations results 0001 0005

# Fake migration (careful!)
python manage.py migrate --fake results
```

---

## 📊 Data Management

### Create Sample Data (Django Shell)
```python
from results.models import Department, Subject, Student
from decimal import Decimal

# Create department
dept = Department.objects.create(
    code='CS',
    name='Computer Science',
    is_active=True
)

# Create subject
subject = Subject.objects.create(
    code='21CS51',
    name='DBMS',
    short_name='DBMS',
    subject_type='THEORY',
    credits=Decimal('4.0'),
    department=dept
)
```

### Scrape Results
```python
from results.models import User
from results.scraper_service import scrape_single_usn

admin = User.objects.get(username='admin')
result = scrape_single_usn('2AB22CS008', admin, headless=False)
print(result)
```

### Calculate CGPA
```python
from results.models import Student

student = Student.objects.get(usn='2AB22CS008')
cgpa = student.calculate_cgpa()
print(f"CGPA: {cgpa}")

# Semester SGPA
sgpa = student.calculate_sgpa(5)
print(f"Semester 5 SGPA: {sgpa}")

# Backlogs
backlogs = student.get_backlogs()
print(f"Total backlogs: {backlogs.count()}")
```

---

## 🔍 Useful Queries

### Django ORM
```python
from results.models import Student, StudentResult
from django.db.models import Avg, Count

# Students with backlogs
students_with_backlogs = Student.objects.filter(
    results__result_status='F',
    results__is_latest=True
).distinct()

# Department-wise pass percentage
from results.models import Department

for dept in Department.objects.all():
    total = StudentResult.objects.filter(
        student__department=dept,
        is_latest=True
    ).count()

    passed = StudentResult.objects.filter(
        student__department=dept,
        is_latest=True,
        result_status='P'
    ).count()

    pass_pct = (passed/total*100) if total > 0 else 0
    print(f"{dept.code}: {pass_pct:.2f}%")

# Top performers
top_students = []
for student in Student.objects.filter(is_active=True):
    cgpa = student.calculate_cgpa()
    top_students.append((student.usn, student.name, cgpa))

top_students.sort(key=lambda x: x[2], reverse=True)
for usn, name, cgpa in top_students[:10]:
    print(f"{usn} - {name}: {cgpa}")
```

---

## 🎯 Role-Based Access Matrix

| Action | Admin | Faculty | Student |
|--------|-------|---------|---------|
| View all students | ✅ | Dept only | Own |
| View all results | ✅ | Dept only | Own |
| Scrape results | ✅ | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ |
| Edit students | ✅ | ❌ | ❌ |
| View analytics | ✅ | Dept | Own |
| Export data | ✅ | ✅ | Own |

---

## 📦 Production Checklist

```bash
# Before deployment
□ Set DEBUG=False in .env
□ Generate strong SECRET_KEY
□ Configure ALLOWED_HOSTS
□ Setup production database
□ Collect static files
□ Setup HTTPS/SSL
□ Configure CORS properly
□ Setup error monitoring
□ Configure email
□ Setup backups
□ Run security check
□ Load test application

# Commands
python manage.py check --deploy
python manage.py collectstatic
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file**
2. **Use strong SECRET_KEY in production**
3. **Enable HTTPS in production**
4. **Use environment variables for sensitive data**
5. **Keep dependencies updated**: `pip list --outdated`
6. **Regular database backups**
7. **Monitor logs for suspicious activity**
8. **Use strong passwords for admin users**
9. **Enable CORS only for trusted origins**
10. **Rate limit API endpoints in production**

---

## 📈 Performance Tips

1. **Use select_related() and prefetch_related()**
```python
# Bad
students = Student.objects.all()
for s in students:
    print(s.department.name)  # N+1 queries

# Good
students = Student.objects.select_related('department')
for s in students:
    print(s.department.name)  # Single query
```

2. **Add database indexes**
- Already added in models

3. **Use caching (future)**
```python
from django.core.cache import cache
cgpa = cache.get(f'cgpa_{student.id}')
if not cgpa:
    cgpa = student.calculate_cgpa()
    cache.set(f'cgpa_{student.id}', cgpa, 3600)
```

4. **Paginate large querysets**
- Already implemented in API

---

## 🐛 Debug Mode

### Enable detailed errors
```python
# settings.py
DEBUG = True
```

### Django Debug Toolbar (optional)
```bash
pip install django-debug-toolbar

# Add to settings.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
INTERNAL_IPS = ['127.0.0.1']
```

### Logging
```python
import logging
logger = logging.getLogger(__name__)

logger.debug('Debug message')
logger.info('Info message')
logger.warning('Warning message')
logger.error('Error message')
```

---

## 📞 Support & Resources

### Documentation
- **README.md**: Main documentation and feature overview
- **API_DOCUMENTATION.md**: Complete API reference
- **SETUP_GUIDE.md**: Installation and setup instructions
- **SUBJECT_TYPES_GUIDE.md**: ⭐ Audit Courses & Subject Types (NEW!)
- **SYSTEM_SETTINGS_GUIDE.md**: ⭐ Dynamic VTU Link Management (NEW!)
- **QUICK_REFERENCE.md**: This file - quick commands
- **PROJECT_STRUCTURE.md**: Code organization
- **PROJECT_SUMMARY.md**: Technical summary
- **ANALYTICS_API_DOCUMENTATION.md**: Analytics endpoints

### External Resources
- **Issues**: GitHub Issues
- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **Stack Overflow**: Tag `django` and `django-rest-framework`

---

## 🎓 Learning Resources

- Django Official Tutorial: https://docs.djangoproject.com/en/5.0/intro/tutorial01/
- DRF Tutorial: https://www.django-rest-framework.org/tutorial/quickstart/
- Real Python Django: https://realpython.com/tutorials/django/
- Django Best Practices: Two Scoops of Django book

---

**Keep this guide handy for quick reference! 📚**
