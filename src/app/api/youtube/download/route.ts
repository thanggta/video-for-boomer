import { NextRequest, NextResponse } from 'next/server';
import { executeYtdlp, isValidYouTubeUrl, cleanYouTubeUrl } from '@/lib/youtube/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 240;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL không hợp lệ' },
        { status: 400 }
      );
    }

    const cleanUrl = cleanYouTubeUrl(url);

    if (!isValidYouTubeUrl(cleanUrl)) {
      return NextResponse.json(
        { success: false, error: 'Link YouTube không đúng định dạng' },
        { status: 400 }
      );
    }

    console.log('Fetching video info with yt-dlp:', cleanUrl);

    const videoInfo = await executeYtdlp(cleanUrl, {
      dumpSingleJson: true,
      preferFreeFormats: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    if (!videoInfo.formats || videoInfo.formats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy định dạng nào' },
        { status: 400 }
      );
    }

    // Filter for REAL audio formats:
    // 1. Must have audio codec (acodec not "none" or undefined)
    // 2. Must have no video codec (vcodec === "none") OR resolution === "audio only"
    // 3. Must have a valid URL
    // 4. Exclude storyboard/thumbnail formats (they have vcodec but no real audio)
    const audioFormats = videoInfo.formats.filter((f) => {
      const hasAudioCodec = f.acodec && f.acodec !== 'none';
      const hasNoVideo = f.vcodec === 'none' || f.resolution === 'audio only';
      const hasUrl = !!f.url;
      const isNotStoryboard = !f.format_note?.toLowerCase().includes('storyboard');

      return hasAudioCodec && hasNoVideo && hasUrl && isNotStoryboard;
    });

    console.log(`Found ${audioFormats.length} audio formats:`,
      audioFormats.map(f => `${f.ext} ${f.acodec} ${f.abr || 0}kbps`).join(', ')
    );

    if (audioFormats.length === 0) {
      // Log all formats for debugging
      console.error('No audio formats found. Available formats:',
        videoInfo.formats.map(f => ({
          ext: f.ext,
          vcodec: f.vcodec,
          acodec: f.acodec,
          resolution: f.resolution,
          abr: f.abr,
          format_note: f.format_note,
        }))
      );
      return NextResponse.json(
        { success: false, error: 'Video không có audio track riêng' },
        { status: 400 }
      );
    }

    // Select best audio format:
    // 1. Prefer m4a or webm (widely compatible)
    // 2. Prefer higher bitrate for better quality
    // 3. Prefer opus codec (better quality at lower bitrates)
    const audioFormat = audioFormats
      .filter((f) => f.ext === 'm4a' || f.ext === 'webm')
      .sort((a, b) => {
        // Prefer higher bitrate
        const bitrateA = a.abr || 0;
        const bitrateB = b.abr || 0;
        if (bitrateB !== bitrateA) return bitrateB - bitrateA;
        // Prefer opus codec
        if (a.acodec === 'opus' && b.acodec !== 'opus') return -1;
        if (b.acodec === 'opus' && a.acodec !== 'opus') return 1;
        return 0;
      })[0]
      || audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

    if (!audioFormat?.url) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy URL audio hợp lệ' },
        { status: 400 }
      );
    }

    console.log(`Selected audio format: ${audioFormat.ext} ${audioFormat.acodec} ${Math.round(audioFormat.abr || 0)}kbps`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(audioFormat.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.youtube.com/',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No audio data');
      }

      const expectedLength = response.headers.get('content-length');
      const expectedSize = expectedLength ? parseInt(expectedLength, 10) : 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (expectedSize > 0 && receivedLength > expectedSize * 1.1) {
          throw new Error('Downloaded size exceeds expected size');
        }
      }

      const audioData = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, position);
        position += chunk.length;
      }

      // Only warn if download seems incomplete based on content-length header
      if (expectedSize > 0 && receivedLength < expectedSize * 0.9) {
        console.warn(`Incomplete download: expected ${expectedSize}, got ${receivedLength}`);
      }

      // Minimum sanity check: audio should have at least some data
      if (receivedLength < 1024) {
        throw new Error(`Downloaded audio is empty or corrupted (${receivedLength} bytes).`);
      }

      // Validate file signature to ensure we got actual audio, not a thumbnail/image
      // WebM starts with 0x1A 0x45 0xDF 0xA3 (EBML header)
      // M4A/MP4 starts with 'ftyp' at offset 4
      const isWebM = audioData[0] === 0x1A && audioData[1] === 0x45 && audioData[2] === 0xDF && audioData[3] === 0xA3;
      const isM4A = audioData[4] === 0x66 && audioData[5] === 0x74 && audioData[6] === 0x79 && audioData[7] === 0x70; // 'ftyp'

      if (!isWebM && !isM4A) {
        // Check if it's a JPEG (thumbnail) - starts with 0xFF 0xD8 0xFF
        const isJPEG = audioData[0] === 0xFF && audioData[1] === 0xD8 && audioData[2] === 0xFF;
        if (isJPEG) {
          console.error('Downloaded file is a JPEG image, not audio!');
          throw new Error('Tải xuống thất bại: nhận được hình ảnh thay vì âm thanh. Vui lòng thử lại.');
        }
        console.warn(`Unknown file format. First 8 bytes: ${Array.from(audioData.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
      }

      console.log(`Audio downloaded successfully: ${receivedLength} bytes for ${videoInfo.duration}s duration (format: ${isWebM ? 'WebM' : isM4A ? 'M4A' : 'unknown'})`);

      const mimeType = audioFormat.ext === 'm4a' ? 'audio/mp4' : 'audio/webm';

      return new NextResponse(audioData, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': receivedLength.toString(),
          'X-Video-Duration': videoInfo.duration.toString(),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('YouTube Download Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('aborted')) {
      return NextResponse.json(
        { success: false, error: 'Tải xuống bị timeout. Vui lòng thử lại.' },
        { status: 408 }
      );
    }

    if (errorMessage.includes('Sign in') || errorMessage.includes('bot')) {
      return NextResponse.json(
        { success: false, error: 'YouTube yêu cầu xác thực. Vui lòng cấu hình YOUTUBE_COOKIES.' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('private') || errorMessage.includes('unavailable')) {
      return NextResponse.json(
        { success: false, error: 'Video riêng tư hoặc không khả dụng' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('empty or corrupted')) {
      return NextResponse.json(
        { success: false, error: 'Không thể tải âm thanh - dữ liệu trống hoặc bị lỗi' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Không thể tải xuống âm thanh. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
