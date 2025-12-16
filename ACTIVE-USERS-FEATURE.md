# Active Users & Chat Notifications Feature

## Overview
This feature adds three key capabilities to your website:

1. **See Active Users** - View all people currently on your website
2. **Initiate Chats** - Start conversations with active users directly from the admin panel
3. **Message Notifications** - Red notification bubbles appear on the Messages tab when new messages arrive

## How It Works

### For Visitors
- When a visitor lands on your website, they're automatically registered as an active user
- Their presence is tracked in real-time (updates every 30 seconds)
- They're automatically removed from the active list after 5 minutes of inactivity

### For Admins
- A floating panel appears in the bottom-left corner showing all active users
- The panel displays:
  - Total count of active users
  - Filter options (All, Visitors, Admins)
  - User list with status indicators
  - "Chat" button to initiate conversations
- Click the "Chat" button to start a conversation with any active user
- The admin is taken to the admin-chats.html page with the new chat open

### Message Notifications
- A red notification badge appears on the "Messaging" link in the navbar
- The badge shows the count of unread messages
- The badge pulses to draw attention
- Clicking the messaging link takes you to the conversation
- Browser notifications are also sent (if permission is granted)

## Files Added

### Frontend Scripts
1. **frontend/active-users.js** - Manages user presence tracking
   - Registers users as active
   - Updates presence periodically
   - Listens for active user changes
   - Cleans up on page unload

2. **frontend/admin-users-panel.js** - Admin panel for viewing active users
   - Creates floating panel UI
   - Displays active users with filters
   - Handles chat initiation
   - Only shows for logged-in admins

3. **frontend/message-notifications.js** - Notification badge system
   - Creates notification badges on messaging links
   - Tracks unread message counts
   - Shows browser notifications
   - Updates in real-time

### Firebase Updates
- **config/firebase-config.js** - Extended with new methods:
  - `registerActiveUser()` - Register user as active
  - `updateUserPresence()` - Update user's last seen time
  - `removeActiveUser()` - Remove user from active list
  - `listenForActiveUsers()` - Listen for active user changes
  - `createAdminChat()` - Create admin-initiated chats
  - `listenForUserMessages()` - Listen for new messages

## Database Structure

### Firebase Realtime Database
```
activeUsers/
  {sessionId}/
    username: string
    isAdmin: boolean
    page: string
    timestamp: number
    lastSeen: number

adminChats/
  {chatId}/
    participantUsername: string
    participantSessionId: string
    initiatedBy: string
    initiatedAt: number
    status: string
    messages: {}
```

### LocalStorage Fallback
- `custompc_active_users` - Active users list
- `custompc_admin_chats` - Admin-initiated chats

## Usage

### For Visitors
No action needed - they're automatically tracked when they visit your site.

### For Admins
1. Log in to your admin account
2. Navigate to any page (the active users panel appears automatically)
3. See the floating panel in the bottom-left corner
4. Click "Chat" on any user to start a conversation
5. You'll be taken to admin-chats.html with the new chat open

### For Message Notifications
1. The notification badge appears automatically on the Messaging link
2. It shows the count of unread messages
3. Click the Messaging link to view and respond to messages
4. The badge updates in real-time

## Customization

### Change Panel Position
Edit `frontend/admin-users-panel.js` and modify the CSS:
```javascript
.admin-users-panel {
  bottom: 20px;  // Change vertical position
  left: 20px;    // Change horizontal position
}
```

### Change Notification Badge Color
Edit `frontend/message-notifications.js`:
```javascript
background: #ff4444;  // Change to your color
```

### Change Update Intervals
Edit `frontend/active-users.js`:
```javascript
this.updateInterval = setInterval(() => {
  this.updateUserPresence();
}, 30000);  // Change from 30 seconds to desired interval
```

## Browser Compatibility
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses Firebase Realtime Database (with localStorage fallback)
- Responsive design works on mobile and desktop

## Performance Notes
- Active users are cleaned up automatically after 5 minutes of inactivity
- Presence updates happen every 30 seconds (configurable)
- Message listeners use Firebase's efficient real-time updates
- Falls back to localStorage polling if Firebase is unavailable

## Troubleshooting

### Active Users Panel Not Showing
- Make sure you're logged in as an admin
- Check browser console for errors
- Verify Firebase is initialized

### Notifications Not Appearing
- Check if you've granted notification permission
- Verify the messaging link has `href*="messaging"` attribute
- Check browser console for errors

### Chat Not Starting
- Ensure Firebase Realtime Database is enabled
- Check that the user is still active (not timed out)
- Verify admin has proper permissions

## Future Enhancements
- Add typing indicators
- Show user location/page they're on
- Add user search functionality
- Implement chat history for admin-initiated chats
- Add sound notifications for new messages
- Show user device/browser information
