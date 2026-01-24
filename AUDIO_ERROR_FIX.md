# Audio Processing Error - Complete Fix

## Problem Summary

The application was failing during video processing with the following errors:

1. **"Looping audio Infinity times"** - Audio duration was 0, causing infinite loop calculation
2. **"Output file #0 does not contain any stream"** - FFmpeg reading video data instead of audio
3. **"Could not delete file"** - File system conflicts in FFmpeg.wasm
4. **Suspiciously small audio file** - 35KB for 64-second audio (should be ~384KB minimum)

## Root Causes

### 1. Missing Audio Duration
- YouTube metadata endpoint uses oEmbed API which doesn't provide duration
- Duration was hardcoded to 0 in `/api/youtube/metadata`
- This caused `Math.ceil(videoDuration / 0) = Infinity` when looping audio

### 2. File System Conflicts
- Multiple operations used the same filenames (`concat_list.txt`, `input_audio.m4a`, etc.)
- FFmpeg.wasm virtual filesystem wasn't properly clearing files between operations
- Old video data remained in files when audio processing tried to use them

### 3. Invalid Audio Download
- Audio file size (35KB) is too small for 64-second duration
- Indicates corrupted download or wrong content being returned
- No validation was performed on downloaded audio

## Complete Solution

### Fix 1: Pass Duration from yt-dlp (CRITICAL)

**File: `src/app/api/youtube/download/route.ts`**
- Added `X-Video-Duration` header with actual duration from yt-dlp
- This provides the real audio duration instead of 0

**File: `src/lib/youtube/youtubeService.ts`**
- Read duration from `X-Video-Duration` header
- Override metadata duration with actual value from yt-dlp

### Fix 2: Unique Filenames with Timestamps (CRITICAL)

**All processor files updated:**
- `src/lib/ffmpeg/audioProcessor.ts`
- `src/lib/ffmpeg/videoProcessor.ts`

**Changes:**
- All filenames now include timestamp: `input_audio_${timestamp}.m4a`
- Prevents conflicts between concurrent or sequential operations
- Each operation uses completely unique files

### Fix 3: Audio Validation (CRITICAL)

**File: `src/lib/ffmpeg/audioProcessor.ts`**

Added comprehensive validation:
```typescript
// 1. Check blob exists and not empty
if (!audioBlob || audioBlob.size === 0) {
  throw new Error('Invalid audio blob: empty or null');
}

// 2. Validate size (minimum 1KB per second)
const minExpectedSize = audioDuration * 1024;
if (audioBlob.size < minExpectedSize) {
  throw new Error(`Downloaded audio file is too small (${audioBlob.size} bytes)`);
}

// 3. Validate content type
if (!audioBlob.type.includes('audio') && !audioBlob.type.includes('webm')) {
  throw new Error(`Invalid audio format: ${audioBlob.type}`);
}

// 4. Verify file write
const writtenData = await readFile(inputFileName);
if (writtenData.length !== audioBlob.size) {
  throw new Error('File write verification failed');
}
```

### Fix 4: Safety Checks

**File: `src/lib/ffmpeg/audioProcessor.ts`**

Added safety checks in `loopAudio`:
```typescript
// Prevent division by zero
if (audioDuration <= 0) {
  throw new Error('Invalid audio duration: cannot loop audio with zero or negative duration');
}

// Prevent infinite loops
if (!isFinite(loopCount) || loopCount <= 0) {
  throw new Error(`Invalid loop count: ${loopCount}`);
}
```

## Files Modified

1. ✅ `src/app/api/youtube/download/route.ts` - Add duration header
2. ✅ `src/lib/youtube/youtubeService.ts` - Read duration from header
3. ✅ `src/lib/ffmpeg/audioProcessor.ts` - Validation + unique filenames
4. ✅ `src/lib/ffmpeg/videoProcessor.ts` - Unique filenames

## Expected Behavior After Fix

1. ✅ Audio duration correctly retrieved from yt-dlp (not 0)
2. ✅ Audio file size validated before processing
3. ✅ Clear error messages if download fails or returns wrong content
4. ✅ No file conflicts in FFmpeg virtual filesystem
5. ✅ Proper audio looping with correct loop count
6. ✅ Successful video processing with audio

## Testing

After deploying, test with:
1. Upload 2-3 short videos
2. Add YouTube audio URL
3. Process videos
4. Check console for validation messages
5. Verify final video has correct audio

## If Error Persists

If you still see "Audio file too small" error:
- The YouTube download is genuinely failing
- Check YouTube URL is valid and accessible
- Check YOUTUBE_COOKIES environment variable is set correctly
- Try a different YouTube video

