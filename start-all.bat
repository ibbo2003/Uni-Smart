@echo off
echo ========================================
echo   Uni-Smart v5.1 - Starting All Services
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.
echo [INFO] Python version:
python --version
echo.

:: Check if concurrently is installed
if not exist "node_modules\concurrently" (
    echo [SETUP] Installing root dependencies...
    call npm install
    echo.
)

:: Setup Python virtual environments if needed
echo [SETUP] Checking Python virtual environments...
if not exist "service-timetable-python\venv" (
    echo [SETUP] Creating virtual environment for Timetable Service...
    cd service-timetable-python
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
    echo.
)

if not exist "result analysis\venv" (
    echo [SETUP] Creating virtual environment for Results Service...
    cd "result analysis"
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
    echo.
)

if not exist "service-examseating-python\venv" (
    echo [SETUP] Creating virtual environment for Exam Seating Service...
    cd service-examseating-python
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
    echo.
)

echo [INFO] Virtual environments ready!
echo.

echo ========================================
echo   Starting Microservices...
echo ========================================
echo.
echo Services:
echo   - Gateway (Express)    : http://localhost:8080
echo   - Frontend (Next.js)   : http://localhost:3000
echo   - Timetable Service    : http://localhost:5000
echo   - Results Service      : http://localhost:8001
echo   - Exam Seating Service : http://localhost:5001
echo.
echo Press Ctrl+C to stop all services
echo ========================================
echo.

:: Run all services using concurrently
npm run dev

pause
