# VTU Semester-wise URL Management Flow

## Problem Statement

VTU publishes results with URLs that are semester-specific, not batch-specific:
- **22 batch (6th sem)** → `https://results.vtu.ac.in/JJEcbcs25/index.php`
- **23 batch (4th sem)** → `https://results.vtu.ac.in/JJEcbcs25/index.php` (SAME URL)
- **24 batch (2nd sem)** → `https://results.vtu.ac.in/JJEcbcs25/index.php` (SAME URL)

But next semester:
- **22 batch (7th sem)** → `https://results.vtu.ac.in/JJEcbcs26/index.php` (NEW URL)
- **23 batch (5th sem)** → `https://results.vtu.ac.in/JJEcbcs26/index.php` (SAME NEW URL)
- **24 batch (3rd sem)** → `https://results.vtu.ac.in/JJEcbcs26/index.php` (SAME NEW URL)

## Solution Architecture

### Current System (Simple)
```
┌─────────────────┐
│  Single URL     │ ← Admin updates this
│  in Settings    │
└────────┬────────┘
         │
         ▼
    All scrapes use
    this one URL
```

### Proposed System (Semester-wise)
```
┌──────────────────────────────────────────────────┐
│         Semester-wise URL Mapping Table          │
│  Semester | Academic Year | URL                  │
│  ─────────┼───────────────┼─────────────────────│
│    2      │  2024-25      │ results.../JJEcbcs25 │
│    4      │  2024-25      │ results.../JJEcbcs25 │
│    6      │  2024-25      │ results.../JJEcbcs25 │
│    8      │  2024-25      │ results.../JJEcbcs25 │
└──────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Student: 2AB22CS019           │
│  Batch: 2022                   │
│  Current Semester: 6           │
│  Academic Year: 2024-25        │
└────────┬───────────────────────┘
         │
         ▼ Auto-select URL based on semester + academic year
    Scrape from correct URL
```

---

## Implementation Flow

### Phase 1: Database Schema Changes

#### New Model: `VTUResultURL`
```python
# results/models.py

class VTUResultURL(models.Model):
    """
    Stores semester-wise VTU result portal URLs.
    Each semester in each academic year has its own URL.
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

    class Meta:
        unique_together = ['semester', 'academic_year']
        ordering = ['-academic_year', '-semester']

    def __str__(self):
        return f"Sem {self.semester} - {self.academic_year}"
```

#### Add Academic Year to Student Model (if not exists)
```python
# results/models.py - Update Student model

class Student(models.Model):
    # ... existing fields ...

    admission_year = models.IntegerField()  # Already exists

    @property
    def current_academic_year(self):
        """
        Calculate current academic year based on admission year and semester.
        Example: Admitted 2022, Semester 6 → Academic Year 2024-25
        """
        import datetime
        current_date = datetime.date.today()

        # If current month is Jan-May, it's second half of academic year
        # If Jun-Dec, it's first half
        if current_date.month >= 6:
            # July onwards = new academic year starting
            year_offset = (self.current_semester - 1) // 2
            start_year = self.admission_year + year_offset
        else:
            # Jan-May = second half of academic year
            year_offset = (self.current_semester - 2) // 2 if self.current_semester > 1 else 0
            start_year = self.admission_year + year_offset

        return f"{start_year}-{str(start_year + 1)[2:]}"
```

---

### Phase 2: Backend API Changes

#### Create API Endpoint for URL Management
```python
# results/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VTUResultURL
from .serializers import VTUResultURLSerializer

class VTUResultURLViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing semester-wise VTU result URLs.
    """
    queryset = VTUResultURL.objects.all()
    serializer_class = VTUResultURLSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def get_url_for_student(self, request):
        """
        Get the appropriate VTU URL for a student based on their semester.
        Query params: usn or (semester + academic_year)
        """
        usn = request.query_params.get('usn')
        semester = request.query_params.get('semester')
        academic_year = request.query_params.get('academic_year')

        if usn:
            try:
                student = Student.objects.get(usn=usn)
                semester = student.current_semester
                academic_year = student.current_academic_year
            except Student.DoesNotExist:
                return Response(
                    {'error': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        if not semester or not academic_year:
            return Response(
                {'error': 'semester and academic_year are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            url_config = VTUResultURL.objects.get(
                semester=semester,
                academic_year=academic_year,
                is_active=True
            )
            return Response({
                'semester': semester,
                'academic_year': academic_year,
                'url': url_config.url,
                'student_usn': usn if usn else None
            })
        except VTUResultURL.DoesNotExist:
            # Fallback to most recent active URL
            fallback = VTUResultURL.objects.filter(is_active=True).first()
            if fallback:
                return Response({
                    'semester': semester,
                    'academic_year': academic_year,
                    'url': fallback.url,
                    'warning': 'Using fallback URL - exact match not found',
                    'student_usn': usn if usn else None
                })
            return Response(
                {'error': 'No active VTU URL configured'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def bulk_update_semester_urls(self, request):
        """
        Bulk update URLs for all semesters in an academic year.
        Useful when VTU releases all semester results with same URL.

        POST body:
        {
            "academic_year": "2024-25",
            "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
            "semesters": [2, 4, 6, 8]  # Even semesters
        }
        """
        academic_year = request.data.get('academic_year')
        url = request.data.get('url')
        semesters = request.data.get('semesters', [2, 4, 6, 8])

        if not academic_year or not url:
            return Response(
                {'error': 'academic_year and url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        updated_count = 0

        for semester in semesters:
            obj, created = VTUResultURL.objects.update_or_create(
                semester=semester,
                academic_year=academic_year,
                defaults={'url': url, 'is_active': True}
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            'message': 'URLs updated successfully',
            'created': created_count,
            'updated': updated_count,
            'semesters': semesters,
            'academic_year': academic_year
        })
```

#### Update Scraper Service
```python
# scraper_service.py

def get_vtu_url_for_student(usn):
    """
    Get the appropriate VTU URL for a student based on their semester.
    """
    try:
        student = Student.objects.get(usn=usn)
        semester = student.current_semester
        academic_year = student.current_academic_year

        # Try to get semester-specific URL
        url_config = VTUResultURL.objects.filter(
            semester=semester,
            academic_year=academic_year,
            is_active=True
        ).first()

        if url_config:
            logger.info(f"Using semester-specific URL for {usn}: Sem {semester}, AY {academic_year}")
            return url_config.url

        # Fallback to most recent active URL
        fallback = VTUResultURL.objects.filter(is_active=True).first()
        if fallback:
            logger.warning(f"No specific URL for {usn} (Sem {semester}, AY {academic_year}), using fallback")
            return fallback.url

        # Ultimate fallback to old single-URL system
        logger.error("No VTU URLs configured in database")
        return settings.DEFAULT_VTU_URL

    except Student.DoesNotExist:
        logger.error(f"Student {usn} not found in database")
        # Use fallback URL for unknown students
        fallback = VTUResultURL.objects.filter(is_active=True).first()
        return fallback.url if fallback else settings.DEFAULT_VTU_URL

def scrape_student_result(usn):
    """
    Scrape VTU result for a student using semester-appropriate URL.
    """
    vtu_url = get_vtu_url_for_student(usn)
    logger.info(f"Scraping {usn} from {vtu_url}")

    # ... rest of scraping logic ...
```

---

### Phase 3: Frontend Admin Interface

#### New Page: VTU URL Management (`/admin/vtu-urls`)

```typescript
// frontend/app/admin/vtu-urls/page.tsx

interface VTUResultURL {
  id: number;
  semester: number;
  academic_year: string;
  url: string;
  is_active: boolean;
  updated_at: string;
}

export default function VTUURLManagement() {
  const [urls, setUrls] = useState<VTUResultURL[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2024-25');
  const [bulkUrl, setBulkUrl] = useState('');

  // Fetch all configured URLs
  const fetchURLs = async () => {
    const response = await fetch(`${API_BASE_URL}/vtu-urls/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUrls(data.results || data);
  };

  // Bulk update all semesters for current academic year
  const handleBulkUpdate = async () => {
    await fetch(`${API_BASE_URL}/vtu-urls/bulk_update_semester_urls/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        academic_year: currentAcademicYear,
        url: bulkUrl,
        semesters: [2, 4, 6, 8]  // Even semesters
      })
    });
    fetchURLs();
    alert('URLs updated for all semesters!');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">VTU Result URL Management</h1>

      {/* Bulk Update Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Update - All Semesters</h2>
        <p className="text-sm text-gray-600 mb-4">
          When VTU releases results, all even semesters (2, 4, 6, 8) typically use the same URL.
          Update them all at once here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Academic Year</label>
            <select
              value={currentAcademicYear}
              onChange={(e) => setCurrentAcademicYear(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">VTU Result URL</label>
            <input
              type="url"
              value={bulkUrl}
              onChange={(e) => setBulkUrl(e.target.value)}
              placeholder="https://results.vtu.ac.in/JJEcbcs25/index.php"
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleBulkUpdate}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Update All Even Semesters (2, 4, 6, 8)
        </button>
      </div>

      {/* Individual Semester URLs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Semester</th>
              <th className="px-6 py-3 text-left">Academic Year</th>
              <th className="px-6 py-3 text-left">URL</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Last Updated</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((urlConfig) => (
              <tr key={urlConfig.id} className="border-t">
                <td className="px-6 py-4">
                  <span className="font-semibold">Semester {urlConfig.semester}</span>
                </td>
                <td className="px-6 py-4">{urlConfig.academic_year}</td>
                <td className="px-6 py-4 text-sm text-blue-600 truncate max-w-xs">
                  {urlConfig.url}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    urlConfig.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {urlConfig.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(urlConfig.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold mb-2">📝 How It Works</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Each semester in each academic year has its own VTU URL</li>
          <li>• When scraping, system auto-selects URL based on student's current semester</li>
          <li>• Example: 2022 batch (Sem 6) and 2024 batch (Sem 2) use same URL for AY 2024-25</li>
          <li>• Use "Quick Update" when VTU releases results to update all semesters at once</li>
          <li>• Edit individual semester URLs if VTU uses different URLs for odd/even semesters</li>
        </ul>
      </div>
    </div>
  );
}
```

---

### Phase 4: Scraper Integration

#### Update Scraper to Use Dynamic URLs

```python
# scraper_views.py

@api_view(['POST'])
@permission_classes([IsAdminUser])
def scrape_single_usn(request):
    """
    Scrape result for a single student.
    Auto-selects correct VTU URL based on student's semester.
    """
    usn = request.data.get('usn')

    if not usn:
        return Response(
            {'error': 'USN is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Get student info
        student = Student.objects.get(usn=usn)

        # Get appropriate URL
        vtu_url = get_vtu_url_for_student(usn)

        # Scrape result
        result = scrape_student_result(usn)

        return Response({
            'success': True,
            'usn': usn,
            'semester': student.current_semester,
            'academic_year': student.current_academic_year,
            'url_used': vtu_url,
            'result': result
        })

    except Student.DoesNotExist:
        return Response(
            {'error': f'Student {usn} not found in database. Please add student first.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error scraping {usn}: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## Implementation Steps

### Step 1: Database Migration
```bash
cd "result analysis"
python manage.py makemigrations
python manage.py migrate
```

### Step 2: Add Initial Data
```python
# Django shell
from results.models import VTUResultURL

# Add URLs for current academic year (2024-25)
VTUResultURL.objects.create(
    semester=2,
    academic_year='2024-25',
    url='https://results.vtu.ac.in/JJEcbcs25/index.php',
    is_active=True
)
VTUResultURL.objects.create(
    semester=4,
    academic_year='2024-25',
    url='https://results.vtu.ac.in/JJEcbcs25/index.php',
    is_active=True
)
VTUResultURL.objects.create(
    semester=6,
    academic_year='2024-25',
    url='https://results.vtu.ac.in/JJEcbcs25/index.php',
    is_active=True
)
VTUResultURL.objects.create(
    semester=8,
    academic_year='2024-25',
    url='https://results.vtu.ac.in/JJEcbcs25/index.php',
    is_active=True
)
```

### Step 3: Update Admin Navigation
Add "VTU URLs" link to admin sidebar:
```typescript
// frontend/app/admin/layout.tsx or sidebar component
<Link href="/admin/vtu-urls">
  <LinkIcon className="h-5 w-5" />
  VTU URLs
</Link>
```

### Step 4: Test Flow
1. **Setup URLs:**
   - Go to `/admin/vtu-urls`
   - Set URLs for current academic year

2. **Test Student Detection:**
   - Student with USN: 2AB22CS019
   - Batch: 2022, Current Semester: 6
   - Academic Year: 2024-25
   - Should auto-select URL for Sem 6, AY 2024-25

3. **Test Scraping:**
   - Go to `/admin/scraper`
   - Enter USN: 2AB22CS019
   - Click "Scrape Single USN"
   - Check console logs - should show correct URL being used

---

## User Workflow

### When New Results Are Released

**Before (Old System):**
```
1. Admin goes to VTU Settings
2. Updates single URL
3. Done - but all students use this URL regardless of semester
```

**After (New System):**
```
1. VTU announces: "2024-25 Even Semester Results Published"
2. Admin goes to VTU URLs
3. Selects Academic Year: 2024-25
4. Pastes URL: https://results.vtu.ac.in/JJEcbcs25/index.php
5. Clicks "Update All Even Semesters"
6. Done - Sem 2, 4, 6, 8 URLs updated
7. Scraper auto-selects correct URL per student
```

---

## Benefits

✅ **Automatic URL Selection**
- System picks right URL based on student's semester + academic year
- No manual intervention needed per student

✅ **Bulk Updates**
- Update all semesters at once when VTU uses same URL
- Save time during result season

✅ **Historical Data**
- Keep track of which URLs were used for which semester/year
- Useful for re-scraping old results

✅ **Fallback Mechanism**
- If exact match not found, use most recent active URL
- Graceful degradation

✅ **Future-Proof**
- Pre-configure URLs for upcoming semesters
- Set inactive URLs for future academic years

---

## Alternative: Simple Mapping Table

If full academic year tracking is too complex, use simpler mapping:

```python
class VTUURLMapping(models.Model):
    """Simple semester → URL mapping"""
    semester = models.IntegerField(unique=True, choices=[(i, f'Sem {i}') for i in range(1, 9)])
    url = models.URLField()
    updated_at = models.DateTimeField(auto_now=True)
```

Admin updates when VTU changes URL:
```
Sem 2 → https://results.vtu.ac.in/JJEcbcs25/index.php
Sem 4 → https://results.vtu.ac.in/JJEcbcs25/index.php
Sem 6 → https://results.vtu.ac.in/JJEcbcs25/index.php
Sem 8 → https://results.vtu.ac.in/JJEcbcs25/index.php
```

When scraping student in Sem 6 → Use Sem 6 URL.

---

## Next Steps

1. **Choose Approach:**
   - Full academic year tracking (recommended for large institutions)
   - Simple semester mapping (easier to implement)

2. **Implement Database Model**
3. **Create Admin Interface**
4. **Update Scraper Logic**
5. **Test with Real Students**
6. **Document for Future Admins**

Would you like me to implement this system for you?
