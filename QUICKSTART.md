# 🚀 Quick Start Guide - Uni-Smart v5.1

## ⚠️ Virtual Environment Issue - SOLUTION

The error you encountered (`ModuleNotFoundError: No module named 'flask'`) happens because Python packages need to be installed in **virtual environments** for each service.

---

## ✅ **SOLUTION: Run First-Time Setup**

### **Option 1: Automated Setup (Recommended)**

#### **Windows:**
```bash
setup.bat
```

#### **Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
1. ✅ Create virtual environments for all Python services
2. ✅ Install all Python dependencies (Flask, Django, etc.)
3. ✅ Install Node.js dependencies
4. ✅ Prepare your project for running

**Time:** 2-5 minutes depending on internet speed

---

### **Option 2: Manual Setup**

If you prefer to do it manually:

#### **1. Install Node Dependencies**
```bash
npm install
cd gateway-express && npm install && cd ..
cd frontend && npm install && cd ..
```

#### **2. Create Virtual Environments**

**Timetable Service:**
```bash
cd service-timetable-python
python -m venv venv
venv\Scripts\activate.bat          # Windows
# OR
source venv/bin/activate           # Linux/Mac
pip install -r requirements.txt
deactivate
cd ..
```

**Results Service:**
```bash
cd "result analysis"
python -m venv venv
venv\Scripts\activate.bat          # Windows
# OR
source venv/bin/activate           # Linux/Mac
pip install -r requirements.txt
deactivate
cd ..
```

**Exam Seating Service:**
```bash
cd service-examseating-python
python -m venv venv
venv\Scripts\activate.bat          # Windows
# OR
source venv/bin/activate           # Linux/Mac
pip install -r requirements.txt
deactivate
cd ..
```

---

## 🎯 **After Setup: Start All Services**

Once setup is complete, you can start all services:

#### **Windows:**
```bash
start-all.bat
```

#### **Linux/Mac:**
```bash
./start-all.sh
```

#### **Or using npm:**
```bash
npm run dev
```

---

## 📋 **What Each Service Uses**

| Service | Technology | Virtual Environment | Dependencies |
|---------|-----------|-------------------|--------------|
| Gateway | Node.js | ❌ No | npm packages |
| Frontend | Node.js | ❌ No | npm packages |
| **Timetable** | **Python/Flask** | **✅ Yes** | **Flask, etc.** |
| **Results** | **Python/Django** | **✅ Yes** | **Django, etc.** |
| **Exam Seating** | **Python/Flask** | **✅ Yes** | **Flask, etc.** |

---

## 🔧 **How It Works Now**

The updated scripts now:

1. **Auto-detect** if virtual environments exist
2. **Auto-create** them if missing
3. **Auto-install** Python packages
4. **Auto-activate** venv before running each Python service

**In package.json:**
```json
{
  "dev:timetable": "cd service-timetable-python && call venv\\Scripts\\activate.bat && python app.py"
}
```

---

## 📊 **Expected Output After Setup**

When you run `start-all.bat`, you should see:

```
========================================
  Uni-Smart v5.1 - Starting All Services
========================================

[INFO] Node.js version: v18.x.x
[INFO] Python version: 3.x.x
[SETUP] Checking Python virtual environments...
[INFO] Virtual environments ready!

========================================
  Starting Microservices...
========================================

[GATEWAY]     Server started on port 8080
[FRONTEND]    Ready on http://localhost:3000
[TIMETABLE]   Running on http://localhost:5000
[RESULTS]     Django server at http://localhost:8001
[EXAMSEATING] Flask app on http://localhost:5001
```

---

## ❓ **Troubleshooting**

### **"python is not recognized"**
- Install Python from https://python.org
- Make sure to check "Add Python to PATH" during installation

### **"venv creation failed"**
```bash
# Ensure venv module is available
python -m ensurepip
python -m pip install --upgrade pip
```

### **"Permission denied" (Linux/Mac)**
```bash
chmod +x setup.sh
chmod +x start-all.sh
```

### **Still getting "ModuleNotFoundError"?**
Run the setup script again:
```bash
setup.bat  # Windows
# OR
./setup.sh # Linux/Mac
```

---

## 📁 **Project Structure After Setup**

```
Uni-Smart/
├── package.json                         # Root npm config
├── start-all.bat / start-all.sh        # Start all services
├── setup.bat / setup.sh                # First-time setup
│
├── gateway-express/
│   └── node_modules/                   # npm packages
│
├── frontend/
│   └── node_modules/                   # npm packages
│
├── service-timetable-python/
│   ├── venv/                           # ✅ Virtual environment
│   └── requirements.txt
│
├── result analysis/
│   ├── venv/                           # ✅ Virtual environment
│   └── requirements.txt
│
└── service-examseating-python/
    ├── venv/                           # ✅ Virtual environment
    └── requirements.txt
```

---

## 🎉 **Summary**

1. **Run:** `setup.bat` (or `setup.sh`)
2. **Wait:** 2-5 minutes for installation
3. **Start:** `start-all.bat` (or `start-all.sh`)
4. **Access:** http://localhost:3000

**That's it!** All services will run with proper virtual environments activated automatically.

---

**Need Help?** Check the full [README.md](README.md) for detailed documentation.
