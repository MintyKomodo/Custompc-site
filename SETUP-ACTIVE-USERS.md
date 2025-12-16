# Setup Guide: Active Users & Chat Notifications

## Quick Start

The feature is already integrated into your website. Here's what happens automatically:

### 1. Active Users Tracking
- Every visitor is automatically registered as an active user
- Their presence is tracked in real-time
- They're removed after 5 minutes of inactivity

### 2. Admin Panel
- When you log in as an admin, a floating panel appears in the bottom-left corner
- Shows all active users on your website
- You can filter by "All", "Visitors", or "Admins"
- Click "Chat" to start a conversation with any user

### 3. Message Notifications
- A red badge appears on the "Messaging" link in your navbar
- Shows the count of unread messages
- The badge pulses to grab attention
- Updates in real-time as new messages arrive

## Files Included

```
frontend/
  ├── active-users.js              # User presence tracking
  ├── admin-users-panel.js         # Admin panel UI
  └── message-notifications.js     # Notification badges

config/
  └── firebase-config.js           # Updated with new methods

messaging.html                      # Updated with new scripts
admin-chats.html                   # Updated with new scripts
```

## What You Need to Do

### 1. Verify Firebase is Enabled
Make sure your Firebase Realtime Database is enabled:
- Go to Firebase Console
- Select your project (custompc-website)
- Go to Realtime Database
- Ensure it's enabled and accessible

### 2. Check Database Rules
Your Firebase rules should allow read/write access. Example:
```json
{
  "rules": {
    "activeUsers": {
      ".read": true,
      ".write": true
    },
    "adminChats": {
      ".read": true,
      ".write": true
    },
    "chats": {
      ".read": true,
      ".write": true
    },
    "userChats": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3. Test the Feature

#### Test Active Users:
1. Open your website in one browser tab
2. Log in as admin in another tab
3. Go to admin-chats.html
4. You should see a floating panel in the bottom-left with active users
5. The count should show at least 1 user

#### Test Chat Initiation:
1. With the admin panel visible, click "Chat" on any user
2. You should be taken to admin-chats.html with a new chat open
3. Type a message and send it

#### Test Notifications:
1. Go to messaging.html
2. Have someone send you a message
3. A red badge should appear on the "Messaging" link in the navbar
4. The badge should show the count of unread messages

## Customization Options

### Change Panel Position
Edit `frontend/admin-users-panel.js`, find `.admin-users-panel` CSS:
```css
.admin-users-panel {
  bottom: 20px;  /* Move up/down */
  left: 20px;    /* Move left/right */
}
```

### Change Notification Badge Color
Edit `frontend/message-notifications.js`, find the badge style:
```javascript
background: #ff4444;  /* Change color */
```

### Change Update Frequency
Edit `frontend/active-users.js`, find the update interval:
```javascript
this.updateInterval = setInterval(() => {
  this.updateUserPresence();
}, 30000);  /* Change 30000 to desired milliseconds */
```

### Change Inactivity Timeout
Edit `frontend/admin-users-panel.js`, find the filter logic:
```javascript
const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);  /* Change 5 to desired minutes */
```

## Troubleshooting

### Panel Not Showing
**Problem:** The active users panel doesn't appear
**Solution:**
1. Make sure you're logged in as an admin
2. Check browser console (F12) for errors
3. Verify Firebase is initialized
4. Try refreshing the page

### No Users Showing
**Problem:** Panel shows "No active users" even though people are on the site
**Solution:**
1. Check if Firebase Realtime Database is enabled
2. Verify database rules allow read/write
3. Check browser console for Firebase errors
4. Try opening the site in an incognito window

### Notifications Not Appearing
**Problem:** Red badge doesn't show on messaging link
**Solution:**
1. Check if you've granted notification permission
2. Verify the messaging link has correct href
3. Check browser console for errors
4. Try refreshing the page

### Chat Won't Start
**Problem:** Clicking "Chat" doesn't open a new chat
**Solution:**
1. Verify the user is still active (not timed out)
2. Check Firebase console for errors
3. Ensure admin has proper permissions
4. Try refreshing and trying again

## Performance Tips

1. **Reduce Update Frequency** - If you have many users, increase the update interval
2. **Clean Old Data** - Periodically delete old inactive user records from Firebase
3. **Optimize Listeners** - Only listen for active users on admin pages
4. **Use Indexes** - Add Firebase indexes for better query performance

## Security Notes

1. **Admin Only** - The panel only shows for logged-in admins
2. **User Privacy** - Only basic info is tracked (username, page, status)
3. **Session IDs** - Each user gets a unique session ID
4. **Auto Cleanup** - Inactive users are automatically removed

## Next Steps

1. Test the feature with real users
2. Monitor Firebase usage and costs
3. Adjust update intervals based on performance
4. Customize colors and styling to match your brand
5. Add additional features as needed

## Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Review Firebase console for database errors
3. Verify all scripts are loaded correctly
4. Check that Firebase is properly initialized
5. Review the ACTIVE-USERS-FEATURE.md for detailed documentation

## Rollback

If you need to disable this feature:
1. Remove the script tags from messaging.html and admin-chats.html
2. Delete the three new JavaScript files
3. The feature will be completely disabled
4. No data will be affected
