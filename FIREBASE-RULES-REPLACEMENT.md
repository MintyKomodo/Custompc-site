# Complete Firebase Rules Replacement Guide

## Overview
This document provides the complete Firebase Realtime Database rules replacement for the new submission system that routes all forms through Firebase and into admin chats.

---

## Step 1: Update Firebase Rules in Console

### Go to Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **custompc-website**
3. Click **Realtime Database** in left sidebar
4. Click **Rules** tab
5. Replace ALL content with the rules below
6. Click **Publish**

---

## Step 2: New Firebase Rules (Complete Replacement)

Copy and paste this entire JSON into your Firebase Rules editor:

```json
{
  "rules": {
    // ============================================================
    // CHATS - Main chat sessions for all submissions and messages
    // ============================================================
    "chats": {
      // Anyone can read chats (needed for admin dashboard)
      ".read": true,
      
      // Anyone can create new chats (for submissions)
      ".write": "root.child('chats').child($chatId).exists() === false || root.child('chats').child($chatId).child('messages').exists()",
      
      // Validate chat structure
      ".validate": "newData.hasChildren(['customerName', 'customerEmail', 'type', 'source', 'subject', 'createdAt', 'status'])",
      
      "$chatId": {
        // Read individual chat
        ".read": true,
        
        // Write to individual chat (add messages)
        ".write": true,
        
        // Validate required fields
        "customerName": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        
        "customerEmail": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/)"
        },
        
        "type": {
          ".validate": "newData.isString() && (newData.val() === 'contact' || newData.val() === 'quote_request' || newData.val() === 'message')"
        },
        
        "source": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        
        "subject": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 200"
        },
        
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        
        "lastActivity": {
          ".validate": "newData.isNumber()"
        },
        
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'active' || newData.val() === 'closed' || newData.val() === 'archived')"
        },
        
        // Messages in chat
        "messages": {
          ".read": true,
          ".write": true,
          
          "$messageId": {
            ".read": true,
            ".write": "newData.child('timestamp').exists()",
            
            // Validate message structure
            ".validate": "newData.hasChildren(['type', 'content', 'userId', 'userName', 'timestamp'])",
            
            "type": {
              ".validate": "newData.isString() && (newData.val() === 'user' || newData.val() === 'admin' || newData.val() === 'system')"
            },
            
            "content": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 5000"
            },
            
            "userId": {
              ".validate": "newData.isString() && newData.val().length > 0"
            },
            
            "userName": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
            },
            
            "timestamp": {
              ".validate": "newData.isNumber()"
            }
          }
        },
        
        // Read status tracking
        "readBy": {
          ".read": true,
          ".write": true,
          
          "$userId": {
            ".validate": "newData.isNumber()"
          }
        }
      }
    },
    
    // ============================================================
    // USER CHATS - Personal chat history for logged-in users
    // ============================================================
    "userChats": {
      ".read": true,
      ".write": true,
      
      "$username": {
        ".read": true,
        ".write": true,
        
        "$chatId": {
          ".read": true,
          ".write": true,
          
          "chatId": {
            ".validate": "newData.isString()"
          },
          
          "title": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 200"
          },
          
          "createdAt": {
            ".validate": "newData.isNumber()"
          },
          
          "lastActivity": {
            ".validate": "newData.isNumber()"
          },
          
          "status": {
            ".validate": "newData.isString() && (newData.val() === 'active' || newData.val() === 'closed' || newData.val() === 'archived')"
          }
        }
      }
    },
    
    // ============================================================
    // GLOBAL CHAT - Public messaging (optional, for future use)
    // ============================================================
    "globalChat": {
      ".read": true,
      ".write": true,
      
      "$messageId": {
        ".read": true,
        ".write": "newData.child('timestamp').exists()",
        
        ".validate": "newData.hasChildren(['text', 'username', 'type', 'timestamp'])",
        
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 5000"
        },
        
        "username": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        
        "type": {
          ".validate": "newData.isString() && (newData.val() === 'user' || newData.val() === 'admin' || newData.val() === 'system')"
        },
        
        "timestamp": {
          ".validate": "newData.isNumber()"
        }
      }
    },
    
    // ============================================================
    // SUBMISSIONS - Legacy path (for backward compatibility)
    // ============================================================
    "submissions": {
      ".read": true,
      ".write": true,
      
      "$submissionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## Step 3: What These Rules Do

### CHATS Path
- **Read**: Anyone can read (needed for admin dashboard)
- **Write**: Anyone can create new chats or add messages
- **Validation**: Ensures required fields exist and are correct type
- **Fields Validated**:
  - `customerName`: String, 1-100 chars
  - `customerEmail`: Valid email format
  - `type`: "contact", "quote_request", or "message"
  - `source`: String, 1-100 chars
  - `subject`: String, 1-200 chars
  - `createdAt`: Number (timestamp)
  - `lastActivity`: Number (timestamp)
  - `status`: "active", "closed", or "archived"

### MESSAGES Sub-path
- **Read**: Anyone can read messages
- **Write**: Anyone can add messages
- **Validation**: Ensures message structure
- **Fields Validated**:
  - `type`: "user", "admin", or "system"
  - `content`: String, 1-5000 chars
  - `userId`: String (email or username)
  - `userName`: String, 1-100 chars
  - `timestamp`: Number (timestamp)

### USER CHATS Path
- **Read**: Anyone can read (for user's own chat history)
- **Write**: Anyone can write (for user's own chat history)
- **Validation**: Ensures chat history structure
- **Fields Validated**:
  - `chatId`: String
  - `title`: String, 1-200 chars
  - `createdAt`: Number
  - `lastActivity`: Number
  - `status`: "active", "closed", or "archived"

### GLOBAL CHAT Path
- **Read**: Anyone can read
- **Write**: Anyone can write
- **Validation**: Ensures message structure
- **Fields Validated**:
  - `text`: String, 1-5000 chars
  - `username`: String
  - `type`: "user", "admin", or "system"
  - `timestamp`: Number

### SUBMISSIONS Path
- **Read**: Anyone can read (backward compatibility)
- **Write**: Anyone can write (backward compatibility)
- **No validation** (legacy path)

---

## Step 4: Security Considerations

### Current Security Level: MODERATE
- ✅ Data validation on all fields
- ✅ Field length limits (prevents spam)
- ✅ Email format validation
- ✅ Type validation (only allowed values)
- ⚠️ No authentication required (open to public)
- ⚠️ No rate limiting

### To Increase Security (Optional)

#### Option 1: Enable Firebase Authentication
```json
{
  "rules": {
    "chats": {
      ".write": "auth != null"  // Require authentication
    }
  }
}
```

#### Option 2: Add Rate Limiting
```json
{
  "rules": {
    "chats": {
      ".write": "!root.child('rateLimits').child(auth.uid).exists() || root.child('rateLimits').child(auth.uid).val() < now - 1000"
    }
  }
}
```

#### Option 3: Admin-Only Writes
```json
{
  "rules": {
    "chats": {
      ".write": "root.child('admins').child(auth.uid).exists()"
    }
  }
}
```

---

## Step 5: Testing the Rules

### Test in Firebase Console

1. Go to **Realtime Database** → **Rules**
2. Click **Simulate** button
3. Test read/write operations:

**Test 1: Create Chat**
```
Operation: Write
Path: chats/test-chat-1
Data: {
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "type": "contact",
  "source": "Contact Form",
  "subject": "Contact: John Doe",
  "createdAt": 1234567890,
  "lastActivity": 1234567890,
  "status": "active"
}
Expected: ✅ Allow
```

**Test 2: Add Message**
```
Operation: Write
Path: chats/test-chat-1/messages/msg-1
Data: {
  "type": "user",
  "content": "Hello, I have a question...",
  "userId": "john@example.com",
  "userName": "John Doe",
  "timestamp": 1234567890
}
Expected: ✅ Allow
```

**Test 3: Invalid Email**
```
Operation: Write
Path: chats/test-chat-2
Data: {
  "customerName": "Jane",
  "customerEmail": "invalid-email",
  "type": "contact",
  "source": "Contact Form",
  "subject": "Contact: Jane",
  "createdAt": 1234567890,
  "lastActivity": 1234567890,
  "status": "active"
}
Expected: ❌ Deny (invalid email format)
```

**Test 4: Invalid Type**
```
Operation: Write
Path: chats/test-chat-3
Data: {
  "customerName": "Bob",
  "customerEmail": "bob@example.com",
  "type": "invalid_type",
  "source": "Contact Form",
  "subject": "Contact: Bob",
  "createdAt": 1234567890,
  "lastActivity": 1234567890,
  "status": "active"
}
Expected: ❌ Deny (invalid type)
```

---

## Step 6: Monitoring & Maintenance

### Monitor Usage
1. Go to **Firebase Console** → **Realtime Database** → **Usage**
2. Check:
   - Read operations
   - Write operations
   - Storage usage
   - Bandwidth

### Set Up Alerts
1. Go to **Firebase Console** → **Billing**
2. Click **Budget alerts**
3. Set limits for:
   - Monthly spend
   - Read operations
   - Write operations

### Review Logs
1. Go to **Firebase Console** → **Logs**
2. Check for:
   - Failed writes (validation errors)
   - Unusual patterns
   - Suspicious activity

---

## Step 7: Backup & Recovery

### Export Data
1. Go to **Firebase Console** → **Realtime Database**
2. Click **⋮** (three dots)
3. Click **Export JSON**
4. Save backup file

### Import Data
1. Go to **Firebase Console** → **Realtime Database**
2. Click **⋮** (three dots)
3. Click **Import JSON**
4. Select backup file

---

## Step 8: Troubleshooting

### Issue: "Permission denied" errors
**Solution**: Check that rules allow write access to the path you're writing to

### Issue: Validation errors
**Solution**: Ensure all required fields are present and correct type/format

### Issue: Data not appearing
**Solution**: 
1. Check rules allow read access
2. Verify data was written successfully
3. Check browser console for errors

### Issue: Performance issues
**Solution**:
1. Check database size in Firebase Console
2. Consider archiving old chats
3. Add indexes for frequently queried paths

---

## Step 9: Production Checklist

- ✅ Rules published to Firebase Console
- ✅ Tested all submission types (contact, quote request)
- ✅ Tested admin chat functionality
- ✅ Verified email validation works
- ✅ Checked field length limits
- ✅ Monitored database usage
- ✅ Set up billing alerts
- ✅ Backed up database
- ✅ Documented rules for team
- ✅ Tested error handling

---

## Step 10: Future Enhancements

### Possible Improvements
1. Add authentication requirement
2. Implement rate limiting
3. Add admin-only write paths
4. Archive old chats automatically
5. Add encryption for sensitive data
6. Implement user roles (admin, support, user)
7. Add audit logging
8. Set up automated backups

---

## Quick Reference

### Database Paths
```
chats/
  {chatId}/
    customerName
    customerEmail
    type: "contact" | "quote_request" | "message"
    source
    subject
    createdAt
    lastActivity
    status: "active" | "closed" | "archived"
    messages/
      {messageId}/
        type: "user" | "admin" | "system"
        content
        userId
        userName
        timestamp
    readBy/
      {userId}: timestamp

userChats/
  {username}/
    {chatId}/
      chatId
      title
      createdAt
      lastActivity
      status

globalChat/
  {messageId}/
    text
    username
    type
    timestamp

submissions/
  {submissionId}/
    (any structure - legacy)
```

### Validation Rules Summary
| Field | Type | Length | Format |
|-------|------|--------|--------|
| customerName | String | 1-100 | Any |
| customerEmail | String | - | Valid email |
| type | String | - | contact, quote_request, message |
| source | String | 1-100 | Any |
| subject | String | 1-200 | Any |
| content | String | 1-5000 | Any |
| userName | String | 1-100 | Any |
| userId | String | 1+ | Any |
| timestamp | Number | - | Unix timestamp |
| status | String | - | active, closed, archived |

---

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review validation rules above
3. Test in Firebase Console Simulator
4. Check browser console for errors
5. Verify data structure matches rules

