"""
Management command to fix student department assignments based on USN.
Maps students with CS in USN to CSE department, and similar mappings.
"""

from django.core.management.base import BaseCommand
from results.models import Student, Department


class Command(BaseCommand):
    help = 'Fix student department assignments based on USN department codes'

    def handle(self, *args, **options):
        self.stdout.write('Fixing student department assignments...')

        # Map USN department codes to actual department codes
        dept_code_mapping = {
            'CS': 'CSE',  # Computer Science -> Computer Science and Engineering
            'EC': 'ECE',  # Electronics and Communication
            'ME': 'MECH', # Mechanical Engineering
            'CV': 'CIVIL', # Civil Engineering
            'EE': 'EEE',  # Electrical and Electronics Engineering
            'IS': 'ISE',  # Information Science and Engineering
            'TE': 'TCE',  # Telecommunication Engineering
            'BT': 'BTE',  # Biotechnology Engineering
            'CH': 'CHEM', # Chemical Engineering
            'IM': 'IEM',  # Industrial Engineering and Management
            'ML': 'AIML', # Machine Learning -> AI and ML
            'AI': 'AIML', # Artificial Intelligence -> AI and ML
        }

        students = Student.objects.all()
        updated_count = 0
        not_found_depts = set()

        for student in students:
            if len(student.usn) >= 7:
                # Extract department code from USN (e.g., 2AB22CS008 -> CS)
                usn_dept_code = student.usn[5:7]

                # Get the mapped department code
                correct_dept_code = dept_code_mapping.get(usn_dept_code, usn_dept_code)

                # Check if student is assigned to wrong department
                if student.department.code != correct_dept_code:
                    # Try to find the correct department
                    try:
                        correct_dept = Department.objects.get(code__iexact=correct_dept_code, is_active=True)
                        old_dept = student.department.code
                        student.department = correct_dept
                        student.save()
                        updated_count += 1
                        self.stdout.write(
                            f'  Updated {student.usn}: {old_dept} -> {correct_dept_code}'
                        )
                    except Department.DoesNotExist:
                        not_found_depts.add(correct_dept_code)
                        self.stdout.write(
                            self.style.WARNING(
                                f'  Department {correct_dept_code} not found for {student.usn}'
                            )
                        )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully updated {updated_count} student records')
        )

        if not_found_depts:
            self.stdout.write(
                self.style.WARNING(
                    f'\nDepartments not found: {", ".join(not_found_depts)}'
                )
            )
            self.stdout.write('Please create these departments in the admin panel first.')
