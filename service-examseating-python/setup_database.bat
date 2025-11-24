@echo off
echo ==========================================
echo Exam Seating Database Setup
echo ==========================================
echo.

echo This script will populate your database with sample data for testing.
echo.

echo Option 1: Using MySQL Command Line
echo -----------------------------------
echo Run this command:
echo mysql -u root -proot unismart_db ^< quick_setup.sql
echo.

echo Option 2: Copy and paste into MySQL Workbench
echo ----------------------------------------------
echo 1. Open quick_setup.sql in a text editor
echo 2. Copy all contents
echo 3. Paste into MySQL Workbench query window
echo 4. Execute
echo.

echo Option 3: Run sample_data.sql (More comprehensive)
echo ---------------------------------------------------
echo mysql -u root -proot unismart_db ^< sample_data.sql
echo.

pause

echo.
echo Attempting to run quick_setup.sql...
mysql -u root -proot unismart_db < quick_setup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Database has been populated with test data.
    echo.
    echo You can now:
    echo 1. Start services: npm run dev
    echo 2. Go to http://localhost:3000/exam-seating
    echo 3. Generate seating for Date: 2025-06-01, Session: morning
    echo.
) else (
    echo.
    echo ERROR: Failed to import data automatically.
    echo.
    echo Please try manual import:
    echo 1. Open MySQL Workbench or command line
    echo 2. Run: USE unismart_db;
    echo 3. Copy and paste contents from quick_setup.sql
    echo.
)

pause
