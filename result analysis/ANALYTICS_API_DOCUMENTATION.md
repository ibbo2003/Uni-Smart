# Real-Time Analytics API Documentation

## Overview

The UniSmart Result Analysis system now features a **fully automated real-time analytics API** that calculates statistics on-the-fly from student results. No manual data entry required!

## What Changed

### Removed
- **ResultAnalytics Model**: The old manual analytics model has been removed
- Database table `result_analytics` has been dropped
- Manual data entry is no longer needed

### Added
- **analytics_service.py**: Real-time analytics calculation service
- **4 New API Endpoints**: Subject, Batch, Department, and Student Comparison analytics
- Automated calculations from StudentResult data

## API Endpoints

### 1. Subject Analytics

**Endpoint**: `GET /api/analytics/subject/`

**Description**: Get detailed analytics for a specific subject including pass rates, toppers, grade distribution, and failed students.

**Query Parameters**:
- `department` (required): Department code (e.g., CS, EC, ME)
- `semester` (required): Semester number (1-8)
- `subject` (required): Subject code (e.g., BCS601)
- `batch` (optional): Batch year (e.g., 22, 23)

**Example Request**:
```bash
GET /api/analytics/subject/?department=CS&semester=6&subject=BCS601&batch=22
```

**Example Response**:
```json
{
  "subject_code": "BCS601",
  "subject_name": "CLOUD COMPUTING",
  "semester": 6,
  "department": "CS",
  "department_name": "COMPUTER SCIENCE",
  "batch": "22",
  "credits": 4.0,
  "subject_type": "THEORY",

  "total_students": 60,
  "students_appeared": 58,
  "students_passed": 48,
  "students_failed": 10,
  "students_absent": 2,
  "students_withheld": 0,

  "pass_percentage": 82.76,
  "fail_percentage": 17.24,
  "absent_percentage": 3.33,

  "average_marks": 68.5,
  "average_internal_marks": 38.2,
  "average_external_marks": 30.3,
  "median_marks": 67.0,
  "highest_marks": 97,
  "lowest_marks": 35,

  "grade_distribution": {
    "O": 15,
    "S": 12,
    "A": 10,
    "B": 8,
    "C": 3,
    "D": 0,
    "E": 0,
    "F": 10
  },

  "toppers": [
    {
      "rank": 1,
      "usn": "2AB22CS008",
      "name": "AHMED KOLA",
      "internal_marks": 47,
      "external_marks": 50,
      "total_marks": 97,
      "grade": "O"
    }
  ],

  "failed_students": [
    {
      "usn": "2AB22CS999",
      "name": "Student Name",
      "internal_marks": 25,
      "external_marks": 15,
      "total_marks": 40,
      "grade": "F"
    }
  ],
  "failed_students_count": 10
}
```

---

### 2. Batch Analytics

**Endpoint**: `GET /api/analytics/batch/`

**Description**: Get comprehensive analytics for an entire batch in a semester including SGPA statistics, subject-wise performance, batch toppers, and difficult subjects.

**Query Parameters**:
- `batch` (required): Batch year (e.g., 22, 23)
- `semester` (required): Semester number (1-8)
- `department` (required): Department code (e.g., CS, EC)

**Example Request**:
```bash
GET /api/analytics/batch/?batch=22&semester=6&department=CS
```

**Example Response**:
```json
{
  "batch": "22",
  "semester": 6,
  "department": "CS",
  "department_name": "COMPUTER SCIENCE",

  "total_students": 60,
  "total_subjects": 9,
  "overall_pass_rate": 85.5,
  "average_sgpa": 8.2,
  "highest_sgpa": 9.8,
  "lowest_sgpa": 5.2,
  "students_with_backlogs": 12,
  "students_all_pass": 48,

  "subject_statistics": [
    {
      "subject_code": "BCS601",
      "subject_name": "CLOUD COMPUTING",
      "credits": 4.0,
      "total_students": 60,
      "appeared": 58,
      "passed": 48,
      "failed": 10,
      "absent": 2,
      "pass_rate": 82.76,
      "average_marks": 68.5,
      "highest_marks": 97,
      "lowest_marks": 35,
      "grade_distribution": {"O": 15, "S": 12, "A": 10, "B": 8, "C": 3, "F": 10}
    }
  ],

  "batch_toppers": [
    {
      "usn": "2AB22CS008",
      "name": "AHMED KOLA",
      "sgpa": 9.2
    }
  ],

  "most_difficult_subjects": [
    {
      "subject_code": "BCS602",
      "pass_rate": 65.5
    }
  ],

  "easiest_subjects": [
    {
      "subject_code": "BYOK658",
      "pass_rate": 98.0
    }
  ]
}
```

---

### 3. Department Overview

**Endpoint**: `GET /api/analytics/department/`

**Description**: Get department-wide overview with semester-wise statistics.

**Query Parameters**:
- `department` (required): Department code (e.g., CS, EC, ME)
- `batch` (optional): Filter by batch year (e.g., 22, 23)

**Example Request**:
```bash
GET /api/analytics/department/?department=CS&batch=22
```

**Example Response**:
```json
{
  "department": "CS",
  "department_name": "COMPUTER SCIENCE",
  "batch": "22",
  "total_students": 60,

  "semester_statistics": [
    {
      "semester": 1,
      "total_students": 540,
      "appeared": 535,
      "passed": 512,
      "failed": 23,
      "absent": 5,
      "pass_rate": 95.7,
      "average_sgpa": 8.5
    },
    {
      "semester": 2,
      "total_students": 540,
      "appeared": 538,
      "passed": 505,
      "failed": 33,
      "absent": 2,
      "pass_rate": 93.9,
      "average_sgpa": 8.3
    }
  ]
}
```

---

### 4. Student Comparison

**Endpoint**: `POST /api/analytics/compare/`

**Description**: Compare multiple students' performance.

**Request Body**:
```json
{
  "usns": ["2AB22CS008", "2AB22CS062"],
  "semester": 6  // optional - if not provided, uses CGPA
}
```

**Example Request**:
```bash
POST /api/analytics/compare/
Content-Type: application/json

{
  "usns": ["2AB22CS008", "2AB22CS062"],
  "semester": 6
}
```

**Example Response**:
```json
{
  "comparison_type": "SGPA",
  "semester": 6,
  "students": [
    {
      "usn": "2AB22CS008",
      "name": "AHMED KOLA",
      "department": "CS",
      "batch": "22",
      "semester": 6,
      "sgpa": 9.2,
      "total_subjects": 9,
      "passed": 9,
      "failed": 0,
      "pass_rate": 100.0
    },
    {
      "usn": "2AB22CS062",
      "name": "Student 2",
      "department": "CS",
      "batch": "22",
      "semester": 6,
      "sgpa": 8.5,
      "total_subjects": 9,
      "passed": 8,
      "failed": 1,
      "pass_rate": 88.89
    }
  ]
}
```

---

## Authentication

All analytics endpoints require authentication using JWT tokens.

**Get Token**:
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Use Token in Requests**:
```bash
GET /api/analytics/subject/?department=CS&semester=6&subject=BCS601
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Testing

A test script is provided to verify the analytics service:

```bash
python test_analytics.py
```

This will test all 4 analytics methods with your actual database data.

---

## Python Usage Example

You can also use the analytics service directly in Python:

```python
from results.analytics_service import ResultAnalytics

# Subject analytics
analytics = ResultAnalytics.get_subject_analytics(
    department_code='CS',
    semester=6,
    subject_code='BCS601',
    batch='22'
)

# Batch analytics
analytics = ResultAnalytics.get_batch_semester_analytics(
    batch='22',
    semester=6,
    department_code='CS'
)

# Department overview
analytics = ResultAnalytics.get_department_overview(
    department_code='CS',
    batch='22'
)

# Student comparison
analytics = ResultAnalytics.get_student_comparison(
    usn_list=['2AB22CS008', '2AB22CS062'],
    semester=6
)
```

---

## Frontend Integration

### JavaScript/Fetch Example

```javascript
// Get subject analytics
async function getSubjectAnalytics(department, semester, subject, batch = null) {
  const params = new URLSearchParams({
    department,
    semester,
    subject
  });

  if (batch) {
    params.append('batch', batch);
  }

  const response = await fetch(
    `http://localhost:8000/api/analytics/subject/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return await response.json();
}

// Get batch analytics
async function getBatchAnalytics(batch, semester, department) {
  const params = new URLSearchParams({ batch, semester, department });

  const response = await fetch(
    `http://localhost:8000/api/analytics/batch/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return await response.json();
}

// Compare students
async function compareStudents(usns, semester = null) {
  const response = await fetch(
    'http://localhost:8000/api/analytics/compare/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usns, semester })
    }
  );

  return await response.json();
}
```

---

## Migration Notes

### What Was Removed

1. **Model**: `ResultAnalytics` model from `results/models.py`
2. **Database Table**: `result_analytics` table
3. **Admin**: ResultAnalytics admin interface
4. **Serializer**: ResultAnalyticsSerializer
5. **Old Views**: Department performance and performance_trends actions

### What Was Added

1. **Service**: `results/analytics_service.py` - Real-time analytics calculations
2. **Views**: 4 new API view functions in `results/views.py`
3. **URLs**: 4 new URL patterns in `results/urls.py`
4. **Migration**: `0006_remove_result_analytics.py`

### Migration Applied

```bash
python manage.py migrate results
```

Migration `0006_remove_result_analytics` has been successfully applied, removing the `result_analytics` table from the database.

---

## Benefits

1. **No Manual Entry**: Analytics are calculated automatically from StudentResult data
2. **Always Up-to-Date**: Real-time calculation ensures data is always current
3. **No Data Duplication**: Single source of truth (StudentResult)
4. **Better Performance**: Direct database queries with aggregation
5. **Easy to Extend**: Add new analytics methods to the service easily
6. **Type Safe**: Clear return types with comprehensive documentation

---

## Performance Considerations

- Analytics are calculated on-demand, which is fine for typical usage
- For very large datasets (10,000+ results), consider adding caching
- Database indexes on StudentResult fields ensure fast queries:
  - `student`, `subject`, `semester`, `is_latest`

---

## Support

For issues or questions:
- Check the test script: `python test_analytics.py`
- Review the analytics service code: `results/analytics_service.py`
- Check API endpoint implementation: `results/views.py` (lines 665-836)

---

## Future Enhancements

Potential additions to the analytics service:

1. **Caching**: Add Redis caching for frequently accessed analytics
2. **Export**: Add PDF/Excel export functionality
3. **Visualizations**: Generate charts and graphs
4. **Trends**: Track performance trends over time
5. **Predictions**: ML-based performance predictions
6. **Notifications**: Alert system for poor performance
7. **Comparative Analytics**: Compare departments, batches, years

---

**Implementation Date**: 2025-11-08
**Status**: ✅ Completed and Tested
**Migration**: 0006_remove_result_analytics (Applied)
