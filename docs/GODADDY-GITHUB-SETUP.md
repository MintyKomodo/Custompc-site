# Connect GitHub Pages to GoDaddy Domain

## Overview
You'll connect your GitHub repository (custompc.tech) to your GoDaddy domain so visitors see your site at your custom domain.

## Step 1: Configure GitHub Pages

### 1.1 Enable GitHub Pages
1. Go to your GitHub repository: **github.com/MintyKomodo/Custompc-site**
2. Click **Settings** (top right)
3. Scroll to **Pages** (left sidebar)
4. Under **Source**, select **main** branch
5. Click **Save**

### 1.2 Add Custom Domain
1. Still in **Pages** settings
2. Under **Custom domain**, enter: **custompc.tech**
3. Click **Save**
4. Wait for DNS check (may take a few minutes)
5. Check **Enforce HTTPS** (after DNS is verified)

## Step 2: Configure GoDaddy DNS

### 2.1 Login to GoDaddy
1. Go to **godaddy.com**
2. Login to your account
3. Go to **My Products**
4. Find **custompc.tech** domain
5. Click **DNS** or **Manage DNS**

### 2.2 Add GitHub Pages DNS Records

**Delete existing A records** (if any), then add these:

#### A Records (for root domain):
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 600 seconds

Type: A
Name: @
Value: 185.199.109.153
TTL: 600 seconds

Type: A
Name: @
Value: 185.199.110.153
TTL: 600 seconds

Type: A
Name: @
Value: 185.199.111.153
TTL: 600 seconds
```

#### CNAME Record (for www subdomain):
```
Type: CNAME
Name: www
Value: mintykomodo.github.io
TTL: 600 seconds
```

### 2.3 Save DNS Changes
1. Click **Save** or **Save All Records**
2. Wait 10-60 minutes for DNS propagation

## Step 3: Verify CNAME File

Your repository should have a CNAME file (you already have this):
```
custompc.tech
```

This tells GitHub what domain to use.

## Step 4: Test Your Setup

### After 10-60 minutes, test:
1. Visit **http://custompc.tech** - Should load your site
2. Visit **http://www.custompc.tech** - Should redirect to custompc.tech
3. Visit **https://custompc.tech** - Should work with SSL

## Troubleshooting

### DNS Not Working?
- **Wait longer** - DNS can take up to 48 hours (usually 10-60 minutes)
- **Clear browser cache** - Ctrl+Shift+Delete
- **Check DNS propagation**: Use [whatsmydns.net](https://www.whatsmydns.net)

### SSL Certificate Issues?
- **Wait for DNS** - SSL only works after DNS is fully propagated
- **Uncheck and recheck** "Enforce HTTPS" in GitHub Pages settings
- **Wait 24 hours** - GitHub needs time to provision SSL certificate

### Site Not Loading?
- **Check GitHub Pages** - Make sure it's enabled and building successfully
- **Check CNAME file** - Should contain only "custompc.tech"
- **Check DNS records** - Make sure all 4 A records are correct

## Quick Reference

### GitHub Pages IP Addresses:
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

### Your GitHub Pages URL:
- mintykomodo.github.io/Custompc-site

### Your Custom Domain:
- custompc.tech

## Timeline
- **DNS Setup**: 5-10 minutes
- **DNS Propagation**: 10-60 minutes (can be up to 48 hours)
- **SSL Certificate**: 24 hours after DNS is working
- **Total**: Usually working within 1 hour, fully secure within 24 hours

## Important Notes
- ✅ Your CNAME file already exists
- ✅ Your site is ready to deploy
- ✅ GitHub Pages is free
- ✅ SSL certificate is free (via Let's Encrypt)
- ⚠️ Backend server (payments) needs separate hosting

## After It's Working
Your site will be live at:
- **https://custompc.tech** ✅
- **https://www.custompc.tech** ✅ (redirects to main)

## Backend Hosting (For Payments)
Your payment server needs separate hosting:
- **Heroku** (free tier available)
- **Railway** (free tier available)
- **Vercel** (free for hobby projects)
- **DigitalOcean** ($5/month)

I can help you set up backend hosting once your domain is connected!