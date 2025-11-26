# Scraper Backend Updates - Parameter Support

## Changes Made

Updated the entire scraping pipeline to support semester-wise configuration parameters.

---

## Files Modified

### 1. **result analysis/results/views.py** (ScraperViewSet)

**Updated `scrape()` action** to accept and validate new parameters:

```python
@action(detail=False, methods=['post'])
def scrape(self, request):
    # Get configuration from request
    semester = request.data.get('semester')
    academic_year = request.data.get('academic_year')
    vtu_url = request.data.get('vtu_url')

    # Validate required parameters
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
```

---

### 2. **result analysis/results/scraper_service.py**

#### Updated `VTUResultScraper.__init__`

```python
def __init__(self, headless: bool = True, max_captcha_attempts: int = 5, vtu_url: Optional[str] = None):
    # Use provided VTU URL or get from database settings
    if vtu_url:
        self.VTU_RESULTS_URL = vtu_url
    else:
        self.VTU_RESULTS_URL = SystemSettings.get_setting('VTU_RESULTS_URL', default='...')
```

**Purpose**: Accepts custom VTU URL instead of always using database setting.

---

#### Updated `_save_to_database`

```python
def _save_to_database(self, result_data: Dict, initiated_by: User, semester: Optional[int] = None, academic_year: Optional[str] = None):
    # Use provided semester or fallback to parsed semester
    semester = semester if semester is not None else result_data.get('semester')
```

**Purpose**: Accepts semester and academic_year as metadata for storing results.

---

#### Updated `scrape_result`

```python
def scrape_result(self, usn: str, initiated_by: User, semester: Optional[int] = None, academic_year: Optional[str] = None):
    logger.info(f"Starting scrape for USN: {usn} (Semester: {semester}, Academic Year: {academic_year})")

    # ... scraping logic ...

    # Pass metadata to database save
    records_created, records_updated = self._save_to_database(
        result_data,
        initiated_by,
        semester=semester,
        academic_year=academic_year
    )
```

**Purpose**: Logs and passes semester/academic_year through scraping pipeline.

---

#### Updated `scrape_batch`

```python
def scrape_batch(self, usn_list: List[str], initiated_by: User, delay_seconds: int = 2, semester: Optional[int] = None, academic_year: Optional[str] = None):
    for usn in usn_list:
        result = self.scrape_result(usn, initiated_by, semester=semester, academic_year=academic_year)
        # ...
        time.sleep(delay_seconds)
```

**Purpose**: Passes semester/academic_year to each individual scrape.

---

#### Updated `scrape_single_usn` (convenience function)

```python
def scrape_single_usn(
    usn: str,
    initiated_by: User,
    headless: bool = True,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    vtu_url: Optional[str] = None
) -> Dict:
    with VTUResultScraper(headless=headless, vtu_url=vtu_url) as scraper:
        return scraper.scrape_result(usn, initiated_by, semester=semester, academic_year=academic_year)
```

**Purpose**: Entry point that accepts all parameters and passes them through.

---

#### Updated `scrape_batch_usns` (convenience function)

```python
def scrape_batch_usns(
    usn_list: List[str],
    initiated_by: User,
    headless: bool = True,
    delay_seconds: int = 3,
    semester: Optional[int] = None,
    academic_year: Optional[str] = None,
    vtu_url: Optional[str] = None
) -> Dict:
    with VTUResultScraper(headless=headless, vtu_url=vtu_url) as scraper:
        return scraper.scrape_batch(usn_list, initiated_by, delay_seconds=delay_seconds, semester=semester, academic_year=academic_year)
```

**Purpose**: Entry point for batch scraping with parameters.

---

## Parameter Flow

```
Frontend (/admin/scraper)
  │
  │ User selects: Semester=6, Academic Year=2024-25
  │ System fetches: vtu_url = "https://results.vtu.ac.in/JJEcbcs25/index.php"
  │
  ▼
POST /api/scraper/scrape/
{
  "usn": "2AB22CS019",
  "semester": 6,
  "academic_year": "2024-25",
  "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/index.php"
}
  │
  ▼
ScraperViewSet.scrape()
  │ Validates parameters
  │ Calls scrape_single_usn()
  │
  ▼
scrape_single_usn()
  │ Creates VTUResultScraper(vtu_url=vtu_url)
  │ Calls scraper.scrape_result(semester=6, academic_year="2024-25")
  │
  ▼
VTUResultScraper.scrape_result()
  │ Uses self.VTU_RESULTS_URL (set to provided vtu_url)
  │ Navigates to portal
  │ Solves CAPTCHA
  │ Scrapes results
  │ Calls _save_to_database(semester=6, academic_year="2024-25")
  │
  ▼
_save_to_database()
  │ Uses semester=6 (overrides parsed semester if needed)
  │ Stores results with metadata
  │ Creates StudentResult records
  │
  ▼
Response returned to frontend
{
  "success": true,
  "usn": "2AB22CS019",
  "records_created": 8,
  "execution_time": 12.5
}
```

---

## Benefits

1. **URL Flexibility**: Can use different URLs for different semesters without changing code
2. **Metadata Accuracy**: Semester and academic_year explicitly provided instead of inferred
3. **Manual Control**: Admin has full control over configuration
4. **Validation**: Backend validates all required parameters before scraping
5. **Backward Compatible**: All parameters are optional, fallback to defaults if not provided

---

## Testing

The scraper now properly accepts these parameters from the frontend and uses them throughout the scraping process. The 500 Internal Server Error should be resolved.

### Test Case 1: Single Scrape with Configuration
```bash
curl -X POST http://localhost:8001/api/scraper/scrape/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "usn": "2AB22CS019",
    "semester": 6,
    "academic_year": "2024-25",
    "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/index.php"
  }'
```

### Test Case 2: Batch Scrape with Configuration
```bash
curl -X POST http://localhost:8001/api/scraper/scrape/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "usn_list": ["2AB22CS001", "2AB22CS002", "2AB22CS003"],
    "semester": 6,
    "academic_year": "2024-25",
    "vtu_url": "https://results.vtu.ac.in/JJEcbcs25/index.php"
  }'
```

---

## Logging

The scraper now logs semester and academic year information:

```
INFO: Starting scrape for USN: 2AB22CS019 (Semester: 6, Academic Year: 2024-25)
INFO: Navigated to https://results.vtu.ac.in/JJEcbcs25/index.php
INFO: Saving results to database (Semester: 6, Academic Year: 2024-25)...
```

This makes debugging and monitoring much easier!
