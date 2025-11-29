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
def arrange_seats(rooms_data, students_by_subject, exam_type='external'):
    """
    Arrange seats based on exam type:
    - 'internal': Two students per bench from different subjects
    - 'external': One student per bench, alternating subjects
    """
    rooms = [Room(r['id'], r['num_rows'], r['num_cols']) for r in rooms_data]

    if exam_type == 'internal':
        return arrange_seats_internal(rooms, students_by_subject)
    else:
        return arrange_seats_external(rooms, students_by_subject)


def arrange_seats_internal(rooms, students_by_subject):
    """
    Internal exam: Two students per seat from different subjects
    Each seat has 2 students sitting together, both from different subjects
    """
    seating_plan = []

    # Prepare lists of students by subject
    subject_lists = {}
    for subject, students in students_by_subject.items():
        subject_lists[subject] = list(students)

    # Get list of subjects
    subjects = list(subject_lists.keys())
    if not subjects:
        return seating_plan

    print(f"\n[INTERNAL EXAM] Starting internal exam seating arrangement")
    print(f"  Subjects: {subjects}")
    for subject in subjects:
        print(f"    {subject}: {len(subject_lists[subject])} students")

    # Track current index for each subject
    subject_indices = {subject: 0 for subject in subjects}

    room_idx = 0
    total_students = sum(len(students) for students in subject_lists.values())
    students_placed = 0
    print(f"  Total students to place: {total_students}\n")

    while students_placed < total_students and room_idx < len(rooms):
        room = rooms[room_idx]

        for row in range(room.rows):
            for col in range(room.cols):  # Process each seat
                if students_placed >= total_students:
                    break

                # Try to place 2 students from different subjects on the same seat
                students_for_seat = []
                subjects_used = []

                # Try to find 2 students from different subjects
                for subject in subjects:
                    if len(students_for_seat) >= 2:
                        break

                    # Check if this subject has students left and hasn't been used in this seat
                    if (subject_indices[subject] < len(subject_lists[subject]) and
                        subject not in subjects_used):
                        usn = subject_lists[subject][subject_indices[subject]]
                        students_for_seat.append({'usn': usn, 'subject': subject})
                        subjects_used.append(subject)
                        subject_indices[subject] += 1

                # If we couldn't find 2 students from different subjects,
                # fill remaining with any available student
                if len(students_for_seat) < 2:
                    for subject in subjects:
                        if len(students_for_seat) >= 2:
                            break
                        if subject_indices[subject] < len(subject_lists[subject]):
                            usn = subject_lists[subject][subject_indices[subject]]
                            students_for_seat.append({'usn': usn, 'subject': subject})
                            subject_indices[subject] += 1

                # Place the students on the same seat
                if len(students_for_seat) > 0:
                    print(f"  Placing {len(students_for_seat)} students at desk ({row}, {col}) in room {room.name}")
                    for idx, student_info in enumerate(students_for_seat):
                        print(f"    Student {idx+1}: {student_info['usn']} - {student_info['subject']}")
                        seating_plan.append({
                            'student_usn': student_info['usn'],
                            'subject_code': student_info['subject'],
                            'room_id': room.name,
                            'row_num': row,
                            'col_num': col
                        })
                        students_placed += 1

            if students_placed >= total_students:
                break

        room_idx += 1

    print(f"Internal exam algorithm finished. Placed {len(seating_plan)} students (2 per seat).")
    return seating_plan


def arrange_seats_external(rooms, students_by_subject):
    """
    External exam: One student per seat, alternating subjects
    Each seat has only 1 student. Subjects are alternated throughout the room.
    """
    seating_plan = []

    # Prepare lists of students by subject
    subject_lists = {}
    for subject, students in students_by_subject.items():
        subject_lists[subject] = list(students)

    # Get list of subjects
    subjects = list(subject_lists.keys())
    if not subjects:
        return seating_plan

    # Track current index for each subject
    subject_indices = {subject: 0 for subject in subjects}
    current_subject_idx = 0

    room_idx = 0
    total_students = sum(len(students) for students in subject_lists.values())
    students_placed = 0

    while students_placed < total_students and room_idx < len(rooms):
        room = rooms[room_idx]

        for row in range(room.rows):
            for col in range(room.cols):  # Process each seat
                if students_placed >= total_students:
                    break

                # Rotate through subjects to alternate them
                attempts = 0
                student_placed_in_seat = False

                while attempts < len(subjects) and not student_placed_in_seat:
                    subject = subjects[current_subject_idx % len(subjects)]

                    if subject_indices[subject] < len(subject_lists[subject]):
                        usn = subject_lists[subject][subject_indices[subject]]
                        seating_plan.append({
                            'student_usn': usn,
                            'subject_code': subject,
                            'room_id': room.name,
                            'row_num': row,
                            'col_num': col
                        })
                        subject_indices[subject] += 1
                        students_placed += 1
                        current_subject_idx += 1
                        student_placed_in_seat = True
                    else:
                        current_subject_idx += 1

                    attempts += 1

            if students_placed >= total_students:
                break

        room_idx += 1

    print(f"External exam algorithm finished. Placed {len(seating_plan)} students (one per seat, alternating subjects).")
    return seating_plan