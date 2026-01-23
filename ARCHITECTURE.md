# GhepVideo - Architecture Overview

## System Architecture

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Video Processing**: FFmpeg.wasm (WebAssembly)
- **Audio Extraction**: YouTube API via server-side proxy
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Playwright

### Core Components

#### 1. Video Processing Pipeline
```
User Upload → Validation → Reordering → Audio Selection → Processing → Download
   Step 1       Step 1       Step 2         Step 3         Step 4      Step 5
```

#### 2. FFmpeg.wasm Integration

**Location**: `src/lib/ffmpeg/ffmpegService.ts`

**Loading Strategy**:
- Uses CDN-based loading with `toBlobURL` helper
- Supports multi-threading via SharedArrayBuffer
- Falls back to single-threaded mode on iOS Safari

**Key Functions**:
- `loadFFmpeg()`: Initialize FFmpeg instance
- `writeFile()`: Write files to virtual filesystem
- `readFile()`: Read processed files
- `exec()`: Execute FFmpeg commands
- `cleanup()`: Clean up virtual filesystem

**Processing Flow**:
```typescript
// 1. Load FFmpeg
await loadFFmpeg(onProgress);

// 2. Write input files
await writeFile('input.mp4', videoBlob);
await writeFile('audio.m4a', audioBlob);

// 3. Process with FFmpeg
await exec([
  '-i', 'input.mp4',
  '-i', 'audio.m4a',
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-c:v', 'copy',
  '-c:a', 'aac',
  'output.mp4'
]);

// 4. Read output
const outputData = await readFile('output.mp4');
const outputBlob = uint8ArrayToBlob(outputData, 'video/mp4');

// 5. Cleanup
await cleanup();
```

#### 3. Audio Processing

**Location**: `src/lib/ffmpeg/audioProcessor.ts`

**Features**:
- Audio looping (if audio shorter than video)
- Audio trimming (if audio longer than video)
- Format conversion to AAC

**Algorithm**:
```typescript
if (audioDuration < videoDuration) {
  // Loop audio to match video duration
  const loops = Math.ceil(videoDuration / audioDuration);
  // Use FFmpeg concat demuxer
} else if (audioDuration > videoDuration) {
  // Trim audio to match video duration
  // Use FFmpeg -t flag
} else {
  // Duration matches, just copy
}
```

#### 4. Video Processing

**Location**: `src/lib/ffmpeg/videoProcessor.ts`

**Strategy**:
- Copy video stream (no re-encoding) for speed
- Re-encode audio to AAC for compatibility
- Process videos sequentially to manage memory

**Optimization**:
```typescript
// Fast: Copy video codec, only re-encode audio
await exec([
  '-i', 'input.mp4',
  '-i', 'audio.m4a',
  '-c:v', 'copy',      // No video re-encoding
  '-c:a', 'aac',       // Re-encode audio
  '-b:a', '128k',      // Audio bitrate
  'output.mp4'
]);
```

### FFmpeg Loading Architecture

#### CDN-Based Approach (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ffmpegService.ts                                   │    │
│  │                                                      │    │
│  │  1. Fetch from CDN:                                 │    │
│  │     cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6       │    │
│  │                                                      │    │
│  │  2. Convert to Blob URLs:                           │    │
│  │     toBlobURL(cdnUrl, mimeType)                     │    │
│  │                                                      │    │
│  │  3. Load FFmpeg:                                    │    │
│  │     ffmpeg.load({ coreURL, wasmURL, workerURL })   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ No local file management
- ✅ Automatic CDN caching
- ✅ Proper UMD builds
- ✅ CORS handled by toBlobURL
- ✅ Easy version updates

#### Previous Approach (Broken)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ffmpegService.ts                                   │    │
│  │                                                      │    │
│  │  1. Load from local public directory:               │    │
│  │     /ffmpeg/ffmpeg-core.js  ❌ ES Module syntax     │    │
│  │     /ffmpeg/ffmpeg-core.wasm                        │    │
│  │     /ffmpeg/ffmpeg-core.worker.js                   │    │
│  │                                                      │    │
│  │  2. Error: Cannot find module                       │    │
│  │     import.meta.url not supported                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Issues**:
- ❌ ES module syntax in non-module context
- ❌ Manual file management required
- ❌ CORS configuration complexity
- ❌ Incorrect distribution files

### CORS Configuration

**Location**: `next.config.js`

**Purpose**: Enable SharedArrayBuffer for multi-threading

```javascript
headers: [
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
]
```

**Why Needed**:
- SharedArrayBuffer requires cross-origin isolation
- Enables multi-threaded FFmpeg processing
- Significantly faster video processing

### State Management

**Store**: `src/store/videoStore.ts`

**State Structure**:
```typescript
{
  videos: VideoItem[],           // Uploaded videos
  currentStep: number,           // Current workflow step
  youtubeAudio: YouTubeAudioData | null,  // Selected audio
  processedVideos: ProcessedVideo[],      // Processed results
}
```

### Performance Optimizations

1. **Lazy Loading**: FFmpeg loaded only when needed (Step 4)
2. **Video Codec Copy**: No re-encoding of video stream
3. **Sequential Processing**: Prevents memory overflow
4. **Virtual Filesystem Cleanup**: Frees memory after each video
5. **Multi-threading**: Uses SharedArrayBuffer when available

### Error Handling

**Levels**:
1. **Validation**: File size, duration, format checks
2. **Loading**: FFmpeg initialization errors
3. **Processing**: FFmpeg execution errors
4. **Network**: YouTube API failures

**Strategy**:
- User-friendly error messages
- Detailed console logging for debugging
- Graceful degradation (single-threaded fallback)

### Testing Strategy

**Test Types**:
- Smoke tests: Basic functionality
- Unit tests: Individual components
- Integration tests: Full workflow
- E2E tests: Real user scenarios

**Coverage**:
- Upload validation
- Video reordering
- YouTube integration
- FFmpeg loading
- Video processing
- Download functionality

