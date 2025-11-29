CREATE DATABASE IF NOT EXISTS unismart_db;
USE unismart_db;

-- Timetable schema
CREATE TABLE IF NOT EXISTS faculty (
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sections (
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  semester VARCHAR(255) NOT NULL,
  classroom VARCHAR(255) NOT NULL COMMENT 'Default classroom for theory subjects.',
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS lab_rooms (
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS subjects (
  subject_code VARCHAR(255) NOT NULL,
  section_id VARCHAR(255) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  subject_type VARCHAR(50),
  theory_hours INT DEFAULT 0,
  lab_hours INT DEFAULT 0,
  no_of_batches INT DEFAULT 1,
  theory_faculty_id VARCHAR(255) NULL,
  lab_faculty_id VARCHAR(255) NULL,
  
  PRIMARY KEY (subject_code, section_id),
  
  INDEX (section_id),
  FOREIGN KEY (theory_faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
  FOREIGN KEY (lab_faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS scheduled_classes;

CREATE TABLE scheduled_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day INT NOT NULL,
  period INT NOT NULL,
  subject_code VARCHAR(255) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  subject_type VARCHAR(50),
  faculty_id VARCHAR(255) NOT NULL,
  section_id VARCHAR(255) NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  batch_number INT DEFAULT 0,
  is_theory BOOLEAN DEFAULT TRUE,
  
  -- ✅ USE INDEXES (not UNIQUE constraints)
  INDEX idx_faculty_schedule (faculty_id, day, period),
  INDEX idx_section_schedule (section_id, day, period),
  INDEX idx_room_schedule (room_id, day, period),
  INDEX idx_day_period (day, period),
  
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Exam Seating Plan
USE unismart_db;

-- Stores information about exam rooms, including their layout
CREATE TABLE IF NOT EXISTS exam_rooms (
  id VARCHAR(255) PRIMARY KEY,
  num_rows INT NOT NULL,
  num_cols INT NOT NULL,
  capacity INT NOT NULL
);

-- Stores the list of exams with their date and session
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  exam_session ENUM('morning', 'afternoon') NOT NULL,
  UNIQUE KEY unique_exam (subject_code, exam_date, exam_session)
);

-- A simple table for student information
CREATE TABLE IF NOT EXISTS students (
  usn VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  section_id VARCHAR(255)
);

-- Maps which students are registered for which exams
CREATE TABLE IF NOT EXISTS exam_registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(255) NOT NULL,
  exam_id INT NOT NULL,
  FOREIGN KEY (student_usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (student_usn, exam_id)
);

-- This is the MASTER table to store the final generated seating plan
CREATE TABLE IF NOT EXISTS exam_seating_plan (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(255) NOT NULL,
  exam_id INT NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  row_num INT NOT NULL,
  col_num INT NOT NULL,
  FOREIGN KEY (student_usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES exam_rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_seat (exam_id, room_id, row_num, col_num)
);

-- Internal exam seating plan table (supports 2 students per seat)


CREATE TABLE IF NOT EXISTS internal_exam_seating_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(255) NOT NULL,
  exam_id INT NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  row_num INT NOT NULL,
  col_num INT NOT NULL,
  seat_position TINYINT NOT NULL COMMENT '1 for first student, 2 for second student in the same seat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES exam_rooms(id) ON DELETE CASCADE,

  UNIQUE KEY unique_student_exam (student_usn, exam_id),
  INDEX idx_exam_room (exam_id, room_id),
  INDEX idx_seat_position (room_id, row_num, col_num)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;


select * from students;

-- Truncate all the files
SET FOREIGN_KEY_CHECKS = 0; 

TRUNCATE TABLE scheduled_classes;
TRUNCATE TABLE exam_seating_plan;
TRUNCATE TABLE internal_exam_seating_plan;
TRUNCATE TABLE exam_registrations;
TRUNCATE TABLE subjects;
TRUNCATE TABLE exams;
TRUNCATE TABLE students;
TRUNCATE TABLE faculty;
TRUNCATE TABLE sections;
TRUNCATE TABLE exam_rooms;
TRUNCATE TABLE lab_rooms;

-- -- Re-enable the foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO lab_rooms (id, name) VALUES
('LAB1', 'Computer Lab 1'), ('LAB2', 'Computer Lab 2'),
('LAB3', 'Computer Lab 3'), ('LAB4', 'Computer Lab 4') ;

SELECT * FROM scheduled_classes 
WHERE section_id = '7_A' 
ORDER BY day, period;

SELECT section_id, day, period, COUNT(DISTINCT subject_code) as parallel_lab_count
FROM scheduled_classes
WHERE is_theory = 0
GROUP BY section_id, day, period
HAVING parallel_lab_count > 1;

-- Delete all timetable entries for section 5A
DELETE FROM scheduled_classes 
WHERE section_id = '5_A';

-- Check what's actually in the database for Monday P0 and P1
SELECT 
    day,
    period,
    subject_code,
    batch_number,
    is_theory,
    faculty_id,
    room_id
FROM scheduled_classes
WHERE section_id = '5_A'
  AND day = 0  -- Monday
  AND period IN (0, 1)
  AND is_theory = 0
ORDER BY period, batch_number;

-- Insert the missing entry manually
INSERT INTO scheduled_classes (
    day, period, subject_code, subject_name, subject_type,
    faculty_id, section_id, room_id, batch_number, is_theory
)
SELECT 
    0 as day,
    0 as period,
    'BCSL504' as subject_code,
    'Computer Networks Lab' as subject_name,  -- Adjust name
    'PCCL' as subject_type,  -- Adjust type
    'MUQEET' as faculty_id,
    '5_A' as section_id,
    'LAB4' as room_id,
    2 as batch_number,
    0 as is_theory
WHERE NOT EXISTS (
    SELECT 1 FROM scheduled_classes
    WHERE day = 0 AND period = 0 
      AND subject_code = 'BCSL504' 
      AND batch_number = 2
);

-- Verify
SELECT * FROM scheduled_classes
WHERE day = 0 AND period IN (0,1) AND is_theory = 0 
ORDER BY period, batch_number;


-- Check if any lab room is double-booked
SELECT 
    room_id,
    day,
    period,
    COUNT(DISTINCT CONCAT(section_id, '-', batch_number)) as concurrent_usage,
    GROUP_CONCAT(
        CONCAT(section_id, ' B', batch_number, ' (', subject_code, ')')
        SEPARATOR ' | '
    ) as conflicting_classes
FROM scheduled_classes
WHERE is_theory = 0
GROUP BY room_id, day, period
HAVING COUNT(DISTINCT CONCAT(section_id, '-', batch_number)) > 1
ORDER BY room_id, day, period;

SELECT * FROM sections;

SHOW TABLE STATUS LIKE 'students';

DELIMITER $$

CREATE TRIGGER trg_generate_student_email
BEFORE INSERT ON students
FOR EACH ROW
BEGIN
    IF NEW.email IS NULL OR NEW.email = '' THEN
        SET NEW.email = CONCAT(LOWER(NEW.usn), '@anjuman.edu.in');
    END IF;
END$$

DELIMITER ;


UPDATE students
SET email = CONCAT(LOWER(usn), '@anjuman.edu.in');


