# YouTube Cookies Setup for Production

## Why Cookies Are Needed

YouTube blocks datacenter IPs (like Render) from downloading videos. To bypass this, you need to provide YouTube cookies from a logged-in session.

## Cookie Expiration

**YouTube cookies expire every 3-5 days** and need to be refreshed regularly.

## Setup Instructions

### 1. Export Cookies from Browser (CRITICAL - Follow EXACTLY!)

**⚠️ IMPORTANT: You MUST be logged in to YouTube before exporting cookies!**

YouTube requires **15+ cookie entries** from a logged-in session. If you have fewer than 15 entries, the cookies are invalid.

**Using Chrome (Recommended):**
1. Install extension: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. **Open NEW Incognito Window** (Ctrl/Cmd + Shift + N)
3. **Go to youtube.com and LOG IN** (complete 2FA if required)
4. **In the SAME incognito window, navigate to https://www.youtube.com/robots.txt** (this should be the ONLY tab open)
5. Click the extension icon → "Export" → Save as `youtube-cookies.txt`
6. **IMMEDIATELY close the entire incognito window** (don't keep it open or browse YouTube)

**Using Firefox:**
1. Install extension: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
2. **Open NEW Private Window** (Ctrl/Cmd + Shift + P)
3. **Go to youtube.com and LOG IN** (complete 2FA if required)
4. **In the SAME private window, navigate to https://www.youtube.com/robots.txt** (this should be the ONLY tab open)
5. Click the extension icon → Save as `youtube-cookies.txt`
6. **IMMEDIATELY close the entire private window**

**Why this exact process matters:**
- YouTube rotates cookies on active sessions. Exporting from incognito and immediately closing prevents rotation.
- Navigating to robots.txt ensures you're on the right domain without triggering cookie rotation.
- You MUST be logged in - guest cookies won't work for bot detection bypass.

### 2. Validate Cookies (REQUIRED!)

**Before uploading to Render, verify your cookies are valid:**

```bash
# Use the validation script (recommended)
chmod +x scripts/validate-youtube-cookies.sh
./scripts/validate-youtube-cookies.sh youtube-cookies.txt

# Or manually check cookie count (should be 15+ entries)
grep -v '^#' youtube-cookies.txt | grep -v '^$' | wc -l

# If less than 15, your cookies are INVALID - go back to Step 1 and make sure you're LOGGED IN
```

**Test cookies locally:**

```bash
# Set the cookies as environment variable
export YOUTUBE_COOKIES="$(cat youtube-cookies.txt)"

# Run your app
npm run dev
```

Try downloading a YouTube video. If it works locally with cookies, it will work on Render.

**Common validation errors:**
- **6 cookie entries** = You exported WITHOUT logging in (go back to Step 1)
- **"Sign in to confirm you're not a bot"** = Cookies expired or invalid (re-export fresh cookies)
- **Works locally but not on Render** = Cookies rotated after export (re-export and upload within 5 minutes)

### 3. Upload to Render

**Method A: Environment Variable (Recommended)**

1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add new environment variable:
   - Key: `YOUTUBE_COOKIES`
   - Value: Paste the entire content of `youtube-cookies.txt`
5. Click "Save Changes"
6. Render will automatically redeploy

**Method B: File Upload (Not recommended - requires rebuild)**

This is more complex and requires modifying your Dockerfile. Use Method A instead.

### 4. Test on Render

After deployment:
1. Try downloading a YouTube video
2. Check Render logs for: `Using cookies from YOUTUBE_COOKIES env variable`
3. If successful, audio should download without errors

### 5. Maintenance Schedule

Set a reminder to refresh cookies:
- **Every 3 days** (safe)
- **Every 5 days** (risky but less frequent)

When cookies expire, you'll see error:
```
YouTube yêu cầu xác thực. Vui lòng cấu hình YOUTUBE_COOKIES.
```

Simply repeat steps 1-2 to refresh.

## Cookie Security

- Cookies contain your YouTube session
- Don't share your cookies file publicly
- Rotate cookies if compromised
- Use a dedicated YouTube account for the app (optional)

## Troubleshooting

**Error: "Sign in to confirm you're not a bot"**
→ **Most common cause: You exported cookies WITHOUT logging in!**
1. Check cookie count: `grep -v '^#' youtube-cookies.txt | grep -v '^$' | wc -l`
2. If less than 15 entries: You didn't log in before exporting
3. **Solution:** Go back to Step 1 and make sure you LOG IN to YouTube before exporting
4. Export FRESH cookies using incognito method above
5. Make sure you close the incognito window IMMEDIATELY after export
6. Upload new cookies to Render within 5 minutes of export

**Error: "yt-dlp execution failed"**
→ Check Render logs for details. May need to update yt-dlp.

**Downloads work locally but not on Render**
→ Cookies not set on Render. Check environment variable is present.

**Logs show "Using cookies from YOUTUBE_COOKIES env variable (X cookie entries)"**
→ Cookies are loading. If X is less than 15, the cookies file may be incomplete. Re-export.

**Cookies keep expiring every day**
→ You may be exporting from a browser session that's still open. **Use incognito and close immediately** after export.
