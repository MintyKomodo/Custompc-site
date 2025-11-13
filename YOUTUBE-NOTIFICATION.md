# 🎵 YouTube Notification System

## What Happens When You Get a Message

When a customer sends you a message in admin-chats.html:

1. **🔊 BEEP!** - Loud alert sound plays (2 seconds)
2. **💻 Browser Notification** - Desktop popup appears
3. **🎵 NOISESTORM STARTS!** - YouTube player appears and plays music

---

## 🎵 YouTube Music Details

**Song**: Noisestorm - Crab Rave
**Start Time**: 1 minute (60 seconds into the song)
**Looping**: YES - plays continuously until you stop it
**Volume**: Maximum (100%)
**Auto-play**: Starts 1 second after the beep sound

---

## 🎮 How to Control It

### Stop the Music
Click the **🔇 Stop Music** button in the floating player

### Player Location
- Top-right corner of the screen
- Floating above everything
- Shows video player (320x200)
- Has stop button

### What Happens When You Stop
- Music pauses
- Player hides
- Can be triggered again by next notification

---

## 🔄 When It Plays

### Always Plays For:
- ✅ **New chats** (first message from a user)
- ✅ **Existing chats** after 2+ hours

### Never Plays For:
- ❌ Messages within 2-hour cooldown
- ❌ When you manually stop it (until next notification)

---

## 🎨 Visual Design

The YouTube player appears as a floating box with:
- Dark theme matching your site
- Blue accent border
- Stop button at the top
- Video player showing Noisestorm
- Smooth animations

---

## 🧪 Testing

### Test the Notification
1. Click **🔔 Test Sound** button in admin-chats.html
2. You'll hear the beep
3. YouTube player should appear after 1 second
4. Noisestorm starts playing from 1:00
5. Music loops continuously

### Test the Stop Button
1. Wait for notification to trigger
2. Click **🔇 Stop Music** button
3. Music stops
4. Player disappears

---

## 🔧 Technical Details

### YouTube Video ID
`LDU_Txk06tM` (Noisestorm - Crab Rave)

### Player Settings
```javascript
{
    autoplay: 1,
    start: 60,        // Start at 1 minute
    loop: 1,          // Enable looping
    playlist: 'LDU_Txk06tM', // Required for loop
    controls: 1,      // Show controls
    modestbranding: 1 // Minimal YouTube branding
}
```

### Volume
- Set to 100% (maximum)
- Cannot be adjusted (intentionally loud)

### Looping Logic
- When video ends, seeks back to 1:00
- Plays again automatically
- Continues until manually stopped

---

## 🎯 Why This Works

### Impossible to Miss
- Loud beep gets your attention
- Music keeps playing until you acknowledge
- Visual player reminds you to check chats

### Not Annoying
- Only plays for important notifications
- 2-hour cooldown prevents spam
- Easy to stop with one click

### Professional
- Uses popular EDM track (Noisestorm)
- Clean player interface
- Matches your site design

---

## 🆘 Troubleshooting

### Music Doesn't Play

**Problem**: YouTube player doesn't appear

**Solutions**:
1. Check browser allows autoplay
2. Click anywhere on page first
3. Check YouTube isn't blocked
4. Try the test button

### Music Won't Stop

**Problem**: Stop button doesn't work

**Solutions**:
1. Refresh the page
2. Click stop button again
3. Pause video manually in player
4. Close the browser tab

### Wrong Song Playing

**Problem**: Different video plays

**Solution**:
- Video ID is hardcoded: `LDU_Txk06tM`
- Should always be Noisestorm - Crab Rave
- If wrong, check code wasn't modified

---

## 🎵 Change the Song (Optional)

Want a different song? Edit `admin-chats.html`:

1. Find: `videoId: 'LDU_Txk06tM'`
2. Replace with your YouTube video ID
3. Update `playlist:` to match
4. Adjust `start:` time if needed

Example for different song:
```javascript
videoId: 'YOUR_VIDEO_ID',
start: 30,  // Start at 30 seconds
playlist: 'YOUR_VIDEO_ID'
```

---

## ✅ Summary

**What You Get:**
- 🔊 Loud beep alert
- 💻 Browser notification
- 🎵 Noisestorm playing on loop
- 🎮 Easy stop button
- ⏰ Smart cooldown system

**When It Plays:**
- New chats (always)
- Existing chats (after 2 hours)

**How to Stop:**
- Click **🔇 Stop Music** button
- Player disappears
- Music stops

---

**You'll never miss a customer message with Noisestorm blasting! 🎉🦀**
