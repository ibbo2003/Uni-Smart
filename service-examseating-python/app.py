# app.py
from flask import Flask, request, jsonify
import mysql.connector
import os 
from dotenv import load_dotenv
from seating_algorithm import arrange_seats
import traceback

load_dotenv()
app = Flask(__name__)

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': 'unismart_db'
}

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

if __name__ == '__main__':
    # Run on a different port than the timetable service
    app.run(debug=True, port=5001)