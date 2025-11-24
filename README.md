# 🎓 Uni-Smart v5.1 - Academic Management System

> Enhanced VTU 2024 Compliance | Hybrid Intelligent Lab Scheduling | Microservices Architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Docker Deployment](#docker-deployment)
- [Services](#services)
- [Timetable v5.1 Enhancements](#timetable-v51-enhancements)

---

## 🌟 Overview

Uni-Smart is a comprehensive academic management system built with microservices architecture, featuring:
- **AI-Powered Timetable Generation** (Genetic Algorithm + CSP + Tabu Search)
- **Automated Result Analysis** with web scraping
- **Intelligent Exam Seating Arrangement**
- **VTU 2024 Compliance** with updated subject types

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│                    http://localhost:3000                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                  API Gateway (Express.js)                    │
│                    http://localhost:8080                     │
└──┬───────────────┬──────────────────┬──────────────────┬─────┘
   │               │                  │                  │
   ▼               ▼                  ▼                  ▼
┌──────────┐  ┌──────────┐      ┌──────────┐      ┌──────────┐
│Timetable │  │  Results │      │   Exam   │      │  MySQL   │
│ Service  │  │ Analysis │      │  Seating │      │ Database │
│ (Flask)  │  │ (Django) │      │ (Flask)  │      │  Server  │
│  :5000   │  │  :8001   │      │  :5001   │      │  :3306   │
└──────────┘  └──────────┘      └──────────┘      └──────────┘
```

---

## ✨ Features

### 🗓️ Timetable Generation (v5.1)
- **Hybrid Intelligent Scheduler**: Automatically switches between rotation and simultaneous modes based on lab room availability
- **Smart Lab Scheduling**: Automatically uses afternoon slots when no projects scheduled
- **Rotation Mode**: Different subjects in parallel with batch rotation (ideal for 2-3 lab subjects)
- **Simultaneous Mode**: Both batches attend same subject with one faculty (handles 5+ lab subjects with limited rooms)
- **VTU Saturday Awareness**: Minimizes Saturday labs (1st & 3rd Saturday holidays)
- **Updated Subject Types**: PCC, PCCL, PEC, OEC, UHV, MC, AEC, SEC, ESC, PROJ
- **Theory/Lab Flexibility**: Determined by hours specified, not subject type
- **60-75% Faster**: Hybrid GA + CSP + Tabu Search optimization
- **Export Formats**: PDF, Word, Excel with VTU-compliant formatting

### 📊 Result Analysis
- Automated web scraping from VTU results portal
- Statistical analysis and visualization
- Performance tracking

### 🏛️ Exam Seating
- Intelligent seating arrangement
- Room optimization
- Student distribution
- **Batch Registration**: Upload Excel, Word, or PDF files with USN lists
- **Smart Validation**: Pre-validates students exist before registration

---

## 🚀 Quick Start

### **Option 1: Automated Script (Recommended)**

#### **Windows:**
```bash
# Double-click or run:
start-all.bat
```

#### **Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

### **Option 2: Using npm**

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all

# Start all services
npm run dev
```

---

## 💻 Development Setup

### **Prerequisites**

- **Node.js** >= 18.0.0
- **Python** >= 3.9.0
- **MySQL** >= 8.0
- **npm** >= 9.0.0

### **Step-by-Step Installation**

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Uni-Smart
   ```

2. **Install Root Dependencies**
   ```bash
   npm install
   ```

3. **Install Service Dependencies**

   **Gateway (Express):**
   ```bash
   cd gateway-express
   npm install
   cd ..
   ```

   **Frontend (Next.js):**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

   **Python Services:**
   ```bash
   pip install -r service-timetable-python/requirements.txt
   pip install -r "result analysis/requirements.txt"
   pip install -r service-examseating-python/requirements.txt
   ```

4. **Configure Environment Variables**

   Create `.env` files in each service directory:

   **gateway-express/.env:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=unismart_db
   PORT=8080
   ```

   **result analysis/.env:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=unismart_db
   SECRET_KEY=your_django_secret_key
   ```

5. **Setup Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE unismart_db;
   ```

6. **Run Migrations (Django)**
   ```bash
   cd "result analysis"
   python manage.py migrate
   cd ..
   ```

7. **Start All Services**
   ```bash
   npm run dev
   ```

---

## 🐳 Docker Deployment

### **Prerequisites**
- Docker Desktop
- Docker Compose

### **Deploy with Docker**

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### **Docker Services**

| Service | Container Name | Port | URL |
|---------|---------------|------|-----|
| Frontend | unismart-frontend | 3000 | http://localhost:3000 |
| Gateway | unismart-gateway | 8080 | http://localhost:8080 |
| Timetable | unismart-timetable | 5000 | http://localhost:5000 |
| Results | unismart-results | 8001 | http://localhost:8001 |
| Exam Seating | unismart-examseating | 5001 | http://localhost:5001 |
| MySQL | unismart-mysql | 3306 | localhost:3306 |

---

## 🛠️ Services

### **1. Frontend (Next.js)**
- **Port**: 3000
- **Technology**: Next.js 15, React 19, Tailwind CSS
- **Features**:
  - Timetable input with VTU subject types
  - Timetable visualization
  - Export functionality

### **2. API Gateway (Express.js)**
- **Port**: 8080
- **Technology**: Express.js, Node.js
- **Features**:
  - Route aggregation
  - Service orchestration
  - Export generation (PDF, Word, Excel)

### **3. Timetable Service (Python Flask)**
- **Port**: 5000
- **Technology**: Python, Flask
- **Algorithm**: Hybrid GA + CSP + Tabu Search
- **Features**:
  - Smart lab scheduling
  - VTU compliance
  - Multi-tier optimization

### **4. Results Analysis Service (Django)**
- **Port**: 8001
- **Technology**: Python, Django
- **Features**:
  - Web scraping
  - Statistical analysis
  - Performance tracking

### **5. Exam Seating Service (Python Flask)**
- **Port**: 5001
- **Technology**: Python, Flask
- **Features**:
  - Room optimization
  - Student distribution
  - Seating arrangement

---

## 🎯 Timetable v5.1 Enhancements

### **1. Hybrid Intelligent Lab Scheduler** 🆕

The scheduler automatically chooses the optimal mode based on lab room availability:

#### **Rotation Mode** (When lab_subjects ≤ available_rooms)
```
Example: 2 Lab Subjects, 2 Batches, 4 Lab Rooms Available
├── Session 1: Batch 1 → CN (Lab1), Batch 2 → WEB (Lab2)
└── Session 2: Batch 1 → WEB (Lab1), Batch 2 → CN (Lab2)
✅ Both batches cover all subjects in 2 sessions
```

#### **Simultaneous Mode** (When lab_subjects > available_rooms)
```
Example: 5 Lab Subjects, 2 Batches, 4 Lab Rooms Available
├── Session 1: Batch 1 → DDCO (Lab1), Batch 2 → DDCO (Lab2)
├── Session 2: Batch 1 → OS (Lab1), Batch 2 → OS (Lab2)
├── Session 3: Batch 1 → OOP (Lab1), Batch 2 → OOP (Lab2)
├── Session 4: Batch 1 → DS_LAB (Lab1), Batch 2 → DS_LAB (Lab2)
└── Session 5: Batch 1 → GIT (Lab1), Batch 2 → GIT (Lab2)
✅ Both batches cover all subjects in 5 sessions
✅ One faculty manages both batches (realistic for colleges)
✅ Uses only 2 lab rooms instead of requiring 5!
```

**Key Benefits:**
- ✅ Handles ANY number of lab subjects with limited lab rooms
- ✅ No phantom batch creation (fixed batch count bug)
- ✅ Efficient lab room utilization
- ✅ Future-proof for any section configuration
- ✅ Realistic faculty allocation (one faculty can supervise both batches)

### **2. Smart Lab Scheduling**
```
Section with Projects:
├── Day 1: No project  → ✅ Labs can use afternoon
├── Day 2: Has project → ❌ Labs use morning only
├── Day 3: No project  → ✅ Labs can use afternoon
└── Maximum flexibility achieved!
```

### **3. VTU Saturday Holiday Awareness**
- Penalty applied: -50 per Saturday lab
- Projects exempt from penalty
- Encourages weekday distribution

### **4. Updated Subject Types**

| Code | Description |
|------|-------------|
| PCC | Professional Core Course |
| PCCL | Professional Core Course Laboratory |
| PEC | Professional Elective Course |
| OEC | Open Elective Course |
| UHV | Universal Human Value Course |
| MC | Mandatory Course (Non-credit) |
| AEC | Ability Enhancement Course |
| SEC | Skill Enhancement Course |
| ESC | Engineering Science Course |
| PROJ | Project Work |

**Legacy Support**: IPCC, HSMC, MP, INT

### **5. Theory/Lab Determination**

✅ **NEW**: Based on hours specified
```
Subject: PCC
Theory Hours: 3 → Will schedule 3 theory classes
Lab Hours: 2   → Will schedule 2-hour lab session
```

❌ **OLD**: Based on subject type (inflexible)

---

## 📝 npm Scripts Reference

```json
{
  "dev": "Start all services concurrently",
  "dev:gateway": "Start gateway only",
  "dev:frontend": "Start frontend only",
  "dev:timetable": "Start timetable service only",
  "dev:results": "Start results service only",
  "dev:examseating": "Start exam seating service only",
  "install:all": "Install all dependencies",
  "install:gateway": "Install gateway dependencies",
  "install:frontend": "Install frontend dependencies",
  "install:python": "Install Python dependencies"
}
```

---

## 🔧 Troubleshooting

### **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### **Python Module Not Found**
```bash
pip install -r <service>/requirements.txt
```

### **Database Connection Error**
- Verify MySQL is running
- Check credentials in `.env` files
- Ensure database exists

### **Docker Issues**
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up --build
```

---

## 📄 License

This project is part of a Final Year Project.

---

## 👥 Contributors

- Student Package Website Project Team
- VTU Timetable Scheduler v5.1

---

## 📞 Support

For issues and questions:
- Check existing documentation
- Review error logs in `docker-compose logs`
- Verify service health: `docker-compose ps`

---

**Happy Coding! 🎉**
