# UniSmart Documentation Index

## 📚 Complete Documentation Guide

Welcome to the UniSmart Result Analysis System documentation! This index will help you navigate all available documentation.

---

## 🚀 Getting Started

### For New Users

1. **[README.md](README.md)** - Start here!
   - Project overview
   - Feature list
   - Quick start guide
   - Installation instructions

2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup
   - Environment setup
   - Database configuration
   - Troubleshooting setup issues

3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands
   - Common commands
   - Quick API examples
   - Troubleshooting tips

---

## 🆕 New Features (v2.0)

### ⭐ Must-Read for Upgrading Users

1. **[SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md)** - **NEW!**
   - **What**: Complete guide to VTU subject types
   - **Why**: Understand Audit Courses and their impact on CGPA
   - **When**: Before processing results with Audit courses
   - **Key Topics**:
     - 7 subject types explained
     - Audit vs Non-Credit differences
     - CGPA calculation rules
     - Migration guides
     - FAQs

2. **[SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md)** - **NEW!**
   - **What**: Dynamic configuration management
   - **Why**: Update VTU portal URL without code changes
   - **When**: Every semester when VTU changes URLs
   - **Key Topics**:
     - VTU link management
     - Multiple update methods
     - API reference
     - Best practices
     - Real-world scenarios

---

## 📖 Core Documentation

### Development

**[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**
- Code organization
- Module breakdown
- File structure
- Architecture overview

**[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**
- Technical summary
- Technology stack
- Design decisions
- System architecture

### API Documentation

**[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**
- Complete API reference
- All endpoints documented
- Request/response examples
- Authentication guide
- Error codes
- **NEW**: System Settings endpoints

**[ANALYTICS_API_DOCUMENTATION.md](ANALYTICS_API_DOCUMENTATION.md)**
- Analytics endpoints
- Real-time analytics
- Performance metrics
- Department analytics
- Student comparisons

---

## 📋 By User Role

### For Administrators

**Essential Reading:**
1. [README.md](README.md) - Overview
2. [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md) - Manage VTU URL
3. [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md) - Understand subject types
4. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API access

**Key Tasks:**
- Update VTU portal URL each semester
- Manage system settings
- Create users and assign roles
- Monitor scraping operations
- Generate analytics reports

### For Faculty

**Essential Reading:**
1. [README.md](README.md) - Overview
2. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Department analytics
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common operations

**Key Tasks:**
- View department performance
- Access student analytics
- Export reports
- Monitor student progress

### For Developers

**Essential Reading:**
1. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical details
3. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API specs
4. [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md) - Business logic
5. [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md) - Configuration system

**Key Tasks:**
- Understand codebase
- Implement new features
- Debug issues
- Write tests
- Deploy updates

---

## 🎯 By Task

### Setup & Installation

📄 **Documents to Read:**
- [README.md](README.md) - Quick start (5 min)
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands

🔧 **Key Commands:**
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py init_settings  # NEW!
python manage.py runserver
```

### Managing VTU Portal URL

📄 **Documents to Read:**
- [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md) - Complete guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md#system-settings-endpoints) - API reference
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#system-settings-management) - Quick commands

🔧 **Key Commands:**
```bash
# Via API
curl -X PUT /api/settings/vtu-link/update/ \
  -d '{"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}'

# Via Django Admin
Navigate to Admin → System Settings → VTU_RESULTS_URL

# Via Shell
python manage.py shell
SystemSettings.set_setting('VTU_RESULTS_URL', 'new-url')
```

### Working with Audit Courses

📄 **Documents to Read:**
- [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md) - Complete guide
- [README.md](README.md#subject-types--audit-courses) - Quick overview
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#audit-courses-management) - Quick commands

🔧 **Key Commands:**
```bash
# Migrate existing subjects
python manage.py migrate_audit_courses

# Verify CGPA calculation
python manage.py shell
student = Student.objects.get(usn='USN')
print(student.calculate_cgpa())  # Excludes Audit courses
```

### Scraping Results

📄 **Documents to Read:**
- [README.md](README.md#scraping) - Overview
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md#scraper-endpoints) - API details
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#scrape-results) - Quick examples

🔧 **Key Commands:**
```bash
# Via API
POST /api/scraper/scrape/
Body: {"usn": "2AB22CS008"}

# Via Shell
python manage.py shell
from results.scraper_service import scrape_single_usn
result = scrape_single_usn('USN', admin_user)
```

### Calculating CGPA/SGPA

📄 **Documents to Read:**
- [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md#cgpa-calculation-rules) - Calculation rules
- [README.md](README.md#cgpasgpa-calculation) - Overview
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#calculate-cgpa) - Quick code

🔧 **Key Code:**
```python
from results.models import Student

student = Student.objects.get(usn='2AB22CS008')
cgpa = student.calculate_cgpa()  # Excludes NON_CREDIT and AUDIT
sgpa = student.calculate_sgpa(semester=6)
```

### API Integration

📄 **Documents to Read:**
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [ANALYTICS_API_DOCUMENTATION.md](ANALYTICS_API_DOCUMENTATION.md) - Analytics APIs
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#api-quick-reference) - Quick examples

🔧 **Authentication:**
```bash
# Get token
POST /api/auth/login/
Body: {"username": "admin", "password": "pass"}

# Use token
curl -H "Authorization: Bearer TOKEN" /api/students/
```

### Troubleshooting

📄 **Documents to Read:**
- [README.md](README.md#troubleshooting) - Common issues
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md#troubleshooting) - Quick fixes
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup issues
- [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md#troubleshooting) - Settings issues
- [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md#troubleshooting) - Subject type issues

---

## 📊 Documentation Map

```
UniSmart Documentation
│
├── 🚀 Getting Started
│   ├── README.md (main entry point)
│   ├── SETUP_GUIDE.md (detailed setup)
│   └── QUICK_REFERENCE.md (quick commands)
│
├── 🆕 New Features (v2.0)
│   ├── SUBJECT_TYPES_GUIDE.md (Audit Courses) ⭐
│   └── SYSTEM_SETTINGS_GUIDE.md (VTU URL Management) ⭐
│
├── 🔌 API Documentation
│   ├── API_DOCUMENTATION.md (main API reference)
│   └── ANALYTICS_API_DOCUMENTATION.md (analytics endpoints)
│
├── 🏗 Architecture & Code
│   ├── PROJECT_STRUCTURE.md (code organization)
│   └── PROJECT_SUMMARY.md (technical summary)
│
└── 📖 This File
    └── DOCUMENTATION_INDEX.md (you are here)
```

---

## 🔄 Documentation Updates

### Version 2.0 (Nov 2025)

**New Documentation:**
- ✅ SUBJECT_TYPES_GUIDE.md - Comprehensive guide to VTU subject types
- ✅ SYSTEM_SETTINGS_GUIDE.md - Dynamic configuration management
- ✅ DOCUMENTATION_INDEX.md - This file!

**Updated Documentation:**
- ✅ README.md - Added Audit Course section
- ✅ README.md - Added VTU Link Management section
- ✅ API_DOCUMENTATION.md - Added System Settings endpoints
- ✅ QUICK_REFERENCE.md - Added new feature commands

**New Features Documented:**
- ✅ Audit Course support (AUDIT subject type)
- ✅ Dynamic VTU portal URL management
- ✅ SystemSettings model and API
- ✅ Management commands (init_settings, migrate_audit_courses)
- ✅ CGPA calculation exclusions

### Version 1.0 (Initial Release)

- README.md
- API_DOCUMENTATION.md
- SETUP_GUIDE.md
- PROJECT_STRUCTURE.md
- PROJECT_SUMMARY.md
- QUICK_REFERENCE.md
- ANALYTICS_API_DOCUMENTATION.md

---

## 💡 Quick Navigation Tips

### I want to...

**...get started quickly**
→ [README.md](README.md) → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**...understand Audit Courses**
→ [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md)

**...update VTU portal URL**
→ [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md)

**...use the API**
→ [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**...understand the codebase**
→ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**...troubleshoot an issue**
→ [QUICK_REFERENCE.md#troubleshooting](QUICK_REFERENCE.md#troubleshooting) → Relevant guide

**...deploy to production**
→ [README.md#deployment](README.md#deployment) → [SETUP_GUIDE.md](SETUP_GUIDE.md)

**...calculate CGPA correctly**
→ [SUBJECT_TYPES_GUIDE.md#cgpa-calculation-rules](SUBJECT_TYPES_GUIDE.md#cgpa-calculation-rules)

---

## 📝 Documentation Standards

### All Documentation Follows

✅ **Clear Structure**: TOC, headings, sections
✅ **Code Examples**: Runnable, tested code snippets
✅ **Real-World Scenarios**: Practical use cases
✅ **Troubleshooting**: Common issues and solutions
✅ **FAQs**: Frequently asked questions
✅ **Cross-References**: Links to related docs

### Keeping Documentation Updated

When you:
- Add a feature → Update relevant docs
- Change an API → Update API_DOCUMENTATION.md
- Fix a bug → Update troubleshooting section
- Add a model → Update PROJECT_STRUCTURE.md
- Change configuration → Update SYSTEM_SETTINGS_GUIDE.md

---

## 🎓 Learning Path

### Beginner (New to UniSmart)

**Week 1: Setup & Basics**
1. Day 1-2: [README.md](README.md) + [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Day 3-4: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) + Hands-on practice
3. Day 5: [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Authentication & Basic endpoints

**Week 2: Core Features**
1. Day 1-2: [SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md)
2. Day 3-4: [SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md)
3. Day 5: Practice with real data

### Intermediate (Familiar with basics)

1. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Understand architecture
2. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - All endpoints
3. [ANALYTICS_API_DOCUMENTATION.md](ANALYTICS_API_DOCUMENTATION.md) - Analytics
4. Practice custom queries and reports

### Advanced (Contributing developer)

1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical depth
2. All guides - Complete understanding
3. Django/DRF documentation
4. Write tests and documentation

---

## 🔍 Search Tips

**Finding Information:**

1. **Start with this file** (DOCUMENTATION_INDEX.md) - Navigate by task or role
2. **Use Ctrl+F** in individual docs for keywords
3. **Check cross-references** - Docs link to each other
4. **Look at examples** - Code examples in every guide

**Common Search Terms:**

| Looking for | Search in | Keyword |
|------------|-----------|---------|
| VTU URL update | SYSTEM_SETTINGS_GUIDE.md | "VTU URL", "update" |
| Audit courses | SUBJECT_TYPES_GUIDE.md | "Audit", "CGPA" |
| API endpoints | API_DOCUMENTATION.md | Endpoint path |
| Setup issues | SETUP_GUIDE.md, QUICK_REFERENCE.md | Error message |
| Code structure | PROJECT_STRUCTURE.md | Module name |
| Quick command | QUICK_REFERENCE.md | Command keyword |

---

## 📧 Documentation Feedback

Found an issue? Have a suggestion?

1. Check if it's already documented
2. Open GitHub Issue with label "documentation"
3. Submit PR with documentation improvements
4. Contact: docs@unismart.com

---

## ✅ Documentation Checklist

Before releasing a feature, ensure:

- [ ] Feature documented in README.md
- [ ] API endpoints in API_DOCUMENTATION.md
- [ ] Quick reference in QUICK_REFERENCE.md
- [ ] Code examples included
- [ ] Troubleshooting section added
- [ ] Cross-references updated
- [ ] FAQs added if needed
- [ ] This index updated

---

## 📅 Documentation Maintenance

**Regular Updates:**
- ✅ After each major release
- ✅ When APIs change
- ✅ When new features added
- ✅ When bugs fixed
- ✅ User feedback received

**Review Schedule:**
- Minor updates: As needed
- Major review: Every release
- Complete audit: Annually

---

## 🎯 Quick Start Recommendations

### For Each User Type

**Administrator (First Time)**
```
1. README.md (30 min)
2. SETUP_GUIDE.md (1 hour)
3. SYSTEM_SETTINGS_GUIDE.md (45 min)
4. SUBJECT_TYPES_GUIDE.md (1 hour)
Total: ~3 hours to become proficient
```

**Developer (New to Project)**
```
1. README.md (20 min)
2. PROJECT_STRUCTURE.md (45 min)
3. PROJECT_SUMMARY.md (30 min)
4. API_DOCUMENTATION.md (1 hour)
5. SUBJECT_TYPES_GUIDE.md (1 hour)
Total: ~4 hours to start contributing
```

**API Consumer (Integration)**
```
1. README.md (15 min)
2. API_DOCUMENTATION.md (2 hours)
3. ANALYTICS_API_DOCUMENTATION.md (45 min)
Total: ~3 hours to integrate
```

---

## 🌟 Documentation Highlights

### Most Important Pages

1. **[README.md](README.md)** - Overview and quick start
2. **[SUBJECT_TYPES_GUIDE.md](SUBJECT_TYPES_GUIDE.md)** - Critical for understanding VTU system
3. **[SYSTEM_SETTINGS_GUIDE.md](SYSTEM_SETTINGS_GUIDE.md)** - Essential for administrators
4. **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference

### Most Common Questions Answered

1. **What are Audit Courses?** → [SUBJECT_TYPES_GUIDE.md#understanding-audit-courses](SUBJECT_TYPES_GUIDE.md#understanding-audit-courses)
2. **How to update VTU URL?** → [SYSTEM_SETTINGS_GUIDE.md#managing-vtu-portal-url](SYSTEM_SETTINGS_GUIDE.md#managing-vtu-portal-url)
3. **How is CGPA calculated?** → [SUBJECT_TYPES_GUIDE.md#cgpa-calculation-rules](SUBJECT_TYPES_GUIDE.md#cgpa-calculation-rules)
4. **How to scrape results?** → [API_DOCUMENTATION.md#scraper-endpoints](API_DOCUMENTATION.md#scraper-endpoints)
5. **How to setup the project?** → [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

**📖 Happy Reading! If you can't find what you're looking for, check QUICK_REFERENCE.md or open an issue.**

**Last Updated:** November 2025 (v2.0)
