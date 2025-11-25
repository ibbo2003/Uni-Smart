from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from scheduler import generate_semester_timetable
from dotenv import load_dotenv
import os
from auth_middleware import require_admin_or_faculty

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE')
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        print("[PYTHON] [OK] Database connection successful.")
        return conn
    except mysql.connector.Error as err:
        print(f"[PYTHON] [ERROR] Database connection failed: {err}")
        return None

@app.route('/generate', methods=['POST'])
@require_admin_or_faculty
def generate():
    """
    Generate timetable - ADMIN and FACULTY only
    Requires JWT authentication
    """
    user = request.current_user
    print(f'[PYTHON] Received request from {user["role"]} user (ID: {user["id"]})')
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Could not connect to the database"}), 500
    
    try:
        data = request.json
        subjects_data = data['subjects']
        
        #conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        print('[PYTHON] [DB] Fetching existing data from database...')
        cursor.execute("SELECT * FROM scheduled_classes")
        master_schedule = cursor.fetchall()
        cursor.execute("SELECT * FROM faculty")
        faculties = {row['id']: row for row in cursor.fetchall()}
        cursor.execute("SELECT * FROM sections")
        sections = {row['id']: row for row in cursor.fetchall()}
        cursor.execute("SELECT * FROM lab_rooms")
        lab_rooms = {row['id']: row for row in cursor.fetchall()}
        
        generated_timetable = generate_semester_timetable(
            subjects_data, faculties, sections, lab_rooms, master_schedule
        )

        cursor.close()
        conn.close()
        return jsonify(generated_timetable)
    except Exception as e:
        print(f"[PYTHON] [ERROR] An error occurred during generation:")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("[PYTHON] Database connection closed.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)