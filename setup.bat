@echo off
echo ========================================
echo   Uni-Smart v5.1 - First Time Setup
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

:: Install root dependencies
echo [1/5] Installing root npm dependencies...
call npm install
echo.

:: Install Gateway dependencies
echo [2/5] Installing Gateway dependencies...
cd gateway-express
call npm install
cd ..
echo.

:: Install Frontend dependencies
echo [3/5] Installing Frontend dependencies...
cd frontend
call npm install
cd ..
echo.

:: Setup Timetable Service virtual environment
echo [4/5] Setting up Timetable Service (Python)...
cd service-timetable-python
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
deactivate
cd ..
echo.

:: Setup Results Service virtual environment
echo [4/5] Setting up Results Analysis Service (Django)...
cd "result analysis"
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
deactivate
cd ..
echo.

:: Setup Exam Seating Service virtual environment
echo [5/5] Setting up Exam Seating Service (Python)...
cd service-examseating-python
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
deactivate
cd ..
echo.

echo ========================================
echo   Setup Complete! ✓
echo ========================================
echo.
echo Next steps:
echo   1. Configure .env files in each service directory
echo   2. Setup MySQL database (unismart_db)
echo   3. Run: start-all.bat
echo.
pause
