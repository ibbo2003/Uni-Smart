# UniSmart Setup Guide

Step-by-step guide to set up the UniSmart Result Analysis Module on your local machine.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation](#pre-installation)
3. [Installation Steps](#installation-steps)
4. [Database Configuration](#database-configuration)
5. [Application Setup](#application-setup)
6. [Initial Data Setup](#initial-data-setup)
7. [Testing the Application](#testing-the-application)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 11+, or Linux (Ubuntu 20.04+)
- **Python**: 3.10 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **Browser**: Google Chrome (latest version)

### Software Dependencies
- Python 3.10+
- MySQL 8.0+
- Google Chrome
- Git
- pip (Python package manager)

---

## Pre-Installation

### 1. Install Python

#### Windows
1. Download Python from https://www.python.org/downloads/
2. Run installer and **check "Add Python to PATH"**
3. Verify installation:
```bash
python --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.10 python3-pip python3-venv
python3 --version
```

#### macOS
```bash
brew install python@3.10
python3 --version
```

### 2. Install MySQL

#### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and select "Developer Default"
3. Set root password during installation
4. Verify installation:
```bash
mysql --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### 3. Install Google Chrome

Download and install from: https://www.google.com/chrome/

### 4. Install Git

#### Windows
Download from: https://git-scm.com/download/win

#### Linux
```bash
sudo apt install git
```

#### macOS
```bash
brew install git
```

---

## Installation Steps

### Step 1: Clone Repository

```bash
# Navigate to your desired directory
cd C:\Users\YourName\Projects  # Windows
# or
cd ~/projects  # Linux/Mac

# Clone the repository
git clone https://github.com/yourusername/unismart-backend.git
cd unismart-backend
```

### Step 2: Create Virtual Environment

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### Linux/Mac
```bash
python3 -m venv venv
source venv/bin/activate
```

**Note**: You should see `(venv)` in your terminal prompt when activated.

### Step 3: Upgrade pip
```bash
python -m pip install --upgrade pip
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

This will take 5-10 minutes. The installation includes:
- Django and DRF
- MySQL connector
- Selenium and WebDriver
- EasyOCR (will download OCR models ~500MB)
- Image processing libraries
- And more...

### Step 5: Download EasyOCR Models

The OCR models will download automatically on first use, but you can pre-download:

```bash
python -c "import easyocr; reader = easyocr.Reader(['en'])"
```

---

## Database Configuration

### Step 1: Create MySQL Database

#### Option A: Using MySQL Command Line

```bash
# Login to MySQL
mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE unismart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'unismart_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON unismart_db.* TO 'unismart_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;

-- Exit
EXIT;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click "Create New Schema" icon
4. Name: `unismart_db`
5. Character Set: `utf8mb4`
6. Collation: `utf8mb4_unicode_ci`
7. Click "Apply"

### Step 2: Verify Database Connection

```bash
mysql -u unismart_user -p unismart_db
```

If successful, you'll see the MySQL prompt.

---

## Application Setup

### Step 1: Create Environment File

```bash
# Copy example file
cp .env.example .env

# Windows (if cp doesn't work)
copy .env.example .env
```

### Step 2: Edit .env File

Open `.env` in a text editor and update:

```env
# Generate a new secret key
SECRET_KEY=django-insecure-your-secret-key-here-CHANGE-THIS

# Database settings
DB_NAME=unismart_db
DB_USER=unismart_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=3306

# Development settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (update when you create frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Scraper settings
SCRAPER_HEADLESS=True
SCRAPER_MAX_CAPTCHA_ATTEMPTS=5
```

### Step 3: Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste it as `SECRET_KEY` in `.env` file.

### Step 4: Run Migrations

```bash
# Create migration files
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

**Expected Output:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, results, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  ...
  Applying results.0001_initial... OK
```

### Step 5: Create Superuser

```bash
python manage.py createsuperuser
```

**Enter:**
- Username: `admin`
- Email: `admin@unismart.com`
- Password: (choose a strong password)
- Password (again): (confirm)

### Step 6: Create Logs Directory

```bash
mkdir logs
```

---

## Initial Data Setup

### Step 1: Load Sample Departments

```bash
python manage.py shell
```

```python
from results.models import Department

# Create departments
departments = [
    {'code': 'CS', 'name': 'Computer Science & Engineering'},
    {'code': 'EC', 'name': 'Electronics & Communication Engineering'},
    {'code': 'ME', 'name': 'Mechanical Engineering'},
    {'code': 'CV', 'name': 'Civil Engineering'},
    {'code': 'EE', 'name': 'Electrical & Electronics Engineering'},
    {'code': 'IE', 'name': 'Industrial Engineering'},
    {'code': 'CH', 'name': 'Chemical Engineering'},
    {'code': 'BT', 'name': 'Biotechnology'},
]

for dept in departments:
    Department.objects.get_or_create(
        code=dept['code'],
        defaults={'name': dept['name'], 'is_active': True}
    )

print("Departments created successfully!")

# Exit shell
exit()
```

### Step 2: Load Sample Subjects (Optional)

```bash
python manage.py shell
```

```python
from results.models import Department, Subject
from decimal import Decimal

# Get CS department
cs_dept = Department.objects.get(code='CS')

# Create sample subjects
subjects = [
    {
        'code': '21MAT11',
        'name': 'Mathematics-I',
        'short_name': 'M-I',
        'subject_type': 'THEORY',
        'credits': Decimal('4.0'),
    },
    {
        'code': '21PHY12',
        'name': 'Physics for Computer Science',
        'short_name': 'Physics',
        'subject_type': 'THEORY',
        'credits': Decimal('4.0'),
    },
    {
        'code': '21CS51',
        'name': 'Database Management Systems',
        'short_name': 'DBMS',
        'subject_type': 'THEORY',
        'credits': Decimal('4.0'),
    },
]

for subj in subjects:
    Subject.objects.get_or_create(
        code=subj['code'],
        defaults={
            **subj,
            'department': cs_dept,
            'is_active': True
        }
    )

print("Subjects created successfully!")
exit()
```

---

## Testing the Application

### Step 1: Run Development Server

```bash
python manage.py runserver
```

**Expected Output:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
January 01, 2024 - 10:00:00
Django version 5.0.1, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Step 2: Access Admin Panel

1. Open browser: http://127.0.0.1:8000/admin/
2. Login with superuser credentials
3. Explore the admin interface

### Step 3: Access API Root

1. Open browser: http://127.0.0.1:8000/api/
2. You should see the DRF browsable API interface

### Step 4: Test Authentication

#### Using Browser
1. Go to: http://127.0.0.1:8000/api/auth/login/
2. POST with:
```json
{
  "username": "admin",
  "password": "your-password"
}
```

#### Using cURL
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

**Expected Response:**
```json
{
  "access": "eyJ0eXAiOi...",
  "refresh": "eyJ0eXAiOi..."
}
```

### Step 5: Test Scraper (Optional)

**Warning**: This will attempt to scrape real data from VTU portal.

```bash
python manage.py shell
```

```python
from results.models import User
from results.scraper_service import scrape_single_usn

# Get admin user
admin = User.objects.get(username='admin')

# Test scrape with a valid VTU USN
# Replace with an actual USN
result = scrape_single_usn('2AB22CS008', admin, headless=False)

print(result)
exit()
```

---

## Troubleshooting

### Issue 1: ModuleNotFoundError

**Error**: `ModuleNotFoundError: No module named 'django'`

**Solution**:
```bash
# Ensure virtual environment is activated
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Reinstall requirements
pip install -r requirements.txt
```

### Issue 2: MySQL Connection Error

**Error**: `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server")`

**Solutions**:
1. Check MySQL is running:
```bash
# Windows
net start MySQL80

# Linux
sudo service mysql status

# Mac
brew services list
```

2. Verify credentials in `.env` file
3. Test connection:
```bash
mysql -u unismart_user -p unismart_db
```

### Issue 3: Migration Errors

**Error**: `django.db.migrations.exceptions.InconsistentMigrationHistory`

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
python manage.py flush

# Or drop and recreate database
mysql -u root -p
DROP DATABASE unismart_db;
CREATE DATABASE unismart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Re-run migrations
python manage.py migrate
```

### Issue 4: Port Already in Use

**Error**: `Error: That port is already in use.`

**Solution**:
```bash
# Run on different port
python manage.py runserver 8001

# Or kill process on port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Issue 5: CAPTCHA Solving Fails

**Error**: Scraper fails to solve CAPTCHA repeatedly

**Solutions**:
1. Run in non-headless mode:
```python
# In .env
SCRAPER_HEADLESS=False
```

2. Increase attempts:
```python
# In .env
SCRAPER_MAX_CAPTCHA_ATTEMPTS=10
```

3. Check Chrome and ChromeDriver versions

### Issue 6: EasyOCR Import Error

**Error**: `ImportError: cannot import name 'Reader' from 'easyocr'`

**Solution**:
```bash
# Reinstall EasyOCR
pip uninstall easyocr
pip install easyocr==1.7.1

# If still fails, install dependencies
pip install torch torchvision
```

### Issue 7: Static Files Not Found

**Solution**:
```bash
# Collect static files
python manage.py collectstatic --noinput
```

---

## Next Steps

After successful setup:

1. **Explore Admin Panel**: Add more departments, subjects, faculty
2. **Test API Endpoints**: Use Postman or cURL to test API
3. **Scrape Test Data**: Scrape some USNs to populate database
4. **Create Test Users**: Add faculty and student users
5. **Build Frontend**: Create React/Vue/Angular frontend
6. **Deploy**: Follow deployment guide for production

---

## Quick Start Script

For convenience, here's a script to automate setup (Linux/Mac):

```bash
#!/bin/bash

# Quick setup script for UniSmart

echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating .env file..."
cp .env.example .env

echo "Please edit .env file with your database credentials"
echo "Press Enter when done..."
read

echo "Running migrations..."
python manage.py migrate

echo "Creating superuser..."
python manage.py createsuperuser

echo "Creating logs directory..."
mkdir -p logs

echo "Setup complete! Run 'python manage.py runserver' to start."
```

Save as `setup.sh` and run:
```bash
chmod +x setup.sh
./setup.sh
```

---

## Useful Commands

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Deactivate virtual environment
deactivate

# Run development server
python manage.py runserver

# Run on different port
python manage.py runserver 8001

# Create superuser
python manage.py createsuperuser

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic

# Run tests
pytest

# Check for issues
python manage.py check

# Show migrations
python manage.py showmigrations

# Create app
python manage.py startapp app_name
```

---

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review error messages carefully
3. Search GitHub issues
4. Ask on Stack Overflow with tag `django`
5. Contact support: support@unismart.com

---

**Happy Coding! 🚀**
