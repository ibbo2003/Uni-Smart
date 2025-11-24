# Exam Seating Service - API Documentation

This is the exam seating arrangement microservice for the Uni-Smart platform. It provides REST APIs for managing exam rooms, exams, student registrations, and generating seating arrangements.

## Tech Stack

- **Python 3.x**
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **MySQL** - Database
- **mysql-connector-python** - MySQL driver

## Setup Instructions

### 1. Install Dependencies

```bash
cd service-examseating-python
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=unismart_db
```

### 3. Run the Service

```bash
python app.py
```

The service will run on **http://localhost:5001**

## API Endpoints

### Exam Rooms Management

#### Get All Rooms
```
GET /rooms
```
Returns list of all exam rooms with their layouts.

**Response:**
```json
[
  {
    "id": "CR-101",
    "num_rows": 5,
    "num_cols": 6,
    "capacity": 30
  }
]
```

#### Create Room
```
POST /rooms
Content-Type: application/json

{
  "id": "CR-101",
  "num_rows": 5,
  "num_cols": 6
}
```

#### Update Room
```
PUT /rooms/<room_id>
Content-Type: application/json

{
  "num_rows": 6,
  "num_cols": 8
}
```

#### Delete Room
```
DELETE /rooms/<room_id>
```

---

### Exams Management

#### Get All Exams
```
GET /exams
```

**Response:**
```json
[
  {
    "id": 1,
    "subject_code": "CS101",
    "exam_date": "2025-05-15",
    "exam_session": "morning"
  }
]
```

#### Create Exam
```
POST /exams
Content-Type: application/json

{
  "subject_code": "CS101",
  "exam_date": "2025-05-15",
  "exam_session": "morning"
}
```
**Note:** `exam_session` must be either "morning" or "afternoon"

#### Delete Exam
```
DELETE /exams/<exam_id>
```

---

### Student Registrations

#### Register Single Student
```
POST /registrations
Content-Type: application/json

{
  "student_usn": "1MS21CS001",
  "exam_id": 1
}
```

#### Register Multiple Students (Batch)
```
POST /registrations/batch
Content-Type: application/json

{
  "exam_id": 1,
  "student_usns": ["1MS21CS001", "1MS21CS002", "1MS21CS003"]
}
```

#### Get Exam Registrations
```
GET /exams/<exam_id>/registrations
```

**Response:**
```json
[
  {
    "registration_id": 1,
    "student_usn": "1MS21CS001",
    "name": "John Doe",
    "section_id": "7_A"
  }
]
```

---

### Seating Plan Generation

#### Generate Seating Plan
```
POST /generate_seating
Content-Type: application/json

{
  "exam_date": "2025-05-15",
  "exam_session": "morning"
}
```

**Response:**
```json
[
  {
    "student_usn": "1MS21CS001",
    "subject_code": "CS101",
    "room_id": "CR-101",
    "row_num": 0,
    "col_num": 0
  }
]
```

**Note:** This endpoint is typically called by the gateway service, not directly by the frontend.

#### Get Saved Seating Plan
```
GET /seating-plan?exam_date=2025-05-15&exam_session=morning
```

**Response:**
```json
[
  {
    "student_usn": "1MS21CS001",
    "student_name": "John Doe",
    "subject_code": "CS101",
    "room_id": "CR-101",
    "row_num": 0,
    "col_num": 0
  }
]
```

---

## Seating Algorithm

The seating algorithm is located in [seating_algorithm.py](seating_algorithm.py:26-55).

### How it works:

1. **Input**: List of exam rooms and students grouped by subject
2. **Process**:
   - Iterates through available rooms
   - Fills each room sequentially with students
   - Places students row by row, column by column
3. **Output**: Complete seating arrangement with student positions

### Current Algorithm Features:

- Simple sequential allocation
- Fills rooms one by one
- Tracks room capacity automatically
- Prevents overbooking

### Future Enhancements (Possible):

- Alternate students from different subjects for better distribution
- Implement zigzag patterns to prevent cheating
- Respect section/department preferences
- Priority-based seating for special needs

---

## Database Schema

The service uses the following tables:

### exam_rooms
```sql
- id (VARCHAR, PRIMARY KEY)
- num_rows (INT)
- num_cols (INT)
- capacity (INT)
```

### exams
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- subject_code (VARCHAR)
- exam_date (DATE)
- exam_session (ENUM: 'morning', 'afternoon')
```

### students
```sql
- usn (VARCHAR, PRIMARY KEY)
- name (VARCHAR)
- section_id (VARCHAR)
```

### exam_registrations
```sql
- registration_id (INT, AUTO_INCREMENT, PRIMARY KEY)
- student_usn (VARCHAR, FOREIGN KEY)
- exam_id (INT, FOREIGN KEY)
```

### exam_seating_plan
```sql
- plan_id (INT, AUTO_INCREMENT, PRIMARY KEY)
- student_usn (VARCHAR, FOREIGN KEY)
- exam_id (INT, FOREIGN KEY)
- room_id (VARCHAR, FOREIGN KEY)
- row_num (INT)
- col_num (INT)
```

---

## Integration with Gateway

The exam seating service integrates with the Express gateway ([gateway-express/server.js](../gateway-express/server.js:359-419)):

1. Frontend calls gateway: `POST http://localhost:8080/api/exams/generate-seating`
2. Gateway calls Python service: `POST http://localhost:5001/generate_seating`
3. Python service generates seating plan
4. Gateway saves the plan to database
5. Gateway returns result to frontend

---

## Admin Workflow

### Step 1: Setup Exam Rooms
```bash
POST http://localhost:5001/rooms
{
  "id": "CR-101",
  "num_rows": 5,
  "num_cols": 6
}
```

### Step 2: Create Exams
```bash
POST http://localhost:5001/exams
{
  "subject_code": "CS101",
  "exam_date": "2025-05-15",
  "exam_session": "morning"
}
```

### Step 3: Register Students
```bash
POST http://localhost:5001/registrations/batch
{
  "exam_id": 1,
  "student_usns": ["1MS21CS001", "1MS21CS002", ...]
}
```

### Step 4: Generate Seating Plan
Use the frontend interface at `http://localhost:3000/exam-seating` or call:
```bash
POST http://localhost:8080/api/exams/generate-seating
{
  "exam_date": "2025-05-15",
  "exam_session": "morning"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (missing fields, invalid data)
- **404** - Not Found
- **409** - Conflict (duplicate entry)
- **500** - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

---

## Development Notes

- The service runs on port **5001** to avoid conflicts with the timetable service (port 5000)
- CORS is enabled for all origins in development
- All database connections are properly closed after use
- The service uses connection pooling for better performance

---

## Testing the APIs

You can test the APIs using tools like:

- **Postman**
- **cURL**
- **Thunder Client** (VS Code extension)
- **Insomnia**

Example cURL command:
```bash
curl -X GET http://localhost:5001/rooms
```

---

## Troubleshooting

### Issue: "Cannot connect to database"
- Check if MySQL is running
- Verify database credentials in `.env`
- Ensure `unismart_db` database exists

### Issue: "Module 'flask_cors' not found"
- Run `pip install -r requirements.txt`

### Issue: "Port 5001 already in use"
- Change port in [app.py](app.py:374) last line
- Update gateway service URL accordingly

---

## Future Enhancements

1. Add authentication/authorization for admin endpoints
2. Implement advanced seating algorithms
3. Add PDF export for seating plans
4. Add seat swapping functionality
5. Implement room allocation optimization
6. Add support for special seating requirements
7. Generate hall tickets with seat numbers
