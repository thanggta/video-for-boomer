# YouTube Audio Download Issue & Solutions

## Current Status ⚠️

The YouTube audio download feature is experiencing intermittent issues due to YouTube's API changes.

### What's Working ✅
- ✅ YouTube URL validation
- ✅ Video metadata fetching (title, duration)
- ✅ Thumbnail display
- ✅ Audio format detection

### What May Fail ❌
- ❌ Audio download (may result in 403 Forbidden errors)
- ❌ Error message: "Could not parse decipher function"

## Root Cause

YouTube frequently updates their player code to prevent automated downloads. The current issue:

1. **Decipher Function**: YouTube's player uses a signature cipher to protect video/audio URLs
2. **Library Lag**: There's a delay between YouTube's changes and library updates
3. **403 Errors**: Unsigned URLs are rejected by YouTube's servers

## Current Implementation

### Package Used
- `@distube/ytdl-core` v4.16.12 - Actively maintained fork of ytdl-core

### Fallback Strategy
The code implements a two-tier approach:
1. **Primary**: Try server-side proxy download via `/api/youtube/download`
2. **Fallback**: Attempt direct client-side download from audioUrl

## Solutions

### Option 1: Wait for Library Update (Recommended)
The `@distube/ytdl-core` maintainers usually fix these issues within days.

**Check for updates:**
```bash
npm update @distube/ytdl-core
```

**Monitor:**
- https://github.com/distubejs/ytdl-core/issues/144

### Option 2: Use yt-dlp (Most Reliable)
`yt-dlp` is a command-line tool that's more robust against YouTube changes.

**Install:**
```bash
npm install yt-dlp-wrap
```

**Implementation:**
```typescript
import YTDlpWrap from 'yt-dlp-wrap';

const ytDlp = new YTDlpWrap();
const audioStream = ytDlp.execStream([
  url,
  '-f', 'bestaudio',
  '-o', '-'
]);
```

### Option 3: Use Official YouTube Data API
Requires API key but is most stable.

**Setup:**
1. Get API key from Google Cloud Console
2. Enable YouTube Data API v3
3. Use official client library

### Option 4: Third-Party Service
Use services like:
- RapidAPI YouTube services
- YouTube-dl web services
- Custom backend with yt-dlp

## Temporary Workarounds

### For Users
1. Try a different video
2. Wait a few hours and try again
3. Use shorter videos (< 5 minutes)
4. Try videos from different channels

### For Developers
1. Implement retry logic with exponential backoff
2. Cache successful downloads
3. Provide clear error messages to users
4. Consider implementing a queue system

## Monitoring

Check if the issue is resolved:
```bash
curl -X POST http://localhost:3001/api/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

If you see warnings about "decipher function", the issue persists.

## Best Practices

1. **Always handle errors gracefully**
2. **Provide user-friendly error messages**
3. **Implement retry logic**
4. **Monitor library updates**
5. **Consider rate limiting**
6. **Cache metadata when possible**

## Contact & Support

- **Library Issues**: https://github.com/distubejs/ytdl-core/issues
- **YouTube API**: https://developers.google.com/youtube/v3

## Last Updated
2026-01-23

