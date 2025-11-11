# GitHub to GoDaddy Deployment Checklist

## Quick Steps (5 minutes setup, 1 hour wait)

### ☑️ GitHub Setup
- [ ] Go to repository Settings → Pages
- [ ] Enable GitHub Pages (main branch)
- [ ] Add custom domain: **custompc.tech**
- [ ] Save and wait for DNS check

### ☑️ GoDaddy DNS Setup
- [ ] Login to GoDaddy
- [ ] Go to My Products → custompc.tech → DNS
- [ ] Delete old A records
- [ ] Add 4 new A records:
  - @ → 185.199.108.153
  - @ → 185.199.109.153
  - @ → 185.199.110.153
  - @ → 185.199.111.153
- [ ] Add CNAME record:
  - www → mintykomodo.github.io
- [ ] Save all changes

### ☑️ Verification (Wait 10-60 minutes)
- [ ] Visit custompc.tech (should load your site)
- [ ] Visit www.custompc.tech (should redirect)
- [ ] Check GitHub Pages settings (should show green checkmark)
- [ ] Enable "Enforce HTTPS" in GitHub Pages

### ☑️ Final Checks (After 24 hours)
- [ ] HTTPS working (https://custompc.tech)
- [ ] SSL certificate active (green padlock)
- [ ] All pages loading correctly
- [ ] Images and CSS loading
- [ ] Crisp chat working

## Current Status
✅ CNAME file exists  
✅ Site is ready to deploy  
✅ GitHub repository is public  
✅ All files are organized  

## What You Need
🔑 GoDaddy login credentials  
⏰ 10 minutes for setup  
⏰ 1 hour for DNS propagation  
⏰ 24 hours for SSL certificate  

## After Deployment
Your site will be live at:
- **custompc.tech** ← Main domain
- **www.custompc.tech** ← Redirects to main

## Need Help?
If you get stuck on any step, let me know which step and I'll help you troubleshoot!