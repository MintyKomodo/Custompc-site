# Firebase Security Setup Guide

## 🔒 Securing Your Firebase Realtime Database

Your Firebase API key being visible in client-side code is **normal and expected** for Firebase. The key itself is not secret - security comes from Firebase Security Rules, not from hiding the API key.

## ✅ What You Need to Do

### Step 1: Apply Firebase Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **custompc-website**
3. Click on **Realtime Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firebase-database.rules.json` and paste them into the rules editor
6. Click **Publish**

### Step 2: Set Up Domain Restrictions (Recommended)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Find your web app and click the settings icon
4. Under **App Check**, enable it and add your domain:
   - `custompc.tech`
   - `www.custompc.tech`
   - `localhost` (for development)

### Step 3: Enable Firebase Authentication (Optional but Recommended)

For better security, enable Firebase Authentication:

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Anonymous** authentication (for guest users)
4. This allows you to track users without requiring login

## 🛡️ What These Rules Do

### Current Rules Explanation:

```json
{
  "chats": {
    // Anyone can read chats (needed for admin dashboard)
    // Anyone can write (create new chats and messages)
    ".read": true,
    ".write": true
  },
  
  "userChats": {
    // Users can only read/write their own chat history
    // Requires username matching
    "$username": {
      ".read": "auth != null && auth.token.username == $username",
      ".write": "auth != null && auth.token.username == $username"
    }
  },
  
  "globalChat": {
    // Public chat - anyone can read and write
    // Messages are validated for structure and length
    ".read": true,
    ".write": true
  }
}
```

## 🔐 Additional Security Measures

### 1. Environment Variables (For Production)

Move your Firebase config to environment variables:

```javascript
// In production, use environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

### 2. Rate Limiting

Firebase automatically provides some rate limiting, but you can add more:

```json
{
  "rules": {
    "chats": {
      ".write": "!root.child('rate_limit/' + auth.uid).exists() || root.child('rate_limit/' + auth.uid).val() < now - 1000"
    }
  }
}
```

### 3. Data Validation

The rules file includes validation to ensure:
- Messages have required fields (text, username, type, timestamp)
- Text length is limited to 5000 characters
- Chat info includes username and email

## ⚠️ Important Notes

1. **API Key is Public**: Your Firebase API key in the client code is meant to be public. It identifies your Firebase project.

2. **Security = Rules**: Security comes from Firebase Security Rules, not from hiding the API key.

3. **Domain Restrictions**: Use Firebase App Check and domain restrictions to prevent unauthorized domains from using your Firebase project.

4. **Monitor Usage**: Check Firebase Console regularly for unusual activity:
   - Go to **Usage and billing**
   - Set up budget alerts
   - Monitor read/write operations

## 🚨 If Your Database is Compromised

If you suspect unauthorized access:

1. **Immediately** change your rules to:
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false
     }
   }
   ```

2. Review the **Usage** tab in Firebase Console

3. Check **Authentication** logs for suspicious activity

4. Consider regenerating your Firebase project if needed

## 📊 Monitoring

Set up Firebase monitoring:

1. Go to **Firebase Console** → **Analytics**
2. Enable **Google Analytics** for your project
3. Set up **Alerts** for unusual activity
4. Monitor **Realtime Database** usage in the **Usage** tab

## 🔄 Current Setup Status

- ✅ Firebase Realtime Database enabled
- ✅ Database URL: `https://custompc-website-default-rtdb.firebaseio.com`
- ⚠️ **ACTION NEEDED**: Apply security rules from `firebase-database.rules.json`
- ⚠️ **RECOMMENDED**: Enable App Check and domain restrictions

## 📝 Next Steps

1. Apply the security rules from `firebase-database.rules.json`
2. Test your chat functionality to ensure it still works
3. Enable App Check for additional security
4. Set up monitoring and alerts
5. Consider implementing Firebase Authentication for better user tracking

## 💡 Questions?

- Firebase Security Rules Documentation: https://firebase.google.com/docs/database/security
- Firebase App Check: https://firebase.google.com/docs/app-check
- Best Practices: https://firebase.google.com/docs/database/security/best-practices
