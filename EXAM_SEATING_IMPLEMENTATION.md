# Exam Seating System - Implementation Summary

## Overview
The exam seating system now supports two types of exams with separate database tables and components:
- **External Exams:** 1 student per seat, subjects alternating
- **Internal Exams:** 2 students per seat from different subjects

---

## Database Changes

### Step 1: Run the SQL Script
Execute the SQL script to create the internal exam seating table:

**File:** `create_internal_exam_seating_table.sql`

```sql
USE unismart_db;

CREATE TABLE IF NOT EXISTS internal_exam_seating_plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_usn VARCHAR(20) NOT NULL,
    exam_id INT NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    row_num INT NOT NULL,
    col_num INT NOT NULL,
    seat_position TINYINT NOT NULL COMMENT '1 for first student, 2 for second student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_usn) REFERENCES students(usn) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,

    UNIQUE KEY unique_student_exam (student_usn, exam_id),
    INDEX idx_exam_room (exam_id, room_id),
    INDEX idx_seat_position (room_id, row_num, col_num)
);
```

**How to run:**
1. Open MySQL Workbench or your MySQL client
2. Copy and paste the SQL from `create_internal_exam_seating_table.sql`
3. Execute the script

---

## Backend Changes

### 1. Python Service (seating_algorithm.py)
✅ Already implemented with two functions:
- `arrange_seats_internal()` - Places 2 students per seat
- `arrange_seats_external()` - Places 1 student per seat

### 2. Gateway (server.js)
✅ Updated to:
- Accept `exam_type` parameter from frontend
- Save to `internal_exam_seating_plan` table for internal exams
- Save to `exam_seating_plan` table for external exams
- Track `seat_position` (1 or 2) for internal exams

---

## Frontend Structure

### Current: Single Component
Currently using one component for both exam types:
- **File:** `frontend/app/exam-seating/page.tsx`
- **Features:**
  - Exam type dropdown selector
  - Statistics panel showing students per desk
  - Display grid supporting multiple students per seat
  - PDF export functionality

### Recommended: Separate Components (Future Enhancement)

You can optionally create separate pages:

```
frontend/app/exam-seating/
├── page.tsx (main page with navigation)
├── external/
│   └── page.tsx (external exam component)
└── internal/
    └── page.tsx (internal exam component)
```

**Benefits:**
- Cleaner code separation
- Different UI/UX for each exam type
- Easier to maintain and extend

---

## How It Works

### External Exams
1. User selects "External" exam type
2. Algorithm places 1 student per seat
3. Subjects alternate across the room
4. Data saved to `exam_seating_plan` table
5. Display shows 1 student per desk

### Internal Exams
1. User selects "Internal" exam type
2. Algorithm places 2 students per seat (different subjects)
3. Students from different subjects share each seat
4. Data saved to `internal_exam_seating_plan` table with `seat_position`
5. Display shows 2 students per desk with visual separator

---

## Database Schema Comparison

### External Exam Table (exam_seating_plan)
```
- student_usn (PK, FK)
- exam_id (FK)
- room_id
- row_num
- col_num
- UNIQUE(exam_id, room_id, row_num, col_num)  ← Only 1 student per position
```

### Internal Exam Table (internal_exam_seating_plan)
```
- id (PK)
- student_usn (FK)
- exam_id (FK)
- room_id
- row_num
- col_num
- seat_position (1 or 2)  ← Allows 2 students per position
- UNIQUE(student_usn, exam_id)  ← Student can only be assigned once
```

---

## Testing

### Test External Exam:
1. Go to exam seating page
2. Select "External (1 student/seat)"
3. Select exam date and session
4. Generate seating plan
5. Verify "Avg Students/Desk" = 1.0
6. Verify each desk shows 1 student

### Test Internal Exam:
1. Go to exam seating page
2. Select "Internal (2 students/seat)"
3. Select exam date and session
4. Generate seating plan
5. Verify "Avg Students/Desk" = 2.0
6. Verify each desk shows 2 students separated by a blue line

---

## Files Modified

### Backend:
1. ✅ `service-examseating-python/seating_algorithm.py` - Algorithm logic
2. ✅ `service-examseating-python/app.py` - Accept exam_type parameter
3. ✅ `gateway-express/server.js` - Route to correct table, handle exam_type

### Frontend:
1. ✅ `frontend/app/exam-seating/page.tsx` - UI with exam type selector

### Database:
1. ✅ `create_internal_exam_seating_table.sql` - New table for internal exams

---

## Next Steps (Optional Enhancements)

### 1. Separate Frontend Components
Create dedicated pages for each exam type for better UX.

### 2. Viewing Seating Plans
Add endpoints to retrieve and display saved seating plans:
- GET `/api/exams/seating-plan?date=X&session=Y&type=internal`
- Show historical seating arrangements

### 3. Student View
Allow students to see their assigned seat:
- Check both tables based on exam type
- Show room, row, column, and seat position

### 4. Export Options
- Export to Excel with separate sheets for each room
- Generate QR codes for each seat
- Print labels for desk numbering

---

## Summary

✅ **Internal exams:** 2 students per seat, separate database table
✅ **External exams:** 1 student per seat, original table
✅ **Algorithm:** Handles both types correctly
✅ **Frontend:** Single component with exam type selector
✅ **Database:** Separate tables maintain data integrity

**Status:** Ready to use after running the SQL script!
