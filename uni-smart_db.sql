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

CREATE TABLE IF NOT EXISTS scheduled_classes (
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

  UNIQUE KEY faculty_slot_unique (day, period, faculty_id),
  UNIQUE KEY section_slot_unique (day, period, section_id),
  UNIQUE KEY room_slot_unique (day, period, room_id),
  
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

INSERT IGNORE INTO lab_rooms (id, name) VALUES
('LAB1', 'Computer Lab 1'), ('LAB2', 'Computer Lab 2'),
('LAB3', 'Computer Lab 3'), ('LAB4', 'Computer Lab 4') ;

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

