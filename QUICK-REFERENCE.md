# 🎯 CustomPC.tech - Quick Reference Guide

## 🗑️ Admin Chat Management

### Delete Individual Chats
1. Go to: `admin-chats.html`
2. Hover over any chat in the sidebar
3. Click the **🗑️ Delete** button that appears
4. Confirm deletion
5. Chat and all messages are permanently removed from Firebase

### Features:
- ✅ Delete button appears on hover
- ✅ Confirmation dialog before deletion
- ✅ Removes all messages from Firebase
- ✅ Updates UI immediately
- ✅ Clears chat view if currently selected

---

## 💳 Simple Payment System (NEW!)

### User Side
1. Go to: **add-payment-method.html**
2. Enter card info (number, name, expiry, CVV, ZIP)
3. Click "Save Payment Method"
4. Card info stored in Firebase

### Admin Side
1. Go to: **admin-payments.html**
2. Select user from list
3. Enter charge amount and description
4. Click "Charge User"
5. Transaction recorded!

### Features
- ✅ Users add payment methods
- ✅ Admins charge any amount
- ✅ Transaction history
- ✅ User search
- ✅ Real-time updates

### Security
- Only stores last 4 digits
- CVV never saved
- Encrypted in Firebase
- Admin-only access

---

## 💳 Square Payment System (Advanced)

### Quick Start (Local Testing)
```bash
cd backend
npm install
npm start
```

Then visit: http://localhost:3000/payments.html

### Production Deployment
1. Deploy backend to Heroku/Vercel/Railway
2. Update `config/square-config.js` with your backend URL
3. Test with a small payment ($1.00)
4. Monitor in Square Dashboard

### Your Credentials
- **Application ID**: `sq0idp-nn3XY5fKUDQwQwU8pWqhPw`
- **Location ID**: `LJR87MYZ8ZZC9`
- **Access Token**: In `backend/simple-payment-server.js`

### Test Payment
1. Login as admin
2. Fill customer info
3. Enter amount (e.g., $10.00)
4. Enter card details
5. Click "Process Payment"
6. Check Square Dashboard for transaction

---

## 💬 Messaging System

### User Side (messaging.html)
- Users type messages
- Messages saved to Firebase: `chats/chat_{username}/`
- Real-time sync with admin

### Admin Side (admin-chats.html)
- See all active chats in sidebar
- Click chat to view conversation
- Type response and send
- Delete chats with hover button
- Real-time updates when users message

### Firebase Structure
```
chats/
  chat_username/
    info/
      username: "user123"
      email: "user@example.com"
      lastMessage: "Hello"
      lastMessageTime: 1234567890
      unreadCount: 2
    messages/
      msg1/
        text: "Hello"
        username: "user123"
        type: "user"
        timestamp: 1234567890
      msg2/
        text: "Hi there!"
        username: "Admin"
        type: "admin"
        timestamp: 1234567891
```

---

## 🔐 Admin Access

### Login as Admin
1. Go to: `login.html?admin=true`
2. Use admin credentials
3. Access admin pages:
   - `payments.html` - Payment processing
   - `admin-chats.html` - Chat management
   - `messaging.html` - Admin chat interface

### Admin Pages
- ✅ `payments.html` - Square payment processing
- ✅ `admin-payments.html` - Simple payment system (NEW!)
- ✅ `admin-chats.html` - Manage all chats
- ✅ `messaging.html` - Admin view with sidebar

### User Pages
- ✅ `add-payment-method.html` - Add/update payment info (NEW!)

---

## 🚀 Deployment Checklist

### Frontend (GitHub Pages)
- ✅ Already deployed to: custompc.tech
- ✅ Connected to GoDaddy domain
- ✅ HTTPS enabled

### Backend (Need to Deploy)
- ⏳ Deploy `backend/simple-payment-server.js`
- ⏳ Set environment variables
- ⏳ Update `config/square-config.js` with backend URL

### Firebase
- ✅ Already configured
- ✅ Real-time database active
- ✅ Chat system working

---

## 📁 Important Files

### Configuration
- `config/square-config.js` - Square payment config
- `config/firebase-config.js` - Firebase config
- `backend/.env` - Backend environment variables

### Admin Pages
- `payments.html` - Payment processing interface
- `admin-chats.html` - Chat management dashboard
- `messaging.html` - Messaging interface (admin + user)

### Backend
- `backend/simple-payment-server.js` - Payment server
- `backend/package.json` - Dependencies

### Documentation
- `START-PAYMENTS.md` - Quick payment setup
- `docs/PAYMENT-SETUP-GUIDE.md` - Complete payment guide
- `docs/DEPLOYMENT-CHECKLIST.md` - Deployment guide
- `docs/GODADDY-GITHUB-SETUP.md` - Domain setup

---

## 🆘 Common Tasks

### Start Backend Locally
```bash
cd backend
npm install
npm start
```

### Test Square Connection
Visit: http://localhost:3000/api/test-square

### View All Chats (Admin)
Visit: http://localhost:3000/admin-chats.html

### Process Payment (Admin)
Visit: http://localhost:3000/payments.html

### Delete a Chat (Admin)
1. Go to admin-chats.html
2. Hover over chat
3. Click 🗑️ Delete button

---

## 📊 Monitoring

### Square Dashboard
- URL: https://squareup.com/dashboard
- View all transactions
- Issue refunds
- See customer data

### Firebase Console
- URL: https://console.firebase.google.com
- View chat messages
- Monitor real-time activity
- Check database rules

### Your Admin Panel
- Payments: `/payments.html`
- Chats: `/admin-chats.html`
- Messages: `/messaging.html`

---

## 🎉 What's Working

✅ **Chat System**
- User messaging
- Admin responses
- Real-time updates
- Private chat rooms
- Delete functionality

✅ **Payment System**
- Frontend interface
- Square integration
- Backend server ready
- Production credentials

✅ **Admin System**
- Authentication
- Access control
- Admin dashboard
- User management

---

## 🚧 Next Steps

1. **Deploy Backend**
   - Choose: Heroku, Vercel, or Railway
   - Deploy `backend/simple-payment-server.js`
   - Update frontend config

2. **Test Payments**
   - Process test payment
   - Verify in Square Dashboard
   - Test refund process

3. **Monitor & Maintain**
   - Check Square Dashboard daily
   - Respond to chat messages
   - Process payments as needed

---

**Everything is ready to go! Just deploy the backend and you're live! 🚀**
