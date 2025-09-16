# seating_algorithm.py
import pandas as pd

class Room:
    def __init__(self, name, num_rows, num_cols):
        self.name = name
        self.rows = num_rows 
        self.cols = num_cols 
        self.capacity = num_rows * num_cols
        self.seating = [['' for _ in range(num_cols)] for _ in range(num_rows)]
        self.student_count = 0

    def is_full(self):
        return self.student_count >= self.capacity

    def place_student(self, usn):
        if self.is_full():
            return None
        row = self.student_count // self.cols
        col = self.student_count % self.cols
        self.seating[row][col] = usn
        self.student_count += 1
        return (row, col)

# This is the main function that runs your algorithm
def arrange_seats(rooms_data, students_by_subject):
    rooms = [Room(r['id'], r['num_rows'], r['num_cols']) for r in rooms_data]
    
    # Flatten the list of all students
    all_students = []
    for subject, students in students_by_subject.items():
        for usn in students:
            all_students.append({'usn': usn, 'subject': subject})

    # Basic allocation: fill rooms one by one
    seating_plan = []
    student_index = 0
    for room in rooms:
        while not room.is_full() and student_index < len(all_students):
            student_info = all_students[student_index]
            usn = student_info['usn']
            
            coords = room.place_student(usn)
            if coords:
                seating_plan.append({
                    'student_usn': usn,
                    'subject_code': student_info['subject'],
                    'room_id': room.name,
                    'row_num': coords[0],
                    'col_num': coords[1]
                })
            student_index += 1

    print(f"Algorithm finished. Placed {len(seating_plan)} students.")
    return seating_plan