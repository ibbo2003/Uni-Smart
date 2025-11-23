#!/bin/bash

echo "========================================"
echo "  Uni-Smart v5.1 - Starting All Services"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Python is not installed!"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

# Determine python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

echo -e "${GREEN}[INFO]${NC} Node.js version:"
node --version
echo ""
echo -e "${GREEN}[INFO]${NC} Python version:"
$PYTHON_CMD --version
echo ""

# Check if concurrently is installed
if [ ! -d "node_modules/concurrently" ]; then
    echo -e "${YELLOW}[SETUP]${NC} Installing root dependencies..."
    npm install
    echo ""
fi

# Setup Python virtual environments if needed
echo -e "${YELLOW}[SETUP]${NC} Checking Python virtual environments..."

if [ ! -d "service-timetable-python/venv" ]; then
    echo -e "${YELLOW}[SETUP]${NC} Creating virtual environment for Timetable Service..."
    cd service-timetable-python
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    echo ""
fi

if [ ! -d "result analysis/venv" ]; then
    echo -e "${YELLOW}[SETUP]${NC} Creating virtual environment for Results Service..."
    cd "result analysis"
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    echo ""
fi

if [ ! -d "service-examseating-python/venv" ]; then
    echo -e "${YELLOW}[SETUP]${NC} Creating virtual environment for Exam Seating Service..."
    cd service-examseating-python
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    echo ""
fi

echo -e "${GREEN}[INFO]${NC} Virtual environments ready!"
echo ""

echo "========================================"
echo "  Starting Microservices..."
echo "========================================"
echo ""
echo "Services:"
echo "  - Gateway (Express)    : http://localhost:8080"
echo "  - Frontend (Next.js)   : http://localhost:3000"
echo "  - Timetable Service    : http://localhost:5000"
echo "  - Results Service      : http://localhost:8001"
echo "  - Exam Seating Service : http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"
echo ""

# Run all services using concurrently
npm run dev
