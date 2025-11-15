# 🚀 Stripe Setup Guide - Step by Step

## ✅ What I've Already Done

I've integrated Stripe into your website! Here's what's ready:

- ✅ `shop.html` - Updated with Stripe payment buttons
- ✅ `payment-success.html` - Thank you page after payment
- ✅ `payment-cancel.html` - Page if customer cancels
- ✅ All styling and design complete

**You just need to add your Stripe Payment Links!**

---

## 📝 What YOU Need to Do (15 minutes)

### Step 1: Create Stripe Account (5 minutes)

1. **Go to**: https://stripe.com/
2. **Click**: "Start now" (top right)
3. **Enter**:
   - Your email address
   - Create a password
4. **Verify** your email (check inbox)
5. **Complete** business information:
   - Business name: `CustomPC.tech`
   - Business type: `Individual` or `Company`
   - Industry: `Computer Hardware`
   - Website: `custompc.tech`

**Done!** You now have a Stripe account.

---

### Step 2: Add Products (5 minutes)

1. **In Stripe Dashboard**, click **Products** (left sidebar)
2. **Click** "+ Add product" (top right)

**Create Product 1: Gaming PC Build**
- Name: `Gaming PC Build`
- Description: `High-performance gaming rig with RGB lighting`
- Price: `1499` (USD)
- Click **"Save product"**

**Create Product 2: Workstation Build**
- Name: `Workstation Build`
- Description: `Professional workstation for content creation`
- Price: `2199` (USD)
- Click **"Save product"**

**Create Product 3: Budget Gaming Build**
- Name: `Budget Gaming Build`
- Description: `Affordable gaming PC for 1080p gaming`
- Price: `899` (USD)
- Click **"Save product"**

**Done!** You have 3 products.

---

### Step 3: Create Payment Links (5 minutes)

1. **In Stripe Dashboard**, click **Payment links** (left sidebar)
2. **Click** "+ New" (top right)

**For Gaming PC Build:**
1. Select "Gaming PC Build" product
2. Click **"Create link"**
3. **Copy the link** (looks like: `https://buy.stripe.com/test_xxxxx`)
4. **Save it** somewhere (notepad, email yourself)

**Repeat for other products:**
- Create link for "Workstation Build"
- Create link for "Budget Gaming Build"

**You should now have 3 links!**

Example:
```
Gaming PC: https://buy.stripe.com/test_abc123
Workstation: https://buy.stripe.com/test_def456
Budget PC: https://buy.stripe.com/test_ghi789
```

---

### Step 4: Add Links to Your Website (2 minutes)

1. **Open** `shop.html` in your code editor
2. **Find** these lines (there are 3 of them):

```html
<a href="https://buy.stripe.com/test_REPLACE_WITH_YOUR_LINK"
```

3. **Replace** `REPLACE_WITH_YOUR_LINK` with your actual Stripe links:

**For Gaming PC** (around line 180):
```html
<a href="https://buy.stripe.com/test_abc123"
```

**For Workstation** (around line 210):
```html
<a href="https://buy.stripe.com/test_def456"
```

**For Budget PC** (around line 240):
```html
<a href="https://buy.stripe.com/test_ghi789"
```

4. **Save** the file
5. **Upload** to GitHub Pages

**Done!** Your payment system is live!

---

## 🧪 Step 5: Test It! (2 minutes)

1. **Go to** your website: `custompc.tech/shop.html`
2. **Click** "Order Now" on any product
3. **You'll be redirected** to Stripe checkout
4. **Use test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. **Click** "Pay"
6. **You'll see** the success page!

**Check your Stripe Dashboard** - you'll see the test payment!

---

## 🎉 You're Done!

### What Works Now:

✅ Customers can click "Order Now"
✅ Redirected to secure Stripe checkout
✅ Enter payment information
✅ Complete purchase
✅ Get confirmation email
✅ You get notification in Stripe Dashboard
✅ Money goes to your Stripe account

---

## 💰 Going Live (When Ready)

**Currently in TEST mode** - no real charges

**To accept real payments:**

1. **In Stripe Dashboard**, toggle from "Test mode" to "Live mode" (top right)
2. **Complete** account verification:
   - Add bank account (for payouts)
   - Verify identity
   - Add business details
3. **Create new Payment Links** in Live mode
4. **Replace** test links with live links in `shop.html`
5. **Done!** Now accepting real payments!

---

## 📊 Managing Orders

**In Stripe Dashboard:**

- **Payments** - See all transactions
- **Customers** - View customer info
- **Products** - Manage your products
- **Payment links** - Edit links
- **Reports** - Sales analytics

**You'll get email notifications** for every sale!

---

## 💳 Fees

**Stripe charges:**
- 2.9% + $0.30 per successful transaction
- No monthly fees
- No setup fees

**Example:**
- $1,499 PC = You get $1,454.93 (Stripe keeps $44.07)
- $2,199 PC = You get $2,134.93 (Stripe keeps $64.07)
- $899 PC = You get $872.63 (Stripe keeps $26.37)

---

## 🆘 Troubleshooting

**Problem: Link doesn't work**
- Make sure you copied the full link
- Check for extra spaces
- Make sure it starts with `https://buy.stripe.com/`

**Problem: Can't create Payment Link**
- Make sure you created the product first
- Try refreshing the page
- Check you're in the right Stripe account

**Problem: Test card doesn't work**
- Make sure you're in TEST mode
- Use exactly: `4242 4242 4242 4242`
- Any future expiry date works

---

## 📞 Need Help?

**Stripe Support:**
- Help: https://support.stripe.com/
- Docs: https://stripe.com/docs

**Your Setup:**
- All files are ready in your repo
- Just add the Payment Links
- Upload to GitHub Pages
- Done!

---

## ✅ Quick Checklist

- [ ] Create Stripe account
- [ ] Add 3 products
- [ ] Create 3 Payment Links
- [ ] Copy the links
- [ ] Replace links in `shop.html`
- [ ] Save and upload
- [ ] Test with test card
- [ ] Verify in Stripe Dashboard
- [ ] Go live when ready!

---

**Total time: 15-20 minutes**
**Cost: $0/month (just 2.9% + $0.30 per sale)**
**Result: Professional payment system! 🎉**

---

## 🎯 Summary

**What you have now:**
- ✅ Professional shop page
- ✅ Secure Stripe checkout
- ✅ Automatic receipts
- ✅ Success/cancel pages
- ✅ Mobile-friendly
- ✅ PCI compliant
- ✅ Legal & secure

**What you need to do:**
1. Create Stripe account (5 min)
2. Add products (5 min)
3. Create Payment Links (5 min)
4. Add links to shop.html (2 min)
5. Test it (2 min)

**Then you're accepting real payments! 🚀**
