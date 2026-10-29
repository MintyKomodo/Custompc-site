# CustomPC.tech - Professional PC Building Website

Custom PC building website: build gallery, free build-plan requests, and an admin payments page.

## 🚀 Quick Start

1. **Start the server**: Double-click `start-server.bat` or run:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Access the website**: Open http://localhost:3000

3. **Admin access**: 
   - Payments: http://localhost:3000/payments.html

## 📁 Project Structure

```
├── 📁 backend/           # Server and API
│   ├── simple-payment-server.js  # Main server file
│   ├── package.json      # Dependencies
│   └── .env             # Environment variables
│
├── 📁 frontend/          # Client-side assets
│   ├── square-payments.js    # Payment processing
│   ├── admin-auth.js         # Admin authentication
│   ├── shared-auth.js        # Shared auth utilities
│   ├── payment-styles.css    # Payment page styles
│   └── auth-styles.css       # Authentication styles
│
├── 📁 config/            # Configuration files
│   ├── square-config.js      # Square payment config
│   └── firebase-config.js    # Firebase config
│
├── 📁 docs/              # Documentation
│   ├── SQUARE_DEPLOYMENT_GUIDE.md
│   ├── PAYMENT_ALTERNATIVES.md
│   └── firebase-setup-guide.md
│
├── 📁 tests/             # Test files
│   ├── payment-testing.js
│   └── auth-testing.js
│
├── 📁 builds/            # PC build pages
├── 📁 images/            # Website images
├── 📁 js/                # General JavaScript
│
├── index.html            # Homepage
├── payments.html         # Payment processing (Admin)
├── builds.html           # PC builds gallery
├── about.html            # About page
├── login.html            # Login page
└── signup.html           # Signup page
```



## 🔧 Configuration

### Square Payment Setup
1. Production credentials are already configured
2. Environment automatically detected
3. Backend handles all API calls securely


## 🛡️ Security Features

- ✅ Admin authentication required for payments
- ✅ HTTPS ready (SSL certificate needed for production)
- ✅ Input validation and sanitization
- ✅ Secure payment tokenization via Square
- ✅ No sensitive data stored locally

## 🚀 Deployment

### Local Development
```bash
# Start development server
cd backend
npm start
```

### Production Deployment
1. Get SSL certificate for your domain
2. Update Square configuration for production domain
3. Deploy backend to your hosting service
4. Update API endpoints in frontend

## 📊 Features

### Payment Processing
- Real Square payment integration
- Customer card storage
- Transaction history
- Comprehensive error handling
- Mobile-responsive design


### Authentication System
- Secure admin login
- Session management
- Role-based access control
- Password validation

### PC Build Gallery
- Interactive build showcase
- Detailed specifications
- Performance metrics
- Pricing information

## 🔗 Important URLs

- **Homepage**: http://localhost:3000/
- **Admin Payments**: http://localhost:3000/payments.html
- **PC Builds**: http://localhost:3000/builds.html
- **API Health**: http://localhost:3000/api/health

## 📞 Support

- **Email**: support@custompc.tech
- **Documentation**: See `/docs` folder

## 🎯 Next Steps

1. **Test Payment System**: Use Square test cards
2. **Deploy to Production**: Get SSL and deploy
3. **Monitor Performance**: Check logs and analytics

---

**Built with**: Node.js, Express, Square API, Firebase, HTML5, CSS3, JavaScript
