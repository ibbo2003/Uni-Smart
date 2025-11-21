# Postman Collection Guide

## 📦 UniSmart API Postman Collection

Complete guide for using the UniSmart API Postman collection.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Collection Contents](#collection-contents)
- [Setup Instructions](#setup-instructions)
- [Authentication Flow](#authentication-flow)
- [Using the Collection](#using-the-collection)
- [Environment Variables](#environment-variables)
- [Example Workflows](#example-workflows)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🚀 Quick Start

### 1. Import Collection

**Method 1: File Import**
1. Open Postman
2. Click **Import** button
3. Select `UniSmart_API.postman_collection.json`
4. Click **Import**

**Method 2: Drag & Drop**
1. Open Postman
2. Drag `UniSmart_API.postman_collection.json` into Postman window
3. Collection auto-imports

### 2. Import Environment

1. Click **Environments** (left sidebar)
2. Click **Import**
3. Select `UniSmart_Environment.postman_environment.json`
4. Click **Import**
5. Select **UniSmart Local Development** environment (top-right dropdown)

### 3. Configure Environment

1. Click **Environments** → **UniSmart Local Development**
2. Update values:
   - `base_url`: Your server URL (default: `http://localhost:8000`)
   - `admin_username`: Your admin username
   - `admin_password`: Your admin password
3. Click **Save**

### 4. Test Connection

1. Ensure server is running: `python manage.py runserver`
2. Open **Authentication** → **Login** request
3. Click **Send**
4. Check response: Should receive access and refresh tokens
5. Tokens auto-saved to environment variables

### 5. Start Using!

All requests now use the saved token automatically. You're ready to explore the API!

---

## 📚 Collection Contents

The collection includes **8 folders** with **35+ requests**:

### 1. 🔐 Authentication (3 requests)
- Login (JWT token generation)
- Refresh Token
- Verify Token

### 2. 👥 Students (5 requests)
- List Students
- Get Student Details
- Get Student Results
- Get Student Analytics
- Get Student Transcript

### 3. 🏢 Departments (4 requests)
- List Departments
- Get Department Details
- Get Department Students
- Get Department Performance

### 4. 📚 Subjects (5 requests)
- List Subjects
- Get Subject Details
- Get Subject Analytics
- Create Subject
- Create Audit Course ⭐ NEW!

### 5. 📊 Results (2 requests)
- List Results
- Get Result Details

### 6. 🔍 Scraper - Admin Only (3 requests)
- Scrape Single USN
- Scrape Multiple USNs
- Get Scrape Logs

### 7. 📈 Analytics (5 requests)
- Dashboard Statistics
- Subject Analytics
- Batch Analytics
- Department Overview
- Student Comparison

### 8. ⚙️ System Settings - Admin Only ⭐ NEW! (3 requests)
- Get All Settings
- Get VTU Portal URL
- Update VTU Portal URL

---

## 🔧 Setup Instructions

### Prerequisites

1. **Postman Installed**
   - Download: https://www.postman.com/downloads/

2. **UniSmart Server Running**
   ```bash
   cd uni-smart
   python manage.py runserver
   ```

3. **Admin User Created**
   ```bash
   python manage.py createsuperuser
   ```

### Step-by-Step Setup

#### Step 1: Import Files

```
1. Open Postman
2. Click "Import" (top-left)
3. Select both files:
   - UniSmart_API.postman_collection.json
   - UniSmart_Environment.postman_environment.json
4. Click "Import"
```

#### Step 2: Select Environment

```
1. Look at top-right corner
2. Click environment dropdown
3. Select "UniSmart Local Development"
4. Environment is now active (shown in top-right)
```

#### Step 3: Update Environment Variables

```
1. Click eye icon (👁) next to environment dropdown
2. Click "Edit" (pencil icon)
3. Update these values:
   - base_url: http://localhost:8000 (or your server URL)
   - admin_username: your-admin-username
   - admin_password: your-admin-password
   - test_usn: valid-usn-number (for testing)
4. Click "Save"
```

#### Step 4: Test Authentication

```
1. Open collection: UniSmart Result Analysis API
2. Open folder: 🔐 Authentication
3. Click: Login
4. Click: Send
5. Verify:
   - Status: 200 OK
   - Response contains "access" and "refresh" tokens
   - Tokens automatically saved (check environment variables)
```

#### Step 5: Verify Setup

```
1. Open folder: 👥 Students
2. Click: List Students
3. Click: Send
4. Should see list of students (if any exist)
5. Status: 200 OK = Setup successful! ✅
```

---

## 🔑 Authentication Flow

### Automatic Token Management

The collection includes **automatic token handling**:

1. **Login Request**
   - Sends username/password
   - Receives access + refresh tokens
   - **Auto-saves** tokens to environment variables

2. **All Other Requests**
   - Automatically include `Authorization: Bearer {{access_token}}`
   - No manual token copy-paste needed!

3. **Token Refresh**
   - Access token expires after 60 minutes
   - Use "Refresh Token" request to get new access token
   - New token auto-saved

### Manual Token Update

If needed, manually set token:

```
1. Click eye icon (👁) next to environment
2. Find "access_token" variable
3. Click edit
4. Paste your token
5. Save
```

### Authorization Header

All requests (except Login) automatically include:

```
Authorization: Bearer {{access_token}}
```

Configured at collection level → inherited by all requests.

---

## 💡 Using the Collection

### Basic Request Flow

1. **Select Request**
   - Navigate folder structure
   - Click desired request

2. **Review Request**
   - Method (GET/POST/PUT/DELETE)
   - URL with variables
   - Headers (auto-configured)
   - Body (if POST/PUT)

3. **Modify if Needed**
   - Update query parameters
   - Change request body
   - Add filters

4. **Send Request**
   - Click "Send" button
   - View response in bottom panel

5. **Inspect Response**
   - Body: JSON response
   - Status: HTTP status code
   - Headers: Response headers
   - Test Results: If tests configured

### Using Variables

Collection uses variables for flexibility:

```
{{base_url}} - Server URL
{{access_token}} - JWT token
{{test_usn}} - Test USN for scraping
:id - Path parameter (replace manually)
```

**Example:**
```
URL: {{base_url}}/api/students/:id/

Replace :id with actual UUID:
{{base_url}}/api/students/123e4567-e89b-12d3-a456-426614174000/
```

### Query Parameters

Many requests have optional query parameters:

```
Enabled ✓ - Parameter included in request
Disabled - Parameter excluded

Toggle by checking/unchecking boxes
```

**Example - List Students:**
```
?page=1 ✓ Enabled
?page_size=50 ✓ Enabled
?search=John - Disabled
?department=uuid - Disabled

Result: /api/students/?page=1&page_size=50
```

---

## 🌍 Environment Variables

### Available Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `base_url` | Default | Server URL | `http://localhost:8000` |
| `access_token` | Secret | JWT access token | Auto-filled on login |
| `refresh_token` | Secret | JWT refresh token | Auto-filled on login |
| `admin_username` | Default | Admin username | `admin` |
| `admin_password` | Secret | Admin password | `admin123` |
| `test_usn` | Default | Test USN for scraping | `2AB22CS008` |
| `test_student_id` | Default | Test student UUID | Set manually |
| `test_department_id` | Default | Test department UUID | Set manually |
| `test_subject_id` | Default | Test subject UUID | Set manually |
| `vtu_url` | Default | Current VTU portal URL | See settings |

### Using Variables in Requests

**In URL:**
```
{{base_url}}/api/students/
```

**In Headers:**
```
Authorization: Bearer {{access_token}}
```

**In Body:**
```json
{
  "usn": "{{test_usn}}"
}
```

### Creating Additional Environments

For different deployments:

**Development:**
```json
{
  "base_url": "http://localhost:8000"
}
```

**Staging:**
```json
{
  "base_url": "https://staging.unismart.com"
}
```

**Production:**
```json
{
  "base_url": "https://api.unismart.com"
}
```

Switch environments using dropdown (top-right).

---

## 🔄 Example Workflows

### Workflow 1: Complete Student Analysis

**Goal:** Scrape results and view analytics for a student

```
1. 🔐 Authentication → Login
   ✓ Get token

2. 🔍 Scraper → Scrape Single USN
   Body: {"usn": "2AB22CS008"}
   ✓ Results scraped

3. 👥 Students → List Students
   Query: ?search=2AB22CS008
   ✓ Get student ID from response

4. 👥 Students → Get Student Analytics
   Replace :id with student UUID
   ✓ View CGPA, SGPA, backlogs

5. 👥 Students → Get Student Transcript
   ✓ Full academic record
```

### Workflow 2: Update VTU Portal URL

**Goal:** Update VTU URL when semester changes

```
1. 🔐 Authentication → Login
   ✓ Get admin token

2. ⚙️ System Settings → Get VTU Portal URL
   ✓ See current URL

3. ⚙️ System Settings → Update VTU Portal URL
   Body: {"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}
   ✓ URL updated

4. ⚙️ System Settings → Get VTU Portal URL
   ✓ Verify new URL

5. 🔍 Scraper → Scrape Single USN
   ✓ Test with new URL
```

### Workflow 3: Create Audit Course

**Goal:** Add Environmental Studies as Audit Course

```
1. 🔐 Authentication → Login
   ✓ Admin access

2. 🏢 Departments → List Departments
   ✓ Get department UUID

3. 📚 Subjects → Create Audit Course
   Body:
   {
     "code": "BES",
     "name": "Environmental Studies",
     "short_name": "Environmental",
     "subject_type": "AUDIT",
     "credits": 1,
     "department": "dept-uuid-here"
   }
   ✓ Audit course created

4. 📚 Subjects → List Subjects
   Query: ?subject_type=AUDIT
   ✓ Verify creation
```

### Workflow 4: Department Performance Analysis

**Goal:** Analyze department performance

```
1. 🔐 Authentication → Login
   ✓ Faculty/Admin token

2. 🏢 Departments → List Departments
   ✓ Get department UUID

3. 🏢 Departments → Get Department Performance
   Replace :id with dept UUID
   ✓ Overall performance

4. 📈 Analytics → Department Overview
   Query: ?department=dept-uuid&semester=6
   ✓ Detailed analytics

5. 📈 Analytics → Subject Analytics
   Query: ?subject_code=BCS601&semester=6
   ✓ Subject-wise breakdown
```

### Workflow 5: Batch Result Scraping

**Goal:** Scrape results for entire class

```
1. 🔐 Authentication → Login
   ✓ Admin token

2. 🔍 Scraper → Scrape Multiple USNs
   Body:
   {
     "usn_list": [
       "2AB22CS001",
       "2AB22CS002",
       "2AB22CS003",
       ...
       "2AB22CS060"
     ]
   }
   ✓ Batch scraping initiated

3. 🔍 Scraper → Get Scrape Logs
   Query: ?status=SUCCESS
   ✓ Verify all scraped successfully

4. 📈 Analytics → Batch Analytics
   Query: ?batch=2022&department=dept-uuid
   ✓ Class performance overview
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to server"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution:**
```bash
# Check server is running
python manage.py runserver

# Verify base_url in environment
# Should be: http://localhost:8000 (no trailing slash)
```

### Issue 2: "Authentication credentials not provided"

**Error:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Solution:**
```
1. Run Login request first
2. Check access_token variable is set
3. Verify Authorization header includes token
4. Token may be expired - use Refresh Token request
```

### Issue 3: "Token expired"

**Error:**
```json
{
  "detail": "Given token not valid for any token type"
}
```

**Solution:**
```
1. Open: 🔐 Authentication → Refresh Token
2. Click Send
3. New access token saved automatically
4. Retry your request
```

### Issue 4: "Permission denied"

**Error:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Solution:**
```
Some endpoints require admin role:
- Scraper endpoints
- System Settings updates
- Subject creation

Ensure logged-in user has admin role
```

### Issue 5: "Invalid URL format" (VTU Link Update)

**Error:**
```json
{
  "error": "Invalid VTU URL format. Must start with https://results.vtu.ac.in/"
}
```

**Solution:**
```
VTU URL must:
✓ Start with: https://results.vtu.ac.in/
✓ Include: semester code (e.g., JJEcbcs26)
✓ End with: index.php

Example: https://results.vtu.ac.in/JJEcbcs26/index.php
```

### Issue 6: Variables not working

**Problem:**
Variables like `{{base_url}}` not replaced

**Solution:**
```
1. Check environment is selected (top-right dropdown)
2. Click eye icon (👁) to view variables
3. Ensure variables have values
4. Save environment after editing
```

### Issue 7: Tests failing

**Problem:**
Request successful but tests show failures

**Solution:**
```
1. Open request
2. Click "Tests" tab
3. Review test scripts
4. Tests are optional - can be disabled
5. Focus on response body/status code
```

---

## ✅ Best Practices

### 1. Use Environments for Different Deployments

Create separate environments:
- Local Development
- Staging
- Production

Switch as needed - prevents accidental production changes!

### 2. Save Commonly Used IDs

After getting UUIDs, save to environment:

```
1. Send request to get list
2. Copy UUID from response
3. Add to environment:
   - test_student_id
   - test_department_id
   - test_subject_id
4. Use in future requests
```

### 3. Organize with Folders

Create custom folders for:
- Your test cases
- Specific workflows
- Integration tests

Drag requests into folders for organization.

### 4. Use Collection Runner

For automated testing:

```
1. Click collection name
2. Click "Run"
3. Select requests to run
4. Configure iterations
5. Run sequence
```

### 5. Share Collections

Export and share with team:

```
1. Click collection (...)
2. Click "Export"
3. Save JSON file
4. Share with team members
```

### 6. Use Pre-request Scripts

Automate setup:

```javascript
// Example: Auto-generate timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Example: Calculate values
const semester = 6;
pm.environment.set("semester", semester);
```

### 7. Monitor API Performance

Use Tests tab to track performance:

```javascript
pm.test("Response time < 500ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

### 8. Document Custom Requests

Add descriptions to your custom requests:

```
Request Description:
- What it does
- When to use
- Expected response
- Dependencies
```

### 9. Version Control

Keep collection files in version control:

```bash
git add *.postman_collection.json
git add *.postman_environment.json
git commit -m "Update Postman collection"
```

### 10. Regular Token Refresh

Set reminder to refresh token:
- Access tokens expire after 60 minutes
- Refresh before long test sessions
- Or add auto-refresh script

---

## 📊 Collection Features

### Automatic Token Handling ✅

- Login → Auto-saves tokens
- All requests → Auto-use token
- Refresh → Auto-updates token

### Test Scripts Included ✅

Many requests include tests:
- Status code validation
- Response structure checks
- Data presence verification

### Example Responses ✅

Key requests include example responses:
- Success scenarios
- Error scenarios
- Different response codes

### Comprehensive Documentation ✅

Each request includes:
- Description
- Parameter explanations
- Use cases
- Notes and warnings

### Organized Structure ✅

- Logical folder grouping
- Intuitive naming
- Role-based organization

---

## 🎯 Quick Reference

### Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request body/params |
| 401 | Unauthorized | Login or refresh token |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Check URL/resource exists |
| 500 | Server Error | Check server logs |

### Request Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve data | List students |
| POST | Create data | Scrape USN |
| PUT | Update data | Update VTU URL |
| PATCH | Partial update | Update student field |
| DELETE | Delete data | Remove record |

### Folder Access Requirements

| Folder | Roles Allowed |
|--------|---------------|
| Authentication | All |
| Students | All (filtered by role) |
| Departments | All |
| Subjects | All |
| Results | All (filtered by role) |
| **Scraper** | **Admin only** |
| Analytics | All (filtered by role) |
| **System Settings** | **Admin only** |

---

## 📝 Cheat Sheet

### Quick Start
```
1. Import collection + environment
2. Select environment
3. Update base_url, username, password
4. Run Login
5. Start testing!
```

### Get Token
```
Authentication → Login → Send
Token auto-saved ✓
```

### Refresh Token
```
Authentication → Refresh Token → Send
```

### Scrape Student
```
Scraper → Scrape Single USN
Body: {"usn": "2AB22CS008"}
```

### Update VTU URL
```
System Settings → Update VTU Portal URL
Body: {"url": "new-url"}
```

### View Student Analytics
```
Students → Get Student Analytics
Replace :id with student UUID
```

### Create Audit Course
```
Subjects → Create Audit Course
Set subject_type: "AUDIT"
Set credits: 1
```

---

## 🔗 Additional Resources

### Documentation
- **API_DOCUMENTATION.md** - Complete API reference
- **SUBJECT_TYPES_GUIDE.md** - Audit Courses guide
- **SYSTEM_SETTINGS_GUIDE.md** - VTU URL management
- **QUICK_REFERENCE.md** - Quick commands

### Postman Resources
- **Postman Learning Center**: https://learning.postman.com/
- **Postman Environments**: https://learning.postman.com/docs/sending-requests/managing-environments/
- **Collection Runner**: https://learning.postman.com/docs/running-collections/intro-to-collection-runs/

### Support
- **GitHub Issues**: Report collection issues
- **Email**: api-support@unismart.com

---

## 🎉 Collection Highlights

### ⭐ New in v2.0

1. **System Settings Folder**
   - Get/Update VTU portal URL
   - Dynamic configuration management
   - Zero downtime updates

2. **Audit Course Examples**
   - Create Audit Course request
   - Subject type filters
   - CGPA exclusion demonstration

3. **Enhanced Documentation**
   - Detailed descriptions
   - Use case examples
   - Response samples

4. **Automatic Testing**
   - Pre-configured test scripts
   - Response validation
   - Performance monitoring

---

**📬 Questions or Issues?**

Open a GitHub issue or check the documentation files:
- README.md
- API_DOCUMENTATION.md
- SYSTEM_SETTINGS_GUIDE.md

**Happy Testing! 🚀**

---

**Last Updated:** November 2025 (v2.0)
**Collection Version:** 2.0
**API Version:** 2.0
