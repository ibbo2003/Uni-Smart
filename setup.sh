#!/bin/bash

echo "========================================"
echo "  Uni-Smart v5.1 - First Time Setup"
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

# Install root dependencies
echo -e "${YELLOW}[1/5]${NC} Installing root npm dependencies..."
npm install
echo ""

# Install Gateway dependencies
echo -e "${YELLOW}[2/5]${NC} Installing Gateway dependencies..."
cd gateway-express
npm install
cd ..
echo ""

# Install Frontend dependencies
echo -e "${YELLOW}[3/5]${NC} Installing Frontend dependencies..."
cd frontend
npm install
cd ..
echo ""

# Setup Timetable Service virtual environment
echo -e "${YELLOW}[4/5]${NC} Setting up Timetable Service (Python)..."
cd service-timetable-python
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
echo ""

# Setup Results Service virtual environment
echo -e "${YELLOW}[4/5]${NC} Setting up Results Analysis Service (Django)..."
cd "result analysis"
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
echo ""

# Setup Exam Seating Service virtual environment
echo -e "${YELLOW}[5/5]${NC} Setting up Exam Seating Service (Python)..."
cd service-examseating-python
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
echo ""

echo "========================================"
echo -e "  ${GREEN}Setup Complete! ✓${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Configure .env files in each service directory"
echo "  2. Setup MySQL database (unismart_db)"
echo "  3. Run: ./start-all.sh"
echo ""
