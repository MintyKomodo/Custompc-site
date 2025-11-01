# Setting Up Crisp Chat - Better Than Tawk.to

## Why Crisp is Better
- ✅ More reliable uptime
- ✅ Better mobile experience  
- ✅ Modern, clean interface
- ✅ Free for up to 2 operators
- ✅ No "Powered by" branding on free plan
- ✅ Better customization options
- ✅ Faster loading times

## Setup Steps

### 1. Create Crisp Account
1. Go to [crisp.chat](https://crisp.chat)
2. Sign up for free account
3. Create your website
4. Get your website ID

### 2. Add to Your Website
Add this code before closing `</body>` tag on all pages:

```html
<!-- Crisp Chat -->
<script type="text/javascript">
  window.$crisp=[];
  window.CRISP_WEBSITE_ID="YOUR-WEBSITE-ID-HERE";
  (function(){
    d=document;
    s=d.createElement("script");
    s.src="https://client.crisp.chat/l.js";
    s.async=1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>
```

### 3. Customize Appearance
```javascript
// Customize colors and text
$crisp.push(["set", "theme", "color", "#2196F3"]); // Your brand color
$crisp.push(["set", "theme", "text", "default"]);
$crisp.push(["set", "session", "data", [["company", "CustomPC.tech"]]]);
```

## Alternative: Tidio Chat
Another excellent free option:
- Free for up to 100 conversations/month
- AI chatbot included
- Very easy setup
- Modern interface

## Quick Implementation
I can add either Crisp or Tidio to your site right now. Which would you prefer?