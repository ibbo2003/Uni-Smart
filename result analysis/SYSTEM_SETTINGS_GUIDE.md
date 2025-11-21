# System Settings & Dynamic VTU Link Management Guide

## Table of Contents
- [Overview](#overview)
- [The Problem & Solution](#the-problem--solution)
- [SystemSettings Model](#systemsettings-model)
- [Managing VTU Portal URL](#managing-vtu-portal-url)
- [API Reference](#api-reference)
- [Management Commands](#management-commands)
- [Django Admin Interface](#django-admin-interface)
- [Programmatic Access](#programmatic-access)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQs](#faqs)

---

## Overview

The **System Settings** feature provides a database-driven configuration system for managing dynamic values that change periodically, such as the VTU results portal URL.

### Key Features

✅ **Database-Driven**: Settings stored in database, no code changes needed
✅ **Multiple Access Methods**: Admin panel, API, management commands, programmatic
✅ **Audit Trail**: Track who changed what and when
✅ **No Downtime**: Update settings without restarting server
✅ **API-First**: RESTful endpoints for integration
✅ **Admin-Friendly**: Easy management through Django admin

---

## The Problem & Solution

### The Problem

VTU changes their results portal URL every semester:

```
Jan-June 2025:  https://results.vtu.ac.in/JJEcbcs25/index.php
July-Dec 2025:  https://results.vtu.ac.in/JJEcbcs26/index.php
Jan-June 2026:  https://results.vtu.ac.in/JJEcbcs27/index.php
```

**Old Approach Issues:**
- ❌ Hardcoded in source code
- ❌ Requires code changes
- ❌ Needs redeployment
- ❌ Potential downtime
- ❌ Version control overhead

### The Solution

**Dynamic Configuration:**
- ✅ Stored in `system_settings` database table
- ✅ Updated via API, admin panel, or command
- ✅ No code changes required
- ✅ Zero downtime
- ✅ Instant effect on next scraper run

---

## SystemSettings Model

### Database Schema

```python
class SystemSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| **id** | UUID | Primary key |
| **key** | String | Setting identifier (e.g., 'VTU_RESULTS_URL') |
| **value** | Text | Setting value |
| **description** | Text | Human-readable description |
| **updated_at** | DateTime | Last update timestamp |
| **updated_by** | User | Who made the change |

### Current Settings

| Key | Value | Description |
|-----|-------|-------------|
| `VTU_RESULTS_URL` | `https://results.vtu.ac.in/JJEcbcs25/index.php` | Current VTU Results Portal URL |

---

## Managing VTU Portal URL

### Method 1: REST API (Recommended for Automation)

#### Get Current URL

```bash
curl -X GET http://localhost:8000/api/settings/vtu-link/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
  "last_updated": "2025-11-10T00:00:00Z",
  "updated_by": "admin"
}
```

#### Update URL (Admin Only)

```bash
curl -X PUT http://localhost:8000/api/settings/vtu-link/update/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://results.vtu.ac.in/JJEcbcs26/index.php"}'
```

**Response:**
```json
{
  "message": "VTU URL updated successfully",
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php",
  "updated_by": "admin"
}
```

### Method 2: Django Admin Panel (Easiest for Non-Technical Users)

#### Steps:
1. Navigate to `http://localhost:8000/admin/`
2. Login with admin credentials
3. Go to **"Results"** → **"System Settings"**
4. Click on **"VTU_RESULTS_URL"**
5. Update the **"Value"** field
6. Click **"Save"**

#### Screenshot Flow:
```
Admin Home
  └─ Results
      └─ System Settings
          └─ VTU_RESULTS_URL
              ├─ Key: VTU_RESULTS_URL (read-only)
              ├─ Value: [editable text box]
              ├─ Description: Current VTU Results Portal URL...
              ├─ Updated at: 2025-11-10 00:00:00
              └─ Updated by: admin
```

### Method 3: Management Command

```bash
python manage.py shell
```

```python
from results.models import SystemSettings

# Update URL
SystemSettings.set_setting(
    key='VTU_RESULTS_URL',
    value='https://results.vtu.ac.in/JJEcbcs26/index.php',
    description='Current VTU Results Portal URL (updates every semester)'
)

print("✓ VTU URL updated successfully")
```

### Method 4: Direct Database Update (Not Recommended)

```sql
UPDATE system_settings
SET value = 'https://results.vtu.ac.in/JJEcbcs26/index.php',
    updated_at = NOW()
WHERE key = 'VTU_RESULTS_URL';
```

⚠️ **Warning:** Direct database edits bypass audit logging and validation.

---

## API Reference

### 1. Get All Settings

```http
GET /api/settings/
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "key": "VTU_RESULTS_URL",
    "value": "https://results.vtu.ac.in/JJEcbcs25/index.php",
    "description": "Current VTU Results Portal URL (updates every semester)",
    "updated_at": "2025-11-10T00:00:00Z",
    "updated_by": "admin"
  },
  {
    "key": "FUTURE_SETTING",
    "value": "some_value",
    "description": "Description here",
    "updated_at": "2025-11-10T00:00:00Z",
    "updated_by": "admin"
  }
]
```

**Permissions:** Any authenticated user

### 2. Get VTU Link

```http
GET /api/settings/vtu-link/
Authorization: Bearer {token}
```

**Response (Success):**
```json
{
  "url": "https://results.vtu.ac.in/JJEcbcs25/index.php",
  "last_updated": "2025-11-10T00:00:00Z",
  "updated_by": "admin"
}
```

**Response (Not Found):**
```json
{
  "error": "VTU URL not configured"
}
```

**Permissions:** Any authenticated user

### 3. Update VTU Link

```http
PUT /api/settings/vtu-link/update/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php"
}
```

**Response (Success):**
```json
{
  "message": "VTU URL updated successfully",
  "url": "https://results.vtu.ac.in/JJEcbcs26/index.php",
  "updated_by": "admin"
}
```

**Response (Invalid URL):**
```json
{
  "error": "Invalid VTU URL format. Must start with https://results.vtu.ac.in/"
}
```

**Response (Unauthorized):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Permissions:** Admin only

---

## Management Commands

### Initialize Settings

**Command:**
```bash
python manage.py init_settings
```

**Purpose:**
- Creates default VTU_RESULTS_URL setting
- Safe to run multiple times (idempotent)
- Run once after initial deployment

**Output:**
```
Initializing system settings...
System settings initialized successfully
```

**When to Use:**
- Initial project setup
- After fresh database creation
- After migrations
- To restore default settings

### Check Settings

**Command:**
```bash
python manage.py shell -c "from results.models import SystemSettings; print('VTU URL:', SystemSettings.get_setting('VTU_RESULTS_URL'))"
```

**Output:**
```
VTU URL: https://results.vtu.ac.in/JJEcbcs25/index.php
```

---

## Django Admin Interface

### Features

1. **List View**
   - See all settings at a glance
   - Search by key, value, or description
   - Sort by any column
   - Preview values (truncated if long)

2. **Edit Form**
   - Key field (read-only if editing)
   - Value field (large text area)
   - Description field
   - Auto-tracked update time
   - Auto-tracked update user

3. **Audit Trail**
   - See who last updated
   - See when it was updated
   - Full history in change log

### Access Control

- **View:** Staff users (is_staff=True)
- **Edit:** Superusers or admin role
- **Delete:** Superusers only

### Admin Configuration

```python
@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value_preview', 'updated_at', 'updated_by']
    search_fields = ['key', 'value', 'description']
    readonly_fields = ['updated_at', 'updated_by']

    def value_preview(self, obj):
        """Show shortened value"""
        if len(obj.value) > 50:
            return f"{obj.value[:50]}..."
        return obj.value

    def save_model(self, request, obj, form, change):
        """Auto-set updated_by"""
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
```

---

## Programmatic Access

### Reading Settings

#### Method 1: Class Method (Recommended)

```python
from results.models import SystemSettings

# Get setting with default fallback
url = SystemSettings.get_setting(
    'VTU_RESULTS_URL',
    default='https://results.vtu.ac.in/JJEcbcs25/index.php'
)
print(f"Current VTU URL: {url}")
```

#### Method 2: Direct Query

```python
from results.models import SystemSettings

try:
    setting = SystemSettings.objects.get(key='VTU_RESULTS_URL')
    url = setting.value
    print(f"URL: {url}")
    print(f"Last updated: {setting.updated_at}")
    print(f"Updated by: {setting.updated_by}")
except SystemSettings.DoesNotExist:
    print("Setting not found")
    url = 'default-url'
```

### Writing Settings

#### Method 1: Class Method (Recommended)

```python
from results.models import SystemSettings
from results.models import User

admin_user = User.objects.get(username='admin')

# Create or update setting
SystemSettings.set_setting(
    key='VTU_RESULTS_URL',
    value='https://results.vtu.ac.in/JJEcbcs26/index.php',
    description='Current VTU Results Portal URL',
    user=admin_user
)

print("Setting updated successfully")
```

#### Method 2: Update or Create

```python
from results.models import SystemSettings, User

admin_user = User.objects.get(username='admin')

setting, created = SystemSettings.objects.update_or_create(
    key='VTU_RESULTS_URL',
    defaults={
        'value': 'https://results.vtu.ac.in/JJEcbcs26/index.php',
        'description': 'Current VTU Results Portal URL',
        'updated_by': admin_user
    }
)

if created:
    print("Setting created")
else:
    print("Setting updated")
```

### Usage in Scraper

```python
class VTUResultScraper:
    def __init__(self, headless: bool = True):
        from .models import SystemSettings

        # Get VTU URL from database
        self.VTU_RESULTS_URL = SystemSettings.get_setting(
            'VTU_RESULTS_URL',
            default='https://results.vtu.ac.in/JJEcbcs25/index.php'
        )

        logger.info(f"Using VTU URL: {self.VTU_RESULTS_URL}")
```

---

## Best Practices

### 1. Use Meaningful Keys

```python
# Good
'VTU_RESULTS_URL'
'SMTP_SERVER_HOST'
'MAX_UPLOAD_SIZE_MB'

# Bad
'setting1'
'url'
'value'
```

### 2. Always Provide Descriptions

```python
SystemSettings.set_setting(
    key='VTU_RESULTS_URL',
    value='https://results.vtu.ac.in/JJEcbcs25/index.php',
    description='Current VTU Results Portal URL (updates every semester)'  # ✓ Good
)
```

### 3. Use Default Values

```python
# Always provide fallback
url = SystemSettings.get_setting(
    'VTU_RESULTS_URL',
    default='https://results.vtu.ac.in/default.php'  # ✓ Safe
)
```

### 4. Validate Before Saving

```python
def update_vtu_url(new_url: str):
    # Validate format
    if not new_url.startswith('https://results.vtu.ac.in/'):
        raise ValueError('Invalid VTU URL format')

    # Validate accessibility (optional)
    import requests
    try:
        response = requests.head(new_url, timeout=5)
        if response.status_code not in [200, 302]:
            raise ValueError('URL not accessible')
    except:
        raise ValueError('Cannot reach URL')

    # Save if valid
    SystemSettings.set_setting('VTU_RESULTS_URL', new_url)
```

### 5. Document Settings

Create a settings registry:

```python
# settings_registry.py
SYSTEM_SETTINGS = {
    'VTU_RESULTS_URL': {
        'description': 'Current VTU Results Portal URL',
        'type': 'url',
        'default': 'https://results.vtu.ac.in/JJEcbcs25/index.php',
        'validation': lambda v: v.startswith('https://results.vtu.ac.in/'),
        'required': True,
        'editable_by': ['admin']
    },
    # Add more settings here
}
```

### 6. Audit Changes

```python
def update_setting_with_audit(key, value, user):
    old_value = SystemSettings.get_setting(key)

    # Update
    SystemSettings.set_setting(key, value, user=user)

    # Log change
    from results.models import AuditLog
    AuditLog.objects.create(
        user=user,
        action='UPDATE',
        model_name='SystemSettings',
        object_id=key,
        description=f'Changed {key} from "{old_value}" to "{value}"'
    )
```

### 7. Cache Settings (For High Traffic)

```python
from django.core.cache import cache

def get_cached_setting(key, default=None, timeout=3600):
    """Get setting with 1-hour cache"""
    cache_key = f'setting_{key}'

    # Try cache first
    value = cache.get(cache_key)
    if value is not None:
        return value

    # Get from database
    value = SystemSettings.get_setting(key, default)

    # Cache it
    cache.set(cache_key, value, timeout)

    return value
```

---

## Troubleshooting

### Issue 1: Setting Not Found

**Symptom:**
```python
SystemSettings.get_setting('VTU_RESULTS_URL')  # Returns None
```

**Solution:**
```bash
# Run initialization
python manage.py init_settings

# Or create manually
python manage.py shell
from results.models import SystemSettings
SystemSettings.set_setting('VTU_RESULTS_URL', 'your-url')
```

### Issue 2: Scraper Using Old URL

**Symptom:**
Scraper still uses old URL after update

**Cause:**
Scraper instance was created before update

**Solution:**
```python
# Scraper reads URL on initialization
with VTUResultScraper() as scraper:
    # This reads the latest URL from database
    scraper.scrape_result('USN123')
```

### Issue 3: Permission Denied on Update

**Symptom:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Solution:**
Ensure user has admin role:
```python
user = User.objects.get(username='youruser')
user.role = 'ADMIN'
user.is_staff = True
user.is_superuser = True
user.save()
```

### Issue 4: Invalid URL Format

**Symptom:**
```json
{
  "error": "Invalid VTU URL format. Must start with https://results.vtu.ac.in/"
}
```

**Solution:**
Ensure URL format is correct:
```
✓ https://results.vtu.ac.in/JJEcbcs26/index.php
✗ http://results.vtu.ac.in/...  (http not https)
✗ https://vtu.ac.in/...  (wrong domain)
```

### Issue 5: Setting Notpersisting

**Symptom:**
Setting reverts after save

**Cause:**
Database transaction not committed or init command running repeatedly

**Solution:**
```python
from django.db import transaction

with transaction.atomic():
    SystemSettings.set_setting('KEY', 'value')
    # Committed automatically
```

---

## FAQs

### Q1: How often should I update the VTU URL?

**A:** Every semester when VTU releases new results. Typically twice a year (Jan and July).

### Q2: Can I add custom settings?

**A:** Yes! Use the same model:

```python
SystemSettings.set_setting(
    key='MY_CUSTOM_SETTING',
    value='my_value',
    description='Description of my setting'
)

# Later retrieve it
value = SystemSettings.get_setting('MY_CUSTOM_SETTING')
```

### Q3: Are settings cached?

**A:** By default, no. Each access reads from database. Implement caching if needed (see Best Practices #7).

### Q4: Can students see settings?

**A:** Yes, they can READ settings via GET endpoints. Only admins can UPDATE.

### Q5: What if I delete a setting accidentally?

**A:** Restore from backup or recreate:

```bash
python manage.py init_settings  # Restores VTU_RESULTS_URL
```

For other settings, check Django admin change history.

### Q6: Can I bulk import settings?

**A:** Yes, create a management command:

```python
# management/commands/import_settings.py
import json
from django.core.management.base import BaseCommand
from results.models import SystemSettings

class Command(BaseCommand):
    def handle(self, *args, **options):
        with open('settings.json') as f:
            settings = json.load(f)

        for key, data in settings.items():
            SystemSettings.set_setting(
                key=key,
                value=data['value'],
                description=data.get('description', '')
            )
```

### Q7: How to backup settings?

**Export to JSON:**
```bash
python manage.py dumpdata results.SystemSettings --indent 2 > settings_backup.json
```

**Import from JSON:**
```bash
python manage.py loaddata settings_backup.json
```

### Q8: Can I use environment variables instead?

**A:** Yes, for sensitive data like API keys:

```python
import os

# Environment variable with database fallback
api_key = os.getenv('VTU_API_KEY') or SystemSettings.get_setting('VTU_API_KEY')
```

### Q9: How to notify admins of URL changes?

**A:** Implement signal:

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=SystemSettings)
def notify_setting_change(sender, instance, created, **kwargs):
    if instance.key == 'VTU_RESULTS_URL' and not created:
        # Send notification
        print(f"VTU URL changed to: {instance.value}")
        # Or send email, Slack message, etc.
```

### Q10: Performance impact of database settings?

**A:** Minimal for infrequent reads. For high-traffic scenarios:
- Implement caching (Redis/Memcached)
- Use signals to invalidate cache on update
- Consider read replicas for scaling

---

## Real-World Scenarios

### Scenario 1: New Semester, New URL

**Situation:** VTU updates portal from JJEcbcs25 to JJEcbcs26

**Steps:**
1. Receive notification about new URL
2. Verify URL is accessible
3. Update via admin panel or API
4. Test scraping with one USN
5. If successful, proceed with batch scraping

**Time:** < 2 minutes, zero downtime

### Scenario 2: Automated Monitoring

**Situation:** Auto-detect and update URL changes

**Implementation:**
```python
import requests
from results.models import SystemSettings

def check_vtu_url_validity():
    current_url = SystemSettings.get_setting('VTU_RESULTS_URL')

    try:
        response = requests.get(current_url, timeout=10)
        if response.status_code != 200:
            # Alert admin
            send_alert(f"VTU URL {current_url} is down!")
    except:
        send_alert(f"Cannot reach {current_url}")

# Run via cron or Celery beat every hour
```

### Scenario 3: Multi-University Support

**Situation:** Extend system to support multiple universities

**Implementation:**
```python
# Add settings for each university
SystemSettings.set_setting('KU_RESULTS_URL', 'https://ku.ac.in/results/')
SystemSettings.set_setting('JNTU_RESULTS_URL', 'https://jntu.ac.in/results/')

# Scraper accepts university parameter
class UniversityResultScraper:
    def __init__(self, university='VTU'):
        self.url = SystemSettings.get_setting(f'{university}_RESULTS_URL')
```

---

## Migration Guide

### From Hardcoded to Dynamic

**Old Code:**
```python
class VTUResultScraper:
    VTU_URL = "https://results.vtu.ac.in/JJEcbcs25/index.php"
```

**New Code:**
```python
class VTUResultScraper:
    def __init__(self):
        from .models import SystemSettings
        self.VTU_URL = SystemSettings.get_setting(
            'VTU_RESULTS_URL',
            default='https://results.vtu.ac.in/JJEcbcs25/index.php'
        )
```

**Migration Steps:**
1. Run migration: `python manage.py migrate`
2. Initialize settings: `python manage.py init_settings`
3. Update scraper code
4. Test with one USN
5. Deploy

---

## Summary

✅ **Database-driven** configuration
✅ **Multiple access methods** (API, Admin, CLI)
✅ **Zero downtime** updates
✅ **Audit trail** for changes
✅ **Extensible** for future settings
✅ **Production-ready** with fallbacks

**Key Benefit:** Update VTU portal URL in < 1 minute without code changes or deployment! 🚀
