# Backend Implementation for Semester-wise VTU URLs

## Frontend is Ready ✅
The VTU Settings page (`/admin/vtu-settings`) now has:
- Semester-wise URL bulk update form
- Academic year selection
- Semester selection (2, 4, 6, 8)
- Table showing current URLs per academic year
- Fallback URL support (legacy system)

## Backend Implementation Needed

### Step 1: Create Django Model

Add to `result analysis/results/models.py`:

```python
class VTUSemesterURL(models.Model):
    """
    Stores semester-wise VTU result portal URLs.
    Each semester in each academic year can have its own URL.
    """
    semester = models.IntegerField(
        choices=[(i, f'Semester {i}') for i in range(1, 9)],
        help_text="Which semester this URL is for"
    )
    academic_year = models.CharField(
        max_length=10,
        help_text="Academic year (e.g., 2024-25)"
    )
    url = models.URLField(
        max_length=500,
        help_text="VTU result portal URL for this semester"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this URL is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Admin who last updated this URL"
    )

    class Meta:
        unique_together = ['semester', 'academic_year']
        ordering = ['-academic_year', '-semester']
        verbose_name = 'VTU Semester URL'
        verbose_name_plural = 'VTU Semester URLs'

    def __str__(self):
        return f"Sem {self.semester} - {self.academic_year} - {self.url[:50]}"
```

### Step 2: Create Serializer

Add to `result analysis/results/serializers.py`:

```python
from rest_framework import serializers
from .models import VTUSemesterURL

class VTUSemesterURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = VTUSemesterURL
        fields = ['id', 'semester', 'academic_year', 'url', 'is_active', 'created_at', 'updated_at', 'updated_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']
```

### Step 3: Create ViewSet

Add to `result analysis/results/views.py`:

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import VTUSemesterURL, Student
from .serializers import VTUSemesterURLSerializer
import logging

logger = logging.getLogger(__name__)

class VTUSemesterURLViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing semester-wise VTU result URLs.
    """
    queryset = VTUSemesterURL.objects.all()
    serializer_class = VTUSemesterURLSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Bulk update URLs for multiple semesters in an academic year.

        POST /api/vtu-semester-urls/bulk-update/
        {
            "academic_year": "2024-25",
            "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
            "semesters": [2, 4, 6, 8]
        }
        """
        academic_year = request.data.get('academic_year')
        url = request.data.get('url')
        semesters = request.data.get('semesters', [])

        if not academic_year or not url:
            return Response(
                {'error': 'academic_year and url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not semesters:
            return Response(
                {'error': 'semesters list cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        updated_count = 0
        results = []

        for semester in semesters:
            obj, created = VTUSemesterURL.objects.update_or_create(
                semester=semester,
                academic_year=academic_year,
                defaults={
                    'url': url,
                    'is_active': True,
                    'updated_by': request.user
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            results.append({
                'semester': semester,
                'academic_year': academic_year,
                'url': url,
                'action': 'created' if created else 'updated'
            })

        logger.info(
            f"Bulk URL update by {request.user.username}: "
            f"{created_count} created, {updated_count} updated for {academic_year}"
        )

        return Response({
            'message': 'URLs updated successfully',
            'created': created_count,
            'updated': updated_count,
            'results': results
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='get-for-student')
    def get_for_student(self, request):
        """
        Get the appropriate VTU URL for a student.

        GET /api/vtu-semester-urls/get-for-student/?usn=2AB22CS019
        """
        usn = request.query_params.get('usn')

        if not usn:
            return Response(
                {'error': 'usn parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student = Student.objects.get(usn=usn)
            semester = student.current_semester
            academic_year = get_current_academic_year(student)

            # Try to get semester-specific URL
            url_config = VTUSemesterURL.objects.filter(
                semester=semester,
                academic_year=academic_year,
                is_active=True
            ).first()

            if url_config:
                return Response({
                    'usn': usn,
                    'semester': semester,
                    'academic_year': academic_year,
                    'url': url_config.url,
                    'source': 'semester_specific'
                })

            # Fallback to most recent active URL
            fallback = VTUSemesterURL.objects.filter(is_active=True).first()
            if fallback:
                return Response({
                    'usn': usn,
                    'semester': semester,
                    'academic_year': academic_year,
                    'url': fallback.url,
                    'source': 'fallback',
                    'warning': 'No semester-specific URL found, using fallback'
                })

            return Response(
                {'error': 'No VTU URLs configured'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Student.DoesNotExist:
            return Response(
                {'error': f'Student {usn} not found'},
                status=status.HTTP_404_NOT_FOUND
            )


def get_current_academic_year(student):
    """
    Calculate current academic year based on student's admission year and semester.
    Example: 2022 admission + Sem 6 = 2024-25 academic year
    """
    import datetime

    # Years since admission (0-indexed)
    years_since_admission = (student.current_semester - 1) // 2

    # Calculate which academic year they're in
    current_date = datetime.date.today()

    if current_date.month >= 6:  # June onwards = new academic year
        start_year = student.admission_year + years_since_admission
    else:  # Jan-May = second half of academic year
        start_year = student.admission_year + years_since_admission

    end_year = start_year + 1
    return f"{start_year}-{str(end_year)[2:]}"
```

### Step 4: Register URL Routes

Add to `result analysis/config/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from results.views import VTUSemesterURLViewSet

router = DefaultRouter()
router.register(r'vtu-semester-urls', VTUSemesterURLViewSet, basename='vtu-semester-url')

urlpatterns = [
    # ... existing patterns ...
    path('api/', include(router.urls)),
]
```

### Step 5: Update Scraper to Use Semester URLs

Modify `result analysis/scraper_service.py`:

```python
from results.models import VTUSemesterURL, Student
from results.views import get_current_academic_year

def get_vtu_url_for_student(usn):
    """
    Get the appropriate VTU URL for a student based on their semester.
    Returns semester-specific URL if available, otherwise fallback.
    """
    try:
        student = Student.objects.get(usn=usn)
        semester = student.current_semester
        academic_year = get_current_academic_year(student)

        # Try semester-specific URL first
        url_config = VTUSemesterURL.objects.filter(
            semester=semester,
            academic_year=academic_year,
            is_active=True
        ).first()

        if url_config:
            logger.info(
                f"Using semester-specific URL for {usn}: "
                f"Sem {semester}, AY {academic_year}"
            )
            return url_config.url

        # Fallback to most recent active URL
        fallback = VTUSemesterURL.objects.filter(is_active=True).first()
        if fallback:
            logger.warning(
                f"No specific URL for {usn} (Sem {semester}, AY {academic_year}), "
                f"using fallback: {fallback.url}"
            )
            return fallback.url

        # Ultimate fallback to legacy system
        from .models import SystemSettings
        legacy_url = SystemSettings.objects.filter(key='vtu_portal_url').first()
        if legacy_url:
            logger.warning(f"Using legacy URL for {usn}")
            return legacy_url.value

        raise ValueError("No VTU URLs configured in system")

    except Student.DoesNotExist:
        logger.error(f"Student {usn} not found")
        # Use fallback for unknown students
        fallback = VTUSemesterURL.objects.filter(is_active=True).first()
        if fallback:
            return fallback.url
        raise ValueError(f"Student {usn} not found and no fallback URL configured")


def scrape_student_result(usn):
    """
    Scrape VTU result for a student using semester-appropriate URL.
    """
    vtu_url = get_vtu_url_for_student(usn)
    logger.info(f"Scraping {usn} from {vtu_url}")

    # Rest of scraping logic...
    # Use vtu_url for Selenium driver
```

### Step 6: Run Migrations

```bash
cd "result analysis"
python manage.py makemigrations
python manage.py migrate
```

### Step 7: Add Initial Data (Optional)

```bash
python manage.py shell
```

```python
from results.models import VTUSemesterURL
from django.contrib.auth.models import User

admin = User.objects.filter(is_superuser=True).first()

# Add URLs for 2024-25
for sem in [2, 4, 6, 8]:
    VTUSemesterURL.objects.create(
        semester=sem,
        academic_year='2024-25',
        url='https://results.vtu.ac.in/JJEcbcs25/index.php',
        is_active=True,
        updated_by=admin
    )

print("Initial VTU semester URLs created!")
```

### Step 8: Test API Endpoints

```bash
# List all semester URLs
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/vtu-semester-urls/

# Bulk update
curl -X POST http://localhost:8001/api/vtu-semester-urls/bulk-update/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "academic_year": "2024-25",
    "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
    "semesters": [2, 4, 6, 8]
  }'

# Get URL for specific student
curl http://localhost:8001/api/vtu-semester-urls/get-for-student/?usn=2AB22CS019 \
  -H "Authorization: Bearer <token>"
```

## Complete Flow

```
┌─────────────────────────────────────────────────┐
│  Admin Updates URLs via Frontend                │
│  /admin/vtu-settings                            │
│  - Selects Academic Year: 2024-25               │
│  - Selects Semesters: 2, 4, 6, 8                │
│  - Enters URL: results.vtu.ac.in/JJEcbcs25/...  │
│  - Clicks "Update 4 Semesters"                  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  POST /api/vtu-semester-urls/bulk-update/       │
│  {                                              │
│    "academic_year": "2024-25",                  │
│    "url": "https://...",                        │
│    "semesters": [2, 4, 6, 8]                    │
│  }                                              │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Django Creates/Updates VTUSemesterURL Records  │
│  - Sem 2 + 2024-25 → URL                        │
│  - Sem 4 + 2024-25 → URL                        │
│  - Sem 6 + 2024-25 → URL                        │
│  - Sem 8 + 2024-25 → URL                        │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Later: Admin Scrapes Student                   │
│  USN: 2AB22CS019                                │
│  - Batch 2022, Currently in Sem 6               │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  get_vtu_url_for_student('2AB22CS019')          │
│  1. Get student from DB                         │
│  2. Check current semester: 6                   │
│  3. Calculate academic year: 2024-25            │
│  4. Query: Sem 6 + AY 2024-25                   │
│  5. Return: results.vtu.ac.in/JJEcbcs25/...     │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Scraper uses correct URL automatically         │
│  ✅ No manual intervention needed!              │
└─────────────────────────────────────────────────┘
```

## Benefits

✅ **Frontend Already Built** - Just implement backend
✅ **Automatic URL Selection** - Based on student semester
✅ **Bulk Updates** - Update all semesters at once
✅ **Backward Compatible** - Falls back to legacy URL if needed
✅ **Historical Tracking** - Audit trail of URL changes
✅ **Admin Friendly** - Beautiful UI for non-technical users

## Estimated Implementation Time

- Database model: 10 minutes
- Serializer: 5 minutes
- ViewSet + endpoints: 20 minutes
- Scraper integration: 15 minutes
- Testing: 10 minutes

**Total: ~1 hour**
