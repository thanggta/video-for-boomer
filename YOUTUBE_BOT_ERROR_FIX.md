# Fix: "Sign in to confirm you're not a bot" Error

## 🔴 Your Current Problem

You're getting this error:
```
ERROR: [youtube] Sign in to confirm you're not a bot
```

**Root Cause:** You have only **6 cookie entries**, but YouTube requires **15+ cookies** from a **logged-in session**.

This means you exported cookies **WITHOUT logging in to YouTube**.

---

## ✅ Solution (For Render Deployment)

### Step 1: Export Cookies CORRECTLY

**You MUST be logged in to YouTube!**

1. **Open NEW Incognito Window** (Chrome: Ctrl/Cmd + Shift + N)
2. **Go to youtube.com and LOG IN**
   - Complete 2FA if required
   - Make sure you see your profile picture
3. **Navigate to https://www.youtube.com/robots.txt** (in the SAME incognito window)
4. **Export cookies:**
   - Chrome: Use [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Click extension icon → "Export" → Save as `youtube-cookies.txt`
5. **IMMEDIATELY close the entire incognito window**

---

### Step 2: Validate Cookies

**Run the validation script:**

```bash
chmod +x scripts/validate-youtube-cookies.sh
./scripts/validate-youtube-cookies.sh youtube-cookies.txt
```

**Expected output:**
```
✅ Cookie count validation passed (20+ entries)
```

**If you see:**
```
❌ FAILED: Only 6 cookie entries found
```

→ **You didn't log in!** Go back to Step 1 and make sure you're LOGGED IN.

---

### Step 3: Test Locally

```bash
# Set environment variable
export YOUTUBE_COOKIES="$(cat youtube-cookies.txt)"

# Start dev server
npm run dev

# Try downloading a YouTube video
# If it works, proceed to Step 4
```

---

### Step 4: Upload to Render

1. Go to **Render Dashboard** → Your Service → **Environment** tab
2. Find `YOUTUBE_COOKIES` variable (or create new one)
3. **Paste the ENTIRE content** of `youtube-cookies.txt`
4. Click **Save Changes**
5. Render will automatically redeploy

---

## 🔍 How to Verify It's Working

After deploying to Render, check the logs. You should see:

**✅ Good (20+ cookies):**
```
Using cookies from YOUTUBE_COOKIES env variable (23 cookie entries)
```

**❌ Bad (6 cookies - not logged in):**
```
Using cookies from YOUTUBE_COOKIES env variable (6 cookie entries)
⚠️  WARNING: Only 6 cookie entries found. YouTube typically requires 15+ cookies
```

---

## 🚨 Common Mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Exported without logging in | 6 cookies | **LOG IN first!** |
| Used regular browser window | Cookies rotated | Use incognito/private |
| Kept incognito window open | Cookies rotated | Close immediately |
| Exported from guest session | No login cookies | Must be logged in |

---

## 📝 Why This Happens

1. **YouTube detects bots** by checking for valid login cookies
2. **Guest cookies** (6 entries) are flagged as suspicious
3. **Logged-in cookies** (15+ entries) bypass bot detection
4. **Cookie rotation:** YouTube changes cookies on active sessions, so you must export from a closed session

---

## 🔄 Maintenance

**Cookies expire every 3-5 days.** Set a reminder to:

1. Re-export cookies (follow Step 1)
2. Validate (Step 2)
3. Upload to Render (Step 4)

---

## 📚 Additional Resources

- Full setup guide: `YOUTUBE_COOKIES_SETUP.md`
- Official yt-dlp wiki: https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies
- Validation script: `scripts/validate-youtube-cookies.sh`

---

## ⚡ Quick Fix Checklist

- [ ] Open incognito window
- [ ] **LOG IN to YouTube** (see your profile picture)
- [ ] Navigate to youtube.com/robots.txt
- [ ] Export cookies with browser extension
- [ ] Close incognito window immediately
- [ ] Run validation script (should show 15+ cookies)
- [ ] Test locally
- [ ] Upload to Render
- [ ] Check Render logs for cookie count

**If you still see 6 cookies after following these steps, you're not logging in properly!**

