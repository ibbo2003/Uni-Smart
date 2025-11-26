# Scraper Semester Configuration - Complete Implementation

## Overview

The scraper now supports **semester-wise and academic year-based scraping** with automatic VTU URL selection. Admins can configure which semester and academic year they want to scrape, and the system automatically uses the correct VTU portal URL.

---

## How It Works

### 1. **Admin Configures URLs in VTU Settings** (`/admin/vtu-settings`)

Admin sets up URLs for different semesters and academic years:

```
Even Semesters (2,4,6,8) + 2024-25 → https://results.vtu.ac.in/JJEcbcs25/index.php
Odd Semesters (1,3,5,7) + 2024-25 → https://results.vtu.ac.in/DJcbcs25/index.php
```

These are stored in the `VTUSemesterURL` database table.

### 2. **Admin Goes to Scraper Page** (`/admin/scraper`)

The scraper page now has a **Scraper Configuration** section at the top with:
- **Semester dropdown** (1-8)
- **Academic Year dropdown** (2023-24, 2024-25, etc.)
- **VTU URL display** (shows the configured URL or "Not configured")

### 3. **System Fetches Correct URL**

When admin selects a semester and academic year:
```
Frontend calls: GET /api/vtu-semester-urls/?semester=6&academic_year=2024-25&is_active=true
Backend returns: { url: "https://results.vtu.ac.in/JJEcbcs25/index.php" }
```

The URL is displayed in the configuration panel.

### 4. **Admin Scrapes Results**

When admin clicks "Scrape Result", the system sends:

```json
POST /api/scraper/scrape/
{
  "usn": "2AB22CS019",
  "semester": 6,
  "academic_year": "2024-25",
  "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/index.php"
}
```

The scraper uses the specified URL to fetch results.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Admin Configures URLs (VTU Settings Page)         │
│  ────────────────────────────────────────────────────       │
│  • Semester: Even (2,4,6,8)                                 │
│  • Academic Year: 2024-25                                   │
│  • URL: results.vtu.ac.in/JJEcbcs25/index.php               │
│  → Clicks "Update 4 Semesters"                              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Database: VTUSemesterURL Table                             │
│  ───────────────────────────────────────────────────        │
│  Sem 2 | 2024-25 | results.vtu.ac.in/JJEcbcs25/index.php    │
│  Sem 4 | 2024-25 | results.vtu.ac.in/JJEcbcs25/index.php    │
│  Sem 6 | 2024-25 | results.vtu.ac.in/JJEcbcs25/index.php    │
│  Sem 8 | 2024-25 | results.vtu.ac.in/JJEcbcs25/index.php    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Admin Opens Scraper Page                           │
│  ─────────────────────────────────────────────────          │
│  Scraper Configuration Panel:                               │
│  • Semester: [Dropdown shows 1-8]                           │
│  • Academic Year: [Dropdown shows 2023-24, 2024-25, etc.]   │
│  • Configured VTU URL: [Auto-fetched from DB]               │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Admin Selects Semester 6 + Academic Year 2024-25  │
│  ────────────────────────────────────────────────────────   │
│  Frontend: useEffect triggers when selection changes        │
│  → Calls: GET /api/vtu-semester-urls/                       │
│            ?semester=6&academic_year=2024-25&is_active=true │
│                                                              │
│  Backend: Queries VTUSemesterURL table                      │
│  → Returns: { url: "results.vtu.ac.in/JJEcbcs25/index.php" }│
│                                                              │
│  Frontend: Displays URL in configuration panel              │
│  ✓ Configured VTU URL: JJEcbcs25/index.php                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Admin Enters USN and Clicks "Scrape Result"       │
│  ──────────────────────────────────────────────────────     │
│  • USN: 2AB22CS019                                          │
│  • Click "Scrape Result" button                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Frontend Validation                                │
│  ─────────────────────────────────────────────────          │
│  IF vtuURL is empty:                                        │
│    → Alert: "No VTU URL configured for Semester 6,          │
│              Academic Year 2024-25. Please configure         │
│              it in VTU Settings."                            │
│    → STOP                                                    │
│                                                              │
│  ELSE:                                                       │
│    → Continue to API call                                    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Frontend API Call                                  │
│  ────────────────────────────────────────────────────       │
│  POST /api/scraper/scrape/                                  │
│  {                                                           │
│    "usn": "2AB22CS019",                                     │
│    "semester": 6,                                           │
│    "academic_year": "2024-25",                              │
│    "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/..."     │
│  }                                                           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Backend Validation (views.py)                      │
│  ────────────────────────────────────────────────────       │
│  IF semester OR academic_year OR vtu_url is missing:        │
│    → Return 400 Bad Request                                 │
│    → Error: "Missing required configuration"                │
│                                                              │
│  ELSE:                                                       │
│    → Pass to scraper service                                │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 8: Scraper Service (scraper_service.py)               │
│  ────────────────────────────────────────────────────       │
│  scrape_single_usn(                                         │
│    usn="2AB22CS019",                                        │
│    user=admin,                                              │
│    headless=True,                                           │
│    semester=6,                                              │
│    academic_year="2024-25",                                 │
│    vtu_url="https://results.vtu.ac.in/JJEcbcs25/index.php"  │
│  )                                                           │
│                                                              │
│  • Opens Selenium browser                                   │
│  • Navigates to vtu_url                                     │
│  • Enters USN                                               │
│  • Solves CAPTCHA                                           │
│  • Scrapes results                                          │
│  • Stores in StudentResult table with semester metadata     │
│  • Creates ScrapeLog entry                                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 9: Results Stored in Database                         │
│  ────────────────────────────────────────────────────       │
│  StudentResult:                                             │
│    student: 2AB22CS019                                      │
│    semester: 6                                              │
│    subject: Data Structures                                 │
│    marks: 85                                                │
│    grade: A                                                 │
│    academic_year: 2024-25 (stored via exam_schedule)        │
│                                                              │
│  ScrapeLog:                                                 │
│    usn: 2AB22CS019                                          │
│    status: SUCCESS                                          │
│    execution_time: 12.5s                                    │
│    scraped_at: 2025-11-26 10:45:00                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 10: Frontend Displays Result                          │
│  ────────────────────────────────────────────────────       │
│  ✓ Success!                                                 │
│    USN: 2AB22CS019                                          │
│    Records Created: 8                                       │
│    Execution Time: 12.5s                                    │
│                                                              │
│  • Logs table refreshes                                     │
│  • Stats update (success rate, avg time, etc.)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### Use Case 1: Scraping 2022 Batch 6th Semester Results (June 2025)

**Scenario**: VTU publishes June 2025 results for even semesters.

1. **Admin configures VTU Settings**:
   - Semester Type: Even (2,4,6,8)
   - Academic Year: 2024-25
   - URL: `https://results.vtu.ac.in/JJEcbcs25/index.php`
   - Clicks "Update 4 Semesters"

2. **Admin goes to Scraper**:
   - Selects: Semester 6, Academic Year 2024-25
   - System shows: ✓ Configured VTU URL: JJEcbcs25/index.php

3. **Admin scrapes**:
   - Enters USNs: 2AB22CS001, 2AB22CS002, 2AB22CS003...
   - System uses Sem 6 + 2024-25 URL automatically
   - All results stored with correct semester metadata

### Use Case 2: Scraping Multiple Batches (Same URL, Different Semesters)

**Scenario**: June 2025 results are published. Need to scrape:
- 2022 batch → Sem 6
- 2023 batch → Sem 4
- 2024 batch → Sem 2

All use the SAME URL: `https://results.vtu.ac.in/JJEcbcs25/index.php`

**Solution**:
1. Configure URL for all even semesters (2,4,6,8) + 2024-25

2. **Scrape 2022 batch (Sem 6)**:
   - Select: Semester 6, Academic Year 2024-25
   - Upload 2022 batch USN list
   - Scrape

3. **Scrape 2023 batch (Sem 4)**:
   - Change to: Semester 4, Academic Year 2024-25
   - Upload 2023 batch USN list
   - Scrape

4. **Scrape 2024 batch (Sem 2)**:
   - Change to: Semester 2, Academic Year 2024-25
   - Upload 2024 batch USN list
   - Scrape

**Result**: All stored with correct semester metadata even though they used the same URL!

### Use Case 3: Odd Semester Results (December 2025)

**Scenario**: VTU publishes December 2025 results for odd semesters.

1. **Admin configures VTU Settings**:
   - Semester Type: Odd (1,3,5,7)
   - Academic Year: 2025-26
   - URL: `https://results.vtu.ac.in/DJcbcs25/index.php`
   - Clicks "Update 4 Semesters"

2. **Scrape different batches**:
   - 2022 batch (Sem 7) → Select Sem 7 + 2025-26
   - 2023 batch (Sem 5) → Select Sem 5 + 2025-26
   - 2024 batch (Sem 3) → Select Sem 3 + 2025-26
   - 2025 batch (Sem 1) → Select Sem 1 + 2025-26

---

## Key Features

### ✅ Manual Control
- Admin explicitly selects semester and academic year
- No automatic detection that could go wrong
- Clear visibility of which configuration is being used

### ✅ URL Validation
- Frontend checks if URL is configured before allowing scrape
- Shows helpful error message with link to VTU Settings
- Prevents scraping with wrong/missing URLs

### ✅ Flexibility
- Same URL can be used for multiple semesters
- Different URLs for different semesters
- Easy to update when VTU changes URLs

### ✅ Audit Trail
- All scrapes store semester and academic year metadata
- Can query results by semester + academic year
- Historical tracking of which URLs were used

### ✅ User-Friendly UI
- Visual configuration panel with clear labels
- Semester type hints (Even - June/July, Odd - Dec/Jan)
- Real-time URL display
- Warning messages when not configured

---

## Technical Implementation

### Frontend Changes (`frontend/app/admin/scraper/page.tsx`)

**New State Variables**:
```typescript
const [selectedSemester, setSelectedSemester] = useState<number>(6);
const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-25');
const [vtuURL, setVtuURL] = useState('');
```

**URL Fetching**:
```typescript
useEffect(() => {
  if (token && selectedSemester && selectedAcademicYear) {
    fetchVTUURL();
  }
}, [selectedSemester, selectedAcademicYear, token]);

const fetchVTUURL = async () => {
  const response = await fetch(
    `${API_BASE_URL}/vtu-semester-urls/?semester=${selectedSemester}&academic_year=${selectedAcademicYear}&is_active=true`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await response.json();
  const results = Array.isArray(data) ? data : data.results || [];
  if (results.length > 0) {
    setVtuURL(results[0].url);
  }
};
```

**Scrape with Configuration**:
```typescript
const handleSingleScrape = async () => {
  if (!vtuURL) {
    alert(`No VTU URL configured for Semester ${selectedSemester}, Academic Year ${selectedAcademicYear}`);
    return;
  }

  await fetch(`${API_BASE_URL}/scraper/scrape/`, {
    method: 'POST',
    body: JSON.stringify({
      usn: singleUSN.trim(),
      semester: selectedSemester,
      academic_year: selectedAcademicYear,
      vtu_url: vtuURL
    })
  });
};
```

### Backend Changes (`result analysis/results/views.py`)

**Updated ScraperViewSet.scrape**:
```python
@action(detail=False, methods=['post'])
def scrape(self, request):
    semester = request.data.get('semester')
    academic_year = request.data.get('academic_year')
    vtu_url = request.data.get('vtu_url')

    # Validate required configuration
    if not all([semester, academic_year, vtu_url]):
        return Response({
            'error': 'Missing required configuration',
            'details': 'semester, academic_year, and vtu_url are required'
        }, status=400)

    # Pass to scraper service
    result = scrape_single_usn(
        usn,
        request.user,
        headless=True,
        semester=semester,
        academic_year=academic_year,
        vtu_url=vtu_url
    )
    return Response(result)
```

---

## Benefits

1. **Eliminates Manual URL Updates**: Admin updates URLs once in VTU Settings, scraper automatically uses them
2. **Prevents Errors**: Can't scrape without configured URL, prevents using wrong URLs
3. **Flexible**: Same URL for multiple semesters, or different URLs per semester
4. **Auditable**: All results tagged with semester + academic year
5. **Future-Proof**: Easy to add new academic years and semesters
6. **User-Friendly**: Clear UI showing current configuration

---

## Summary

The scraper now supports **semester-wise configuration** where:
1. Admin configures URLs in VTU Settings (one-time setup per semester type)
2. Admin selects semester + academic year in Scraper page
3. System auto-fetches correct URL from database
4. Admin scrapes with confidence that correct URL is used
5. Results stored with proper semester metadata

This eliminates the need for manual URL updates before each scrape and ensures data integrity across different batches and semesters!
