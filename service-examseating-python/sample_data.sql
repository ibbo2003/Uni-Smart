-- Sample Data for Exam Seating Module
-- This file contains sample data to help you get started with the exam seating system

USE unismart_db;

-- ================== STEP 1: Insert Sample Students ==================
-- First, ensure we have some students in the system
INSERT IGNORE INTO students (usn, name, section_id) VALUES
('1MS21CS001', 'Aarav Kumar', '7_A'),
('1MS21CS002', 'Bhavya Sharma', '7_A'),
('1MS21CS003', 'Chetan Patel', '7_A'),
('1MS21CS004', 'Divya Reddy', '7_A'),
('1MS21CS005', 'Ekta Singh', '7_A'),
('1MS21CS006', 'Farhan Ali', '7_B'),
('1MS21CS007', 'Geeta Rao', '7_B'),
('1MS21CS008', 'Harsha Varma', '7_B'),
('1MS21CS009', 'Ishaan Joshi', '7_B'),
('1MS21CS010', 'Jaya Desai', '7_B'),
('1MS21CS011', 'Kiran Nair', '5_A'),
('1MS21CS012', 'Lakshmi Iyer', '5_A'),
('1MS21CS013', 'Manoj Gupta', '5_A'),
('1MS21CS014', 'Neha Menon', '5_A'),
('1MS21CS015', 'Om Prakash', '5_A');

-- ================== STEP 2: Create Exam Rooms ==================
-- Define exam halls with their seating capacity (rows x cols)
INSERT IGNORE INTO exam_rooms (id, num_rows, num_cols, capacity) VALUES
('CR-101', 5, 6, 30),   -- Classroom 101: 5 rows, 6 columns = 30 seats
('CR-102', 5, 6, 30),   -- Classroom 102: 5 rows, 6 columns = 30 seats
('CR-103', 6, 8, 48),   -- Classroom 103: 6 rows, 8 columns = 48 seats
('HALL-A', 10, 10, 100); -- Main Hall A: 10 rows, 10 columns = 100 seats

-- ================== STEP 3: Create Exams ==================
-- Define exams with date and session (morning/afternoon)
INSERT IGNORE INTO exams (subject_code, exam_date, exam_session) VALUES
('CS101', '2025-06-01', 'morning'),      -- Programming in C
('CS102', '2025-06-01', 'afternoon'),    -- Data Structures
('CS201', '2025-06-02', 'morning'),      -- Database Management
('CS202', '2025-06-02', 'afternoon'),    -- Computer Networks
('MATH101', '2025-06-03', 'morning');    -- Engineering Mathematics

-- ================== STEP 4: Register Students for Exams ==================
-- Register students for their respective exams

-- All students for CS101 (exam_id = 1)
INSERT IGNORE INTO exam_registrations (student_usn, exam_id) VALUES
('1MS21CS001', 1), ('1MS21CS002', 1), ('1MS21CS003', 1),
('1MS21CS004', 1), ('1MS21CS005', 1), ('1MS21CS006', 1),
('1MS21CS007', 1), ('1MS21CS008', 1), ('1MS21CS009', 1),
('1MS21CS010', 1), ('1MS21CS011', 1), ('1MS21CS012', 1),
('1MS21CS013', 1), ('1MS21CS014', 1), ('1MS21CS015', 1);

-- Students for CS102 (exam_id = 2) - afternoon session on same day
INSERT IGNORE INTO exam_registrations (student_usn, exam_id) VALUES
('1MS21CS001', 2), ('1MS21CS002', 2), ('1MS21CS003', 2),
('1MS21CS004', 2), ('1MS21CS005', 2), ('1MS21CS006', 2),
('1MS21CS007', 2), ('1MS21CS008', 2);

-- Students for CS201 (exam_id = 3)
INSERT IGNORE INTO exam_registrations (student_usn, exam_id) VALUES
('1MS21CS006', 3), ('1MS21CS007', 3), ('1MS21CS008', 3),
('1MS21CS009', 3), ('1MS21CS010', 3), ('1MS21CS011', 3),
('1MS21CS012', 3), ('1MS21CS013', 3), ('1MS21CS014', 3),
('1MS21CS015', 3);

-- ================== VERIFICATION QUERIES ==================

-- Check total students
SELECT COUNT(*) as total_students FROM students;

-- Check exam rooms and capacities
SELECT * FROM exam_rooms ORDER BY capacity;

-- Check exams schedule
SELECT
    e.id,
    e.subject_code,
    e.exam_date,
    e.exam_session,
    COUNT(er.student_usn) as registered_students
FROM exams e
LEFT JOIN exam_registrations er ON e.id = er.exam_id
GROUP BY e.id
ORDER BY e.exam_date, e.exam_session;

-- Check students registered for a specific exam
SELECT
    e.subject_code,
    e.exam_date,
    e.exam_session,
    s.usn,
    s.name,
    s.section_id
FROM exam_registrations er
JOIN exams e ON er.exam_id = e.id
JOIN students s ON er.student_usn = s.usn
WHERE e.exam_date = '2025-06-01' AND e.exam_session = 'morning'
ORDER BY s.usn;

-- Check total capacity vs students for each exam
SELECT
    e.subject_code,
    e.exam_date,
    e.exam_session,
    COUNT(er.student_usn) as registered_students,
    SUM(room.capacity) as total_room_capacity
FROM exams e
LEFT JOIN exam_registrations er ON e.id = er.exam_id
CROSS JOIN (SELECT SUM(capacity) as capacity FROM exam_rooms) room
GROUP BY e.id;

-- View all exam rooms
SELECT
    id as room_id,
    num_rows,
    num_cols,
    capacity,
    CONCAT(num_rows, ' x ', num_cols, ' = ', capacity, ' seats') as layout
FROM exam_rooms
ORDER BY capacity;
