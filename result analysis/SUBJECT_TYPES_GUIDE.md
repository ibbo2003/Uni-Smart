# Subject Types & Audit Courses Guide

## Table of Contents
- [Overview](#overview)
- [Subject Type Comparison](#subject-type-comparison)
- [Understanding Audit Courses](#understanding-audit-courses)
- [CGPA Calculation Rules](#cgpa-calculation-rules)
- [Implementation Details](#implementation-details)
- [Management & Configuration](#management--configuration)
- [FAQs](#faqs)

---

## Overview

UniSmart supports **7 different subject types** as per VTU CBCS 2015-16 regulations. Each type has specific characteristics regarding credits, marks distribution, pass criteria, and CGPA inclusion.

### Why Subject Types Matter

1. **Correct CGPA Calculation**: Different types have different rules
2. **Automatic Grade Assignment**: System knows pass/fail criteria for each type
3. **Transcript Accuracy**: Grades displayed correctly based on type
4. **Compliance**: Follows VTU regulations exactly

---

## Subject Type Comparison

| Type | Credits | Internal | External | Total | Pass Criteria | In CGPA? | Examples |
|------|---------|----------|----------|-------|---------------|----------|----------|
| **THEORY** | 3-4 | 20 | 80 | 100 | IA≥7, Ext≥28, Total≥40 | ✅ Yes | BCS601, BCS602 |
| **LAB** | 2-3 | 20 | 80 | 100 | IA≥7, Ext≥28, Total≥40 | ✅ Yes | BCSL606 |
| **PROJECT** | 1-2 | 0 | 100 | 100 | Total≥40 | ✅ Yes | BCS685 |
| **INTERNSHIP** | 2 | 50 | 50 | 100 | Total≥40 | ✅ Yes | Internship |
| **SEMINAR** | 1 | 100 | 0 | 100 | Total≥40 | ✅ Yes | Seminar |
| **NON_CREDIT** | 0 | 100 | 0 | 100 | Total≥35 | ❌ No | Yoga (BYOK) |
| **AUDIT** | 1 | 100 | 0 | 100 | Total≥35 | ❌ No | Environmental (BES) |

### Detailed Breakdown

#### 1. THEORY (Regular Subjects)
- **Default subject type** for academic courses
- Most common type
- VTU requires passing all three criteria:
  - Internal (CIE) ≥ 35% (7/20)
  - External (SEE) ≥ 35% (28/80)
  - Total ≥ 40% (40/100)
- **Included in CGPA**: ✅ Yes
- **Examples**:
  - BCS601 - Compiler Design
  - BCS602 - Computer Networks
  - BCS603 - Database Management Systems

#### 2. LAB (Laboratory)
- Similar to Theory but for practical subjects
- Same marks distribution and pass criteria as Theory
- Lower credits (typically 2)
- **Included in CGPA**: ✅ Yes
- **Auto-detection**: Code contains "LAB", "L", or "BCSL"
- **Examples**:
  - BCSL606 - Computer Networks Lab
  - BCSL607 - Database Lab

#### 3. PROJECT (Final Year Project)
- No internal marks, only external evaluation
- Typically final year project work
- **Included in CGPA**: ✅ Yes
- **Auto-detection**: "PROJECT" in name or code ends with "85"
- **Examples**:
  - BCS685 - Major Project
  - BCS695 - Minor Project

#### 4. INTERNSHIP
- Evaluation split 50-50 between internal and external
- Industry training courses
- **Included in CGPA**: ✅ Yes
- **Auto-detection**: "INTERNSHIP" or "INTERN" in name/code
- **Examples**:
  - Internship
  - Industry Internship

#### 5. SEMINAR
- Only internal evaluation (100 marks)
- Presentation-based assessment
- **Included in CGPA**: ✅ Yes
- **Auto-detection**: "SEMINAR" in name
- **Examples**:
  - Technical Seminar
  - Project Seminar

#### 6. NON_CREDIT (Mandatory, No Credits)
- **0 credits** - does not contribute to CGPA
- Only internal evaluation (100 marks)
- Pass requirement: ≥35 marks
- Mandatory to graduate but not in GPA
- **Included in CGPA**: ❌ No
- **Auto-detection**: "YOGA", "PHYSICAL EDUCATION", "IKS", "BYOK", "BIKS"
- **Examples**:
  - BYOK - Yoga
  - BIKS - Indian Knowledge System

#### 7. AUDIT (The Special Case)
- **Has 1 credit** but **NOT included in CGPA**
- This is the key difference from Non-Credit
- Only internal evaluation (100 marks)
- Pass requirement: ≥35 marks
- **Included in CGPA**: ❌ No (per VTU rules)
- **Auto-detection**: "ENVIRONMENTAL", "CONSTITUTION", "BES", "BCIV"
- **Examples**:
  - BES - Environmental Studies
  - BCIV - Constitution of India, Professional Ethics & Human Rights

---

## Understanding Audit Courses

### What Are Audit Courses?

**Definition:** Audit courses are special VTU subjects that:
1. Carry credits (typically 1)
2. Have graded evaluation (O/S/A/B/C/D/E/F)
3. Are **NOT included** in CGPA/SGPA calculations
4. Must be passed to graduate
5. Appear on transcripts

### Why Audit Courses Exist

VTU introduced Audit courses for subjects that are:
- Important for overall education
- Not directly related to core engineering
- Should not affect technical GPA

**Examples:**
- **Environmental Studies (BES)**: 1 credit, graded, not in CGPA
- **Constitution of India (BCIV)**: 1 credit, graded, not in CGPA

### Key Differences

#### Audit vs Non-Credit Mandatory

```
NON-CREDIT MANDATORY (e.g., Yoga)
├── Credits: 0
├── Evaluation: Pass/Fail
├── In Transcript: Yes
├── In CGPA: No
└── Examples: Yoga, Physical Education, IKS

AUDIT COURSE (e.g., Environmental Studies)
├── Credits: 1
├── Evaluation: Graded (O/S/A/B/C/D/E/F)
├── In Transcript: Yes
├── In CGPA: No
└── Examples: Environmental Studies, Constitution
```

#### Audit vs Regular Theory

```
REGULAR THEORY (e.g., Compiler Design)
├── Credits: 3-4
├── Pass Criteria: IA≥7, Ext≥28, Total≥40
├── In CGPA: Yes
└── Full evaluation

AUDIT COURSE (e.g., Environmental Studies)
├── Credits: 1
├── Pass Criteria: Total≥35
├── In CGPA: No
└── Simplified evaluation
```

### Impact on Transcript

**Sample Transcript:**

| Subject Code | Subject Name | Credits | Marks | Grade | In CGPA? |
|-------------|--------------|---------|-------|-------|----------|
| BCS601 | Compiler Design | 4 | 85 | S | ✅ Yes |
| BCS602 | Computer Networks | 4 | 78 | A | ✅ Yes |
| **BES** | **Environmental Studies** | **1** | **90** | **O** | **❌ No** |
| BCSL606 | CN Lab | 2 | 82 | S | ✅ Yes |
| **BYOK** | **Yoga** | **0** | **Pass** | **P** | **❌ No** |

**CGPA Calculation:**
```
Only BCS601, BCS602, BCSL606 are included
BES and BYOK are excluded

SGPA = (4×9 + 4×8 + 2×9) / (4+4+2) = 86 / 10 = 8.6
```

---

## CGPA Calculation Rules

### Formula

```python
SGPA = Σ(Grade Point × Credits) / Σ(Credits)
```

**For included subjects only!**

### What's Included

✅ **Included in CGPA:**
- THEORY
- LAB
- PROJECT
- INTERNSHIP
- SEMINAR

❌ **Excluded from CGPA:**
- NON_CREDIT (0 credits)
- AUDIT (has credits but excluded per VTU rules)

### Example Calculation

**Semester 6 Results:**

| Subject | Type | Credits | Grade | Grade Point | Included? |
|---------|------|---------|-------|-------------|-----------|
| BCS601 | THEORY | 4 | S | 9 | ✅ Yes |
| BCS602 | THEORY | 4 | A | 8 | ✅ Yes |
| BES | **AUDIT** | **1** | **O** | **10** | **❌ No** |
| BCSL606 | LAB | 2 | S | 9 | ✅ Yes |
| BCS603 | THEORY | 3 | B | 7 | ✅ Yes |
| BYOK | NON_CREDIT | 0 | P | - | ❌ No |

**Calculation:**
```
Credits used: 4 + 4 + 2 + 3 = 13
(Notice: BES credit NOT included)

Grade Points: (4×9) + (4×8) + (2×9) + (3×7)
            = 36 + 32 + 18 + 21
            = 107

SGPA = 107 / 13 = 8.23
```

**CGPA** follows the same principle across all semesters.

---

## Implementation Details

### Database Model

```python
class Subject(models.Model):
    subject_type = models.CharField(
        max_length=30,
        choices=[
            ('THEORY', 'Theory'),
            ('LAB', 'Laboratory'),
            ('PROJECT', 'Project'),
            ('INTERNSHIP', 'Internship'),
            ('SEMINAR', 'Seminar'),
            ('NON_CREDIT', 'Non-Credit Mandatory Course'),
            ('AUDIT', 'Audit Course'),  # NEW!
        ],
        default='THEORY'
    )
```

### Auto-Configuration

When subject_type = 'AUDIT', system automatically sets:
```python
credits = 1  # Default, can be modified
max_internal_marks = 100
max_external_marks = 0
max_total_marks = 100
min_internal_marks = 35
min_external_marks = 0
min_total_marks = 35
```

### CGPA Calculation Logic

```python
def calculate_cgpa(self):
    results = self.results.filter(is_latest=True, result_status='P')

    for result in results:
        # Skip NON_CREDIT and AUDIT courses
        if result.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
            continue  # Excluded!

        if result.subject.credits:
            total_grade_points += result.grade_point * result.subject.credits
            total_credits += result.subject.credits

    cgpa = total_grade_points / total_credits
    return round(cgpa, 2)
```

### Scraper Auto-Detection

```python
# Detect Audit Courses
if any(keyword in subject_name.upper() for keyword in
       ['ENVIRONMENTAL', 'CONSTITUTION', 'PROFESSIONAL ETHICS']):
    subject_type = 'AUDIT'
    max_internal = 100
    max_external = 0
    credits = 1

elif subject_code.upper() in ['BES', 'BCIV']:
    subject_type = 'AUDIT'
    max_internal = 100
    max_external = 0
    credits = 1
```

### Grade Calculation

```python
def calculate_grade(self):
    if self.subject.subject_type in ['NON_CREDIT', 'AUDIT']:
        # Pass if >= 35 marks
        if self.total_marks < 35:
            return 'F'

        # Grade based on percentage
        percentage = self.total_marks
        if percentage >= 90: return 'O'
        elif percentage >= 80: return 'S'
        elif percentage >= 70: return 'A'
        elif percentage >= 60: return 'B'
        elif percentage >= 50: return 'C'
        elif percentage >= 45: return 'D'
        elif percentage >= 35: return 'E'
        else: return 'F'
```

---

## Management & Configuration

### Creating Audit Course

**Via Django Admin:**
1. Login to `/admin/`
2. Go to "Subjects"
3. Click "Add Subject"
4. Fill details:
   - Code: `BES`
   - Name: `Environmental Studies`
   - Subject Type: **Audit Course**
   - Credits: `1`
   - Department: Select
5. Save (marks auto-configured)

**Via API:**
```bash
curl -X POST http://localhost:8000/api/subjects/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BES",
    "name": "Environmental Studies",
    "short_name": "Environmental",
    "subject_type": "AUDIT",
    "credits": 1,
    "department": "dept-uuid"
  }'
```

**Via Django Shell:**
```python
from results.models import Subject, Department

dept = Department.objects.get(code='CS')

Subject.objects.create(
    code='BES',
    name='Environmental Studies',
    short_name='Environmental',
    subject_type='AUDIT',
    credits=1,
    department=dept
)
# Marks are auto-configured!
```

### Migrating Existing Subjects

If you have existing subjects that should be Audit:

```bash
python manage.py migrate_audit_courses
```

This command:
1. Finds subjects with keywords: ENVIRONMENTAL, CONSTITUTION, BES, BCIV
2. Checks they have credits > 0
3. Updates subject_type to 'AUDIT'
4. Recalculates all affected results
5. Updates student CGPAs

**Manual Migration:**
```python
from results.models import Subject, StudentResult

# Find and update
bes = Subject.objects.get(code='BES')
bes.subject_type = 'AUDIT'
bes.save()

# Recalculate results
results = StudentResult.objects.filter(subject=bes)
for result in results:
    result.save()  # Triggers recalculation
```

### Verifying Configuration

**Check Subject Type:**
```python
from results.models import Subject

bes = Subject.objects.get(code='BES')
print(f"Type: {bes.subject_type}")
print(f"Credits: {bes.credits}")
print(f"In CGPA: {bes.subject_type not in ['NON_CREDIT', 'AUDIT']}")
```

**Check CGPA Calculation:**
```python
from results.models import Student

student = Student.objects.get(usn="2AB22CS008")
print(f"CGPA: {student.calculate_cgpa()}")

# Verify Audit courses excluded
results = student.results.filter(subject__subject_type='AUDIT')
print(f"Audit courses: {results.count()}")
print("These are NOT in CGPA")
```

---

## FAQs

### Q1: Why are Audit courses not in CGPA if they have credits?

**A:** VTU's policy. Audit courses are meant for general education (like Environmental Studies) and shouldn't affect technical GPA. They carry credits for administrative purposes but are explicitly excluded from GPA calculations per VTU CBCS 2015-16 regulations.

### Q2: How do I know if a subject is Audit or Non-Credit?

**Check:**
```python
subject = Subject.objects.get(code='YOUR_CODE')
print(f"Type: {subject.subject_type}")
print(f"Credits: {subject.credits}")
```

**Rules:**
- **Credits = 0** → NON_CREDIT
- **Credits > 0, internal only, excluded from CGPA** → AUDIT

### Q3: What if scraper detects wrong type?

**Fix via Admin:**
1. Go to `/admin/results/subject/`
2. Find the subject
3. Change "Subject type"
4. Save

**Fix via API:**
```bash
curl -X PATCH http://localhost:8000/api/subjects/{id}/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"subject_type": "AUDIT"}'
```

### Q4: Will changing subject type affect existing results?

**Yes, automatically!** The system:
1. Recalculates grades for all results
2. Updates pass/fail status
3. Recalculates affected student CGPAs

### Q5: How to add a new Audit course?

**During Scraping:**
1. Update `scraper_service.py` detection rules
2. Add subject code/name to AUDIT keywords
3. Scraper will auto-detect on next run

**Manually:**
1. Use Django Admin or API
2. Set `subject_type='AUDIT'`
3. Set `credits=1` (or appropriate)
4. Other fields auto-configure

### Q6: Can I change an Audit course to regular Theory?

**Yes, but carefully:**
```python
subject = Subject.objects.get(code='BES')
subject.subject_type = 'THEORY'
subject.max_internal_marks = 20  # Update marks
subject.max_external_marks = 80
subject.credits = 4  # Update credits
subject.save()

# Recalculate all results
StudentResult.objects.filter(subject=subject).update(...)
```

**Warning:** This will affect all students' CGPAs!

### Q7: How are grades assigned for Audit courses?

Same as Non-Credit:
- **F**: <35
- **E**: 35-44
- **D**: 45-49
- **C**: 50-59
- **B**: 60-69
- **A**: 70-79
- **S**: 80-89
- **O**: 90-100

### Q8: Do Audit courses appear on transcripts?

**Yes!** They appear with:
- Full subject name
- Credit value (1)
- Marks obtained
- Grade (O/S/A/B/C/D/E/F)
- Note: "Not included in CGPA" (if system supports)

### Q9: What happens if a student fails an Audit course?

- Must retake and pass (≥35)
- Will block graduation
- NOT included in backlog count (since not in CGPA)
- Shows as 'F' grade on transcript

### Q10: Can I export Audit course data?

**Yes, all exports include Audit courses:**
```bash
# API endpoint
GET /api/students/{id}/transcript/

# Includes all subjects with type indicator
```

---

## Common Scenarios

### Scenario 1: VTU Adds New Audit Course

**Steps:**
1. Identify the course (e.g., "BHRY - Human Rights")
2. Add to scraper detection:
   ```python
   elif any(keyword in subject_name.upper() for keyword in
            ['ENVIRONMENTAL', 'CONSTITUTION', 'HUMAN RIGHTS']):
       subject_type = 'AUDIT'
   ```
3. Run scraper - auto-creates with correct type

### Scenario 2: Existing Course Becomes Audit

**Steps:**
1. Update subject type:
   ```python
   subject = Subject.objects.get(code='XYZ')
   subject.subject_type = 'AUDIT'
   subject.save()
   ```
2. Recalculate results:
   ```python
   results = StudentResult.objects.filter(subject=subject)
   for r in results:
       r.save()
   ```
3. Students' CGPAs auto-update

### Scenario 3: Audit Course Data Import

**CSV Format:**
```csv
usn,subject_code,internal_marks,external_marks
2AB22CS008,BES,85,0
2AB22CS009,BES,92,0
```

**Import:**
```python
import csv
from results.models import Student, Subject, StudentResult

subject = Subject.objects.get(code='BES')

with open('audit_results.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        student = Student.objects.get(usn=row['usn'])
        StudentResult.objects.create(
            student=student,
            subject=subject,
            internal_marks=int(row['internal_marks']),
            external_marks=0,
            semester=6  # Set appropriately
        )
        # Grade and CGPA auto-calculated
```

---

## Best Practices

### 1. Always Verify Subject Type
Before calculating analytics, check subject types are correct.

### 2. Document Custom Audit Courses
If your institution has unique Audit courses, document them:
```python
# In scraper_service.py, add comments
# Audit Courses:
# - BES: Environmental Studies
# - BCIV: Constitution of India
# - CUSTOM1: Your Custom Course
```

### 3. Test CGPA Calculations
After adding Audit courses:
```python
student = Student.objects.first()
print(f"CGPA: {student.calculate_cgpa()}")
# Manually verify it's correct
```

### 4. Backup Before Type Changes
```bash
python manage.py dumpdata results.subject > subjects_backup.json
python manage.py dumpdata results.studentresult > results_backup.json
```

### 5. Monitor Scraper Detection
Check logs after scraping:
```bash
grep "AUDIT" scraper.log
```

---

## Troubleshooting

### Issue: CGPA Too High

**Cause:** Audit courses included in calculation

**Fix:**
```python
# Check if Audit courses are properly typed
from results.models import Subject
audit_subjects = Subject.objects.filter(
    code__in=['BES', 'BCIV'],
    subject_type='AUDIT'
)
print(f"Audit subjects found: {audit_subjects.count()}")
```

### Issue: Subject Not Auto-Detected as Audit

**Fix:** Add to detection rules:
```python
# In scraper_service.py
elif 'YOUR_KEYWORD' in subject_name.upper():
    subject_type = 'AUDIT'
```

### Issue: Wrong Credits for Audit Course

**Fix:**
```python
subject = Subject.objects.get(code='BES')
subject.credits = 1  # Correct value
subject.save()

# Recalculate CGPAs
from results.models import Student
for student in Student.objects.all():
    print(f"{student.usn}: {student.calculate_cgpa()}")
```

---

## Summary

✅ **7 Subject Types** supported
✅ **Audit Courses** have credits but **NOT in CGPA**
✅ **Auto-detection** during scraping
✅ **Auto-configuration** of marks
✅ **Auto-calculation** of grades and GPAs
✅ **Migration tools** for existing data

**Key Takeaway:** Audit courses are VTU's way of including important non-technical subjects without affecting engineering GPA. UniSmart handles them automatically and correctly! 🎉
