# 🛒 Shopify Integration Guide

## Why Shopify?

**Better than the current system because:**
- ✅ Real payment processing (not just storing card info)
- ✅ PCI compliant (secure and legal)
- ✅ Easy to set up (no backend needed)
- ✅ Professional checkout experience
- ✅ Automatic receipts and invoices
- ✅ Built-in fraud protection
- ✅ Customer management
- ✅ Inventory tracking

**Better than Square because:**
- ✅ No backend server needed
- ✅ Easier integration
- ✅ Better for custom products
- ✅ More flexible pricing

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Shopify Account

1. Go to: https://www.shopify.com/
2. Click "Start free trial"
3. Enter your email
4. Create your store name: `custompc-tech`
5. Complete the setup wizard

**Cost**: $29/month (Basic plan) - First 3 days free

---

### Step 2: Add Your Products

1. In Shopify admin, go to **Products** → **Add product**
2. Create products for your PC builds:

**Example Products:**
- Gaming PC Build - $1,500
- Workstation PC Build - $2,000
- Budget Gaming PC - $800
- Custom PC Build - $0 (customer enters price)

**For each product:**
- Add title
- Add description
- Upload images
- Set price
- Click "Save"

---

### Step 3: Enable Buy Button

1. In Shopify admin, go to **Sales channels**
2. Click **+** to add a channel
3. Select **Buy Button**
4. Click **Add channel**

---

### Step 4: Create Buy Buttons

1. Go to **Sales channels** → **Buy Button**
2. Click **Create Buy Button**
3. Select a product
4. Customize the button:
   - Button text: "Order Now"
   - Button color: Match your site (blue)
   - Show product image: Yes
5. Click **Generate code**
6. Copy the code

---

### Step 5: Add to Your Website

I'll create pages with the Shopify Buy Buttons embedded!

---

## 💳 How It Works

### For Customers:

1. Customer browses your builds on `builds.html`
2. Clicks "Order Now" button
3. Shopify checkout opens (modal or new page)
4. Customer enters:
   - Shipping address
   - Payment info (credit card)
   - Contact details
5. Completes purchase
6. Gets confirmation email with receipt

### For You (Admin):

1. Get notification of new order
2. View order details in Shopify admin
3. Process/fulfill the order
4. Ship the PC
5. Mark as fulfilled
6. Customer gets tracking info

---

## 🎨 Integration Options

### Option 1: Buy Button (Easiest)
- Embed button on your pages
- Opens Shopify checkout
- No coding needed
- **Recommended for you!**

### Option 2: Shopify Storefront API
- Full custom checkout
- More control
- Requires coding
- More complex

### Option 3: Shopify Lite ($9/month)
- Buy buttons only
- No full store
- Cheaper option
- Good for starting

---

## 📝 What I'll Create for You

### 1. Shop Page (`shop.html`)
- Grid of all your PC builds
- Each with "Order Now" button
- Shopify Buy Buttons embedded
- Professional design

### 2. Custom Build Order (`custom-order.html`)
- Form for custom specifications
- Customer enters requirements
- Creates custom Shopify order
- You get notification

### 3. Updated Builds Pages
- Add "Order Now" buttons to each build
- Link to Shopify checkout
- Show pricing clearly

---

## 🔧 Setup Instructions

### Get Your Shopify Credentials

After creating your Shopify store:

1. Go to **Sales channels** → **Buy Button**
2. Create a Buy Button for each product
3. Copy the embed code
4. I'll add it to your pages

### Example Buy Button Code:

```html
<div id='product-component-1234567890'></div>
<script type="text/javascript">
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript();
    }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: 'your-store.myshopify.com',
      storefrontAccessToken: 'your-token-here',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: 'product-id-here',
        node: document.getElementById('product-component-1234567890'),
        options: {
          "product": {
            "styles": {
              "button": {
                "background-color": "#7db2ff"
              }
            }
          }
        }
      });
    });
  }
})();
</script>
```

---

## 💰 Pricing

### Shopify Plans:

**Basic** - $29/month
- Unlimited products
- 2 staff accounts
- Online store
- Buy buttons
- **Recommended**

**Shopify Lite** - $9/month
- Buy buttons only
- No full store
- Good for starting
- Can upgrade later

**Shopify** - $79/month
- More features
- More staff accounts
- Better reports

### Transaction Fees:

- **Credit card**: 2.9% + $0.30 per transaction
- **No additional fees** if using Shopify Payments
- **2% fee** if using external payment gateway

---

## 🎯 Next Steps

1. **Create Shopify account** (you do this)
2. **Add your products** (you do this)
3. **Get Buy Button codes** (you do this)
4. **Send me the codes** (you send to me)
5. **I'll integrate them** (I do this)

---

## 🆚 Comparison

### Current System (Simple Payment)
- ❌ Doesn't process real payments
- ❌ Just stores card info
- ❌ Not PCI compliant
- ❌ No receipts
- ❌ Manual processing
- ❌ Security risk

### Shopify Integration
- ✅ Real payment processing
- ✅ PCI compliant
- ✅ Automatic receipts
- ✅ Professional checkout
- ✅ Fraud protection
- ✅ Customer management
- ✅ Inventory tracking
- ✅ Shipping integration

---

## 🔒 Security

**Shopify handles:**
- Credit card processing
- PCI compliance
- Fraud detection
- Secure checkout
- SSL certificates
- Data encryption

**You don't need to:**
- Store card numbers
- Handle sensitive data
- Worry about security
- Get PCI certified

---

## 📊 What You Get

### Shopify Admin Dashboard:
- View all orders
- Customer information
- Sales reports
- Inventory management
- Shipping labels
- Email customers
- Refund orders

### Customer Experience:
- Professional checkout
- Multiple payment methods
- Automatic receipts
- Order tracking
- Customer accounts
- Saved payment info

---

## 🚀 Ready to Start?

**Do this now:**

1. Go to https://www.shopify.com/
2. Start free trial
3. Create store: `custompc-tech`
4. Add 3-5 products (your PC builds)
5. Enable Buy Button channel
6. Create Buy Buttons for each product
7. Send me the embed codes
8. I'll integrate them into your site!

**Time needed:** 15-30 minutes
**Cost:** $29/month (or $9/month for Lite)
**Result:** Professional, secure payment system!

---

## 💡 Alternative: Stripe Checkout

If you don't want Shopify, we can use **Stripe Checkout**:

**Pros:**
- No monthly fee
- Just transaction fees (2.9% + $0.30)
- Very easy to integrate
- Professional checkout

**Cons:**
- No built-in store management
- No inventory tracking
- Manual order management

Let me know which you prefer!

---

**Recommendation: Start with Shopify Lite ($9/month) to test, then upgrade to Basic ($29/month) when you're ready!**
