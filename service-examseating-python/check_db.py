import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database='unismart_db'
)

cursor = conn.cursor(dictionary=True)

print("=" * 50)
print("DATABASE STATUS CHECK")
print("=" * 50)

# Check counts
cursor.execute('SELECT COUNT(*) as count FROM students')
print(f"\nStudents: {cursor.fetchone()['count']}")

cursor.execute('SELECT COUNT(*) as count FROM exam_rooms')
print(f"Exam Rooms: {cursor.fetchone()['count']}")

cursor.execute('SELECT COUNT(*) as count FROM exams')
print(f"Exams: {cursor.fetchone()['count']}")

cursor.execute('SELECT COUNT(*) as count FROM exam_registrations')
print(f"Registrations: {cursor.fetchone()['count']}")

# Show exam details
print("\n" + "=" * 50)
print("EXAMS DETAILS")
print("=" * 50)
cursor.execute('SELECT * FROM exams')
exams = cursor.fetchall()
for e in exams:
    print(f"\nExam ID: {e['id']}")
    print(f"  Subject: {e['subject_code']}")
    print(f"  Date: {e['exam_date']}")
    print(f"  Session: {e['exam_session']}")

# Show registrations per exam
print("\n" + "=" * 50)
print("REGISTRATIONS PER EXAM")
print("=" * 50)
cursor.execute('''
    SELECT e.id, e.subject_code, e.exam_date, e.exam_session,
           COUNT(er.student_usn) as students
    FROM exams e
    LEFT JOIN exam_registrations er ON e.id = er.exam_id
    GROUP BY e.id
''')
result = cursor.fetchall()
for r in result:
    print(f"\n{r['subject_code']} ({r['exam_date']} {r['exam_session']})")
    print(f"  Registered Students: {r['students']}")

# Show room details
print("\n" + "=" * 50)
print("EXAM ROOMS")
print("=" * 50)
cursor.execute('SELECT * FROM exam_rooms')
rooms = cursor.fetchall()
for room in rooms:
    print(f"\nRoom: {room['id']}")
    print(f"  Layout: {room['num_rows']} rows x {room['num_cols']} cols")
    print(f"  Capacity: {room['capacity']} seats")

# Show sample students
print("\n" + "=" * 50)
print("SAMPLE STUDENTS (first 5)")
print("=" * 50)
cursor.execute('SELECT * FROM students LIMIT 5')
students = cursor.fetchall()
for s in students:
    print(f"\n{s['usn']}: {s['name']} (Section: {s['section_id']})")

conn.close()

print("\n" + "=" * 50)
print("To generate seating, use:")
print(f"  Date: {exams[0]['exam_date']}")
print(f"  Session: {exams[0]['exam_session']}")
print("=" * 50)
