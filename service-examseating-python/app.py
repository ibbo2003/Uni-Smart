# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
from seating_algorithm import arrange_seats
import traceback
import pandas as pd
from docx import Document
import PyPDF2
import re
import io

load_dotenv()
app = Flask(__name__)
CORS(app)

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': 'unismart_db'
}

# ================== EXAM ROOMS ENDPOINTS ==================
@app.route('/rooms', methods=['GET'])
def get_all_rooms():
    """Get all exam rooms"""
    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM exam_rooms ORDER BY id")
        rooms = cursor.fetchall()
        return jsonify(rooms), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/rooms', methods=['POST'])
def create_room():
    """Create a new exam room"""
    data = request.json
    room_id = data.get('id')
    num_rows = data.get('num_rows')
    num_cols = data.get('num_cols')

    if not all([room_id, num_rows, num_cols]):
        return jsonify({"error": "Missing required fields"}), 400

    capacity = num_rows * num_cols

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO exam_rooms (id, num_rows, num_cols, capacity) VALUES (%s, %s, %s, %s)",
            (room_id, num_rows, num_cols, capacity)
        )
        conn.commit()
        return jsonify({"message": "Room created successfully", "id": room_id}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Room ID already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/rooms/<room_id>', methods=['PUT'])
def update_room(room_id):
    """Update an existing exam room"""
    data = request.json
    num_rows = data.get('num_rows')
    num_cols = data.get('num_cols')

    if not all([num_rows, num_cols]):
        return jsonify({"error": "Missing required fields"}), 400

    capacity = num_rows * num_cols

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE exam_rooms SET num_rows = %s, num_cols = %s, capacity = %s WHERE id = %s",
            (num_rows, num_cols, capacity, room_id)
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Room not found"}), 404

        return jsonify({"message": "Room updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/rooms/<room_id>', methods=['DELETE'])
def delete_room(room_id):
    """Delete an exam room"""
    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM exam_rooms WHERE id = %s", (room_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Room not found"}), 404

        return jsonify({"message": "Room deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ================== EXAMS ENDPOINTS ==================
@app.route('/exams', methods=['GET'])
def get_all_exams():
    """Get all exams"""
    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM exams ORDER BY exam_date, exam_session")
        exams = cursor.fetchall()
        return jsonify(exams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/exams', methods=['POST'])
def create_exam():
    """Create a new exam"""
    data = request.json
    subject_code = data.get('subject_code')
    exam_date = data.get('exam_date')
    exam_session = data.get('exam_session')

    if not all([subject_code, exam_date, exam_session]):
        return jsonify({"error": "Missing required fields"}), 400

    if exam_session not in ['morning', 'afternoon']:
        return jsonify({"error": "Invalid exam_session. Must be 'morning' or 'afternoon'"}), 400

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO exams (subject_code, exam_date, exam_session) VALUES (%s, %s, %s)",
            (subject_code, exam_date, exam_session)
        )
        conn.commit()
        exam_id = cursor.lastrowid
        return jsonify({"message": "Exam created successfully", "id": exam_id}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Exam already exists for this subject, date, and session"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/exams/<int:exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    """Delete an exam"""
    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM exams WHERE id = %s", (exam_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Exam not found"}), 404

        return jsonify({"message": "Exam deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ================== EXAM REGISTRATIONS ENDPOINTS ==================
@app.route('/registrations', methods=['POST'])
def create_registration():
    """Register a student for an exam"""
    data = request.json
    student_usn = data.get('student_usn')
    exam_id = data.get('exam_id')

    if not all([student_usn, exam_id]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO exam_registrations (student_usn, exam_id) VALUES (%s, %s)",
            (student_usn, exam_id)
        )
        conn.commit()
        registration_id = cursor.lastrowid
        return jsonify({"message": "Registration created successfully", "id": registration_id}), 201
    except mysql.connector.IntegrityError as e:
        if 'Duplicate entry' in str(e):
            return jsonify({"error": "Student already registered for this exam"}), 409
        return jsonify({"error": "Foreign key constraint failed. Check student_usn and exam_id"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/registrations/batch', methods=['POST'])
def create_batch_registrations():
    """Register multiple students for an exam"""
    data = request.json
    exam_id = data.get('exam_id')
    student_usns = data.get('student_usns', [])

    if not exam_id or not student_usns:
        return jsonify({"error": "Missing required fields"}), 400

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor()

        # Prepare batch insert
        values = [(usn, exam_id) for usn in student_usns]
        cursor.executemany(
            "INSERT IGNORE INTO exam_registrations (student_usn, exam_id) VALUES (%s, %s)",
            values
        )
        conn.commit()

        return jsonify({
            "message": f"Successfully registered {cursor.rowcount} students",
            "registered_count": cursor.rowcount
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/exams/<int:exam_id>/registrations', methods=['GET'])
def get_exam_registrations(exam_id):
    """Get all students registered for a specific exam"""
    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.registration_id, r.student_usn, s.name, s.section_id
            FROM exam_registrations r
            JOIN students s ON r.student_usn = s.usn
            WHERE r.exam_id = %s
            ORDER BY r.student_usn
        """, (exam_id,))
        registrations = cursor.fetchall()
        return jsonify(registrations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ================== SEATING PLAN ENDPOINTS ==================
@app.route('/generate_seating', methods=['POST'])
def generate_seating_plan():
    print('-----------------------------------------')
    print('[EXAM_SERVICE] Received request from gateway...')
    data = request.json
    exam_date = data['exam_date']
    exam_session = data['exam_session']

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor(dictionary=True)

        print('[EXAM_SERVICE] 💾 Fetching data from database...')

        # 1. Fetch all available exam rooms
        cursor.execute("SELECT id, num_rows, num_cols FROM exam_rooms")
        rooms_data = cursor.fetchall()
        print(f"   - Found {len(rooms_data)} rooms.")

        # 2. Fetch all students registered for exams on the given date/session
        query = """
            SELECT r.student_usn, e.subject_code
            FROM exam_registrations r
            JOIN exams e ON r.exam_id = e.id
            WHERE e.exam_date = %s AND e.exam_session = %s
        """
        cursor.execute(query, (exam_date, exam_session))
        registrations = cursor.fetchall()

        # Group students by subject
        students_by_subject = {}
        for reg in registrations:
            subject = reg['subject_code']
            if subject not in students_by_subject:
                students_by_subject[subject] = []
            students_by_subject[subject].append(reg['student_usn'])

        print(f"   - Found {len(registrations)} student registrations across {len(students_by_subject)} subjects.")

        # 3. Run the seating algorithm
        print('[EXAM_SERVICE] ⚙️ Starting seating arrangement algorithm...')
        seating_plan = arrange_seats(rooms_data, students_by_subject)

        print('[EXAM_SERVICE] ➡ Sending response back to the gateway...')
        return jsonify(seating_plan)

    except Exception as e:
        print(f"[EXAM_SERVICE] ❌ An error occurred:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/seating-plan', methods=['GET'])
def get_seating_plan():
    """Get saved seating plan for a specific exam date and session"""
    exam_date = request.args.get('exam_date')
    exam_session = request.args.get('exam_session')

    if not exam_date or not exam_session:
        return jsonify({"error": "Missing exam_date or exam_session parameters"}), 400

    conn = mysql.connector.connect(**db_config)
    try:
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT
                esp.student_usn,
                s.name as student_name,
                e.subject_code,
                esp.room_id,
                esp.row_num,
                esp.col_num
            FROM exam_seating_plan esp
            JOIN students s ON esp.student_usn = s.usn
            JOIN exams e ON esp.exam_id = e.id
            WHERE e.exam_date = %s AND e.exam_session = %s
            ORDER BY esp.room_id, esp.row_num, esp.col_num
        """
        cursor.execute(query, (exam_date, exam_session))
        seating_plan = cursor.fetchall()

        return jsonify(seating_plan), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    # Run on a different port than the timetable service
    app.run(debug=True, port=5001)