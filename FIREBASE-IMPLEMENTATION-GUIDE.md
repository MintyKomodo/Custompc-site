# Firebase Rules Implementation Guide

## Quick Start (5 Minutes)

### Step 1: Copy the Rules
The new Firebase rules are in: `firebase-database.rules.json`

### Step 2: Apply to Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **custompc-website** project
3. Click **Realtime Database** → **Rules** tab
4. Copy entire content from `firebase-database.rules.json`
5. Paste into Firebase Rules editor
6. Click **Publish**

### Step 3: Test
1. Go to `/contact.html`
2. Fill form and submit
3. Check admin panel at `/admin-chats.html`
4. Submission should appear as new chat

---

## What's New in These Rules

### ✅ Data Validation
- Email format validation
- Field length limits (prevents spam)
- Type validation (only allowed values)
- Required fields enforcement

### ✅ Security Improvements
- Validates all incoming data
- Prevents malformed submissions
- Limits message size (5000 chars max)
- Validates timestamps

### ✅ Structure Enforcement
- Ensures chats have required fields
- Ensures messages have required fields
- Validates status values
- Validates submission types

---

## Database Structure

### CHATS (Main submissions)
```
chats/
  {chatId}/
    customerName: "John Doe"
    customerEmail: "john@example.com"
    type: "contact" | "quote_request"
    source: "Contact Form" | "Quote Request Form"
    subject: "Contact: John Doe"
    createdAt: 1234567890
    lastActivity: 1234567890
    status: "active" | "closed" | "archived"
    messages/
      {messageId}/
        type: "user" | "admin" | "system"
        content: "Message text..."
        userId: "john@example.com"
        userName: "John Doe"
        timestamp: 1234567890
    readBy/
      {userId}: 1234567890
```

### USER CHATS (Personal history)
```
userChats/
  {username}/
    {chatId}/
      chatId: "auto-generated"
      title: "Contact: John Doe"
      createdAt: 1234567890
      lastActivity: 1234567890
      status: "active"
```

### GLOBAL CHAT (Public messaging)
```
globalChat/
  {messageId}/
    text: "Message text..."
    username: "john"
    type: "user" | "admin" | "system"
    timestamp: 1234567890
```

---

## Validation Rules

### Chat Creation
| Field | Type | Length | Validation |
|-------|------|--------|-----------|
| customerName | String | 1-100 | Required |
| customerEmail | String | - | Valid email format |
| type | String | - | "contact", "quote_request", or "message" |
| source | String | 1-100 | Required |
| subject | String | 1-200 | Required |
| createdAt | Number | - | Unix timestamp |
| lastActivity | Number | - | Unix timestamp |
| status | String | - | "active", "closed", or "archived" |

### Message Creation
| Field | Type | Length | Validation |
|-------|------|--------|-----------|
| type | String | - | "user", "admin", or "system" |
| content | String | 1-5000 | Required, max 5000 chars |
| userId | String | 1+ | Required |
| userName | String | 1-100 | Required |
| timestamp | Number | - | Unix timestamp |

### User Chat Entry
| Field | Type | Length | Validation |
|-------|------|--------|-----------|
| chatId | String | - | Required |
| title | String | 1-200 | Required |
| createdAt | Number | - | Unix timestamp |
| lastActivity | Number | - | Unix timestamp |
| status | String | - | "active", "closed", or "archived" |

---

## Testing in Firebase Console

### Test 1: Valid Contact Submission
```
Path: chats/test-contact-1
Operation: Write
Data:
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "type": "contact",
  "source": "Contact Form",
  "subject": "Contact: John Doe",
  "createdAt": 1702000000000,
  "lastActivity": 1702000000000,
  "status": "active"
}
Expected: ✅ ALLOW
```

### Test 2: Valid Message
```
Path: chats/test-contact-1/messages/msg-1
Operation: Write
Data:
{
  "type": "user",
  "content": "I have a question about custom PCs",
  "userId": "john@example.com",
  "userName": "John Doe",
  "timestamp": 1702000000000
}
Expected: ✅ ALLOW
```

### Test 3: Invalid Email (Should Fail)
```
Path: chats/test-invalid-1
Operation: Write
Data:
{
  "customerName": "Jane",
  "customerEmail": "not-an-email",
  "type": "contact",
  "source": "Contact Form",
  "subject": "Contact: Jane",
  "createdAt": 1702000000000,
  "lastActivity": 1702000000000,
  "status": "active"
}
Expected: ❌ DENY (invalid email format)
```

### Test 4: Invalid Type (Should Fail)
```
Path: chats/test-invalid-2
Operation: Write
Data:
{
  "customerName": "Bob",
  "customerEmail": "bob@example.com",
  "type": "invalid_type",
  "source": "Contact Form",
  "subject": "Contact: Bob",
  "createdAt": 1702000000000,
  "lastActivity": 1702000000000,
  "status": "active"
}
Expected: ❌ DENY (invalid type)
```

### Test 5: Message Too Long (Should Fail)
```
Path: chats/test-contact-1/messages/msg-2
Operation: Write
Data:
{
  "type": "user",
  "content": "[5001 character string]",
  "userId": "john@example.com",
  "userName": "John Doe",
  "timestamp": 1702000000000
}
Expected: ❌ DENY (content exceeds 5000 chars)
```

### Test 6: Missing Required Field (Should Fail)
```
Path: chats/test-invalid-3
Operation: Write
Data:
{
  "customerName": "Alice",
  "customerEmail": "alice@example.com",
  "type": "contact",
  "source": "Contact Form",
  "subject": "Contact: Alice"
  // Missing: createdAt, lastActivity, status
}
Expected: ❌ DENY (missing required fields)
```

---

## How to Run Tests

1. Go to Firebase Console
2. Select **Realtime Database**
3. Click **Rules** tab
4. Click **Simulate** button
5. For each test:
   - Select **Write** operation
   - Enter path
   - Paste data
   - Click **Run**
   - Verify result

---

## Troubleshooting

### Issue: "Permission denied" on write
**Cause**: Rules don't allow write to that path
**Solution**: Check path matches rule structure

### Issue: "Validation failed"
**Cause**: Data doesn't match validation rules
**Solution**: Check field types and formats

### Issue: "Missing required fields"
**Cause**: Chat missing required fields
**Solution**: Ensure all required fields present

### Issue: "Invalid email format"
**Cause**: Email doesn't match regex pattern
**Solution**: Use valid email format (user@domain.com)

### Issue: "Content exceeds maximum length"
**Cause**: Message longer than 5000 characters
**Solution**: Shorten message or split into multiple messages

---

## Security Levels

### Current: MODERATE
- ✅ Data validation
- ✅ Field length limits
- ✅ Email validation
- ✅ Type validation
- ⚠️ No authentication required
- ⚠️ No rate limiting

### To Increase to HIGH
Add authentication requirement:
```json
{
  "rules": {
    "chats": {
      ".write": "auth != null"
    }
  }
}
```

### To Increase to VERY HIGH
Add authentication + rate limiting:
```json
{
  "rules": {
    "chats": {
      ".write": "auth != null && !root.child('rateLimits').child(auth.uid).exists() || root.child('rateLimits').child(auth.uid).val() < now - 1000"
    }
  }
}
```

---

## Monitoring

### Check Database Usage
1. Go to Firebase Console
2. Click **Realtime Database**
3. Click **Usage** tab
4. Monitor:
   - Read operations
   - Write operations
   - Storage used
   - Bandwidth

### Set Up Alerts
1. Go to **Billing**
2. Click **Budget alerts**
3. Set limits for monthly spend

### Review Logs
1. Go to **Logs**
2. Check for:
   - Failed writes
   - Unusual patterns
   - Suspicious activity

---

## Backup & Recovery

### Backup Data
1. Go to **Realtime Database**
2. Click **⋮** (three dots)
3. Click **Export JSON**
4. Save file

### Restore Data
1. Go to **Realtime Database**
2. Click **⋮** (three dots)
3. Click **Import JSON**
4. Select backup file

---

## Production Checklist

- [ ] Rules published to Firebase Console
- [ ] Tested contact form submission
- [ ] Tested quote request submission
- [ ] Tested admin chat functionality
- [ ] Verified email validation works
- [ ] Checked field length limits
- [ ] Monitored database usage
- [ ] Set up billing alerts
- [ ] Backed up database
- [ ] Documented for team
- [ ] Tested error handling
- [ ] Verified data structure

---

## Files Reference

- **Rules File**: `firebase-database.rules.json`
- **Documentation**: `FIREBASE-RULES-REPLACEMENT.md`
- **Submission Handler**: `frontend/submission-handler.js`
- **Contact Form**: `contact.html`
- **Quote Form**: `index.html`
- **Admin Panel**: `admin-chats.html`

---

## Next Steps

1. ✅ Copy rules from `firebase-database.rules.json`
2. ✅ Paste into Firebase Console Rules editor
3. ✅ Click Publish
4. ✅ Test all submission types
5. ✅ Monitor database usage
6. ✅ Set up alerts
7. ✅ Document for team

---

## Support

For issues:
1. Check Firebase Console logs
2. Review validation rules above
3. Test in Firebase Console Simulator
4. Check browser console for errors
5. Verify data structure matches rules

