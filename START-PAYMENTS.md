# 🚀 Quick Start - Get Payments Working NOW!

## ⚡ 3-Step Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Start the Server
```bash
npm start
```

You should see:
```
🚀 Payment server running on http://localhost:3000
📊 Admin panel: http://localhost:3000/payments.html
```

### Step 3: Test It!

1. Open: http://localhost:3000/api/health
   - Should show: `"status": "ok"`

2. Open: http://localhost:3000/payments.html
   - Login as admin
   - Fill out payment form
   - Click "Process Payment"

## ✅ That's It!

Your payment system is now running locally and ready to accept payments!

## 🌐 Deploy to Production

See the full guide: `docs/PAYMENT-SETUP-GUIDE.md`

Quick deploy options:
- **Heroku**: Free tier available
- **Vercel**: Instant deployment
- **Railway**: Easy setup

## 🆘 Having Issues?

### Backend won't start?
```bash
cd backend
npm install express cors dotenv
npm start
```

### Can't access payments.html?
1. Make sure you're logged in as admin
2. Go to: http://localhost:3000/login.html?admin=true
3. Login with your admin account

### Payment fails?
1. Check backend is running
2. Check browser console for errors
3. Verify Square credentials in `backend/simple-payment-server.js`

## 📚 Full Documentation

- **Complete Setup Guide**: `docs/PAYMENT-SETUP-GUIDE.md`
- **Deployment Guide**: `docs/DEPLOYMENT-CHECKLIST.md`
- **Square Docs**: https://developer.squareup.com

---

**Need Help?** Check the troubleshooting section in `docs/PAYMENT-SETUP-GUIDE.md`
