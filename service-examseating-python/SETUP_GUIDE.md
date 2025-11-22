# Exam Seating Module - Complete Setup Guide

This guide will help you set up and run the exam seating module for your Uni-Smart project.

## Prerequisites

- Python 3.x installed
- MySQL database running
- Node.js installed (for gateway and frontend)
- Database `unismart_db` created

## Step-by-Step Setup

### 1. Database Setup

#### Option A: Fresh Setup
If starting fresh, run the main schema file:
```bash
mysql -u root -p < uni-smart_db.sql
```

#### Option B: Tables Already Exist
If your database already has the timetable tables, just verify the exam seating tables exist:

```sql
USE unismart_db;

-- Check if exam tables exist
SHOW TABLES LIKE 'exam%';

-- You should see:
-- exam_rooms
-- exam_registrations
-- exam_seating_plan
-- exams
```

### 2. Load Sample Data (Optional but Recommended)

To get started quickly with sample data:

```bash
mysql -u root -p unismart_db < service-examseating-python/sample_data.sql
```

This will create:
- 15 sample students
- 4 exam rooms (CR-101, CR-102, CR-103, HALL-A)
- 5 sample exams across different dates
- Student registrations for those exams

### 3. Configure Python Service

#### Install Dependencies

```bash
cd service-examseating-python
pip install -r requirements.txt
```

You should see:
```
Flask
Flask-CORS
mysql-connector-python
python-dotenv
pandas
```

#### Setup Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=unismart_db

FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Start the Services

You need to run **3 services** for the complete system:

#### Terminal 1: Python Exam Seating Service
```bash
cd service-examseating-python
python app.py
```

Expected output:
```
* Running on http://127.0.0.1:5001
* Restarting with stat
* Debugger is active!
```

#### Terminal 2: Express Gateway
```bash
cd gateway-express
npm install  # First time only
node server.js
```

Expected output:
```
Node.js gateway listening on port 8080
```

#### Terminal 3: Next.js Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

Expected output:
```
- ready started server on 0.0.0.0:3000
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3000/exam-seating
```

## Testing the API Directly

### Using cURL

#### 1. Get All Rooms
```bash
curl http://localhost:5001/rooms
```

#### 2. Create a New Room
```bash
curl -X POST http://localhost:5001/rooms \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"CR-104\",\"num_rows\":7,\"num_cols\":8}"
```

#### 3. Get All Exams
```bash
curl http://localhost:5001/exams
```

#### 4. Create an Exam
```bash
curl -X POST http://localhost:5001/exams \
  -H "Content-Type: application/json" \
  -d "{\"subject_code\":\"CS301\",\"exam_date\":\"2025-06-10\",\"exam_session\":\"morning\"}"
```

#### 5. Register Students for an Exam (Batch)
```bash
curl -X POST http://localhost:5001/registrations/batch \
  -H "Content-Type: application/json" \
  -d "{\"exam_id\":1,\"student_usns\":[\"1MS21CS001\",\"1MS21CS002\",\"1MS21CS003\"]}"
```

#### 6. Generate Seating Plan (via Gateway)
```bash
curl -X POST http://localhost:8080/api/exams/generate-seating \
  -H "Content-Type: application/json" \
  -d "{\"exam_date\":\"2025-06-01\",\"exam_session\":\"morning\"}"
```

#### 7. Retrieve Saved Seating Plan
```bash
curl "http://localhost:5001/seating-plan?exam_date=2025-06-01&exam_session=morning"
```

### Using Postman or Thunder Client

Import this collection:

**GET** `http://localhost:5001/rooms` - Get all rooms
**POST** `http://localhost:5001/rooms` - Create room
**GET** `http://localhost:5001/exams` - Get all exams
**POST** `http://localhost:5001/exams` - Create exam
**POST** `http://localhost:5001/registrations/batch` - Register students
**POST** `http://localhost:8080/api/exams/generate-seating` - Generate seating

## Admin Workflow Example

### Scenario: Setting up exams for June 2025

#### Step 1: Verify Exam Rooms Exist
```bash
curl http://localhost:5001/rooms
```

If no rooms exist, create them:
```bash
curl -X POST http://localhost:5001/rooms \
  -H "Content-Type: application/json" \
  -d '{"id":"CR-101","num_rows":5,"num_cols":6}'
```

#### Step 2: Create Exams
```bash
curl -X POST http://localhost:5001/exams \
  -H "Content-Type: application/json" \
  -d '{"subject_code":"CS101","exam_date":"2025-06-01","exam_session":"morning"}'
```

#### Step 3: Get Exam ID
```bash
curl http://localhost:5001/exams
```

Look for the `id` field in the response.

#### Step 4: Register Students
```bash
curl -X POST http://localhost:5001/registrations/batch \
  -H "Content-Type: application/json" \
  -d '{"exam_id":1,"student_usns":["1MS21CS001","1MS21CS002","1MS21CS003"]}'
```

#### Step 5: Generate Seating Plan
Use the frontend at `http://localhost:3000/exam-seating`

Or via API:
```bash
curl -X POST http://localhost:8080/api/exams/generate-seating \
  -H "Content-Type: application/json" \
  -d '{"exam_date":"2025-06-01","exam_session":"morning"}'
```

## Verification Queries

### Check if everything is set up correctly:

```sql
-- 1. Check students count
SELECT COUNT(*) as total_students FROM students;

-- 2. Check exam rooms
SELECT * FROM exam_rooms;

-- 3. Check scheduled exams
SELECT
    e.id,
    e.subject_code,
    e.exam_date,
    e.exam_session,
    COUNT(er.student_usn) as registered_students
FROM exams e
LEFT JOIN exam_registrations er ON e.id = er.exam_id
GROUP BY e.id;

-- 4. Check if seating plan was generated
SELECT COUNT(*) as total_seats_assigned
FROM exam_seating_plan;

-- 5. View seating plan for a specific exam
SELECT
    s.usn,
    s.name,
    e.subject_code,
    esp.room_id,
    esp.row_num,
    esp.col_num
FROM exam_seating_plan esp
JOIN students s ON esp.student_usn = s.usn
JOIN exams e ON esp.exam_id = e.id
WHERE e.exam_date = '2025-06-01'
  AND e.exam_session = 'morning'
ORDER BY esp.room_id, esp.row_num, esp.col_num;
```

## Common Issues and Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure database `unismart_db` exists

### Issue 2: "Module 'flask_cors' not found"
**Solution:**
```bash
cd service-examseating-python
pip install Flask-CORS
```

### Issue 3: "Port 5001 already in use"
**Solution:**
- Find process using port: `netstat -ano | findstr :5001` (Windows) or `lsof -i :5001` (Mac/Linux)
- Kill the process or change port in `app.py` line 374

### Issue 4: Frontend can't fetch rooms
**Solution:**
- Ensure Python service is running on port 5001
- Check browser console for CORS errors
- Verify CORS is enabled in `app.py` (line 12)

### Issue 5: Gateway can't reach Python service
**Solution:**
- Ensure both services are running
- Check gateway URL in `server.js` line 364: `http://127.0.0.1:5001/generate_seating`

## File Structure

```
service-examseating-python/
├── app.py                  # Main Flask application with all APIs
├── seating_algorithm.py    # Seating arrangement algorithm
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .env                   # Your actual config (create this)
├── README.md              # API documentation
├── SETUP_GUIDE.md         # This file
└── sample_data.sql        # Sample data for testing
```

## Next Steps

1. **Customize the Seating Algorithm**: Edit `seating_algorithm.py` to implement advanced seating patterns
2. **Add Authentication**: Implement admin authentication for sensitive endpoints
3. **Create Admin UI**: Build a comprehensive admin panel for managing rooms, exams, and registrations
4. **Export Functionality**: Add PDF/Excel export for seating plans
5. **Bulk Upload**: Implement CSV upload for student registrations

## Support

For issues or questions:
1. Check the main [README.md](README.md) for API documentation
2. Review error logs in the terminal
3. Verify database queries manually in MySQL

---

**Important**: This module is part of the Uni-Smart system. The frontend is shared across all modules (timetable, exam seating, result analysis), so be careful when making frontend changes.
