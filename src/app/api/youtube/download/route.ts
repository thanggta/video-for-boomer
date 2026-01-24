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

    const audioFormats = videoInfo.formats.filter((f) =>
      f.resolution === 'audio only' || f.vcodec === 'none'
    );

    if (audioFormats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video không có audio track riêng' },
        { status: 400 }
      );
    }

    const audioFormat = audioFormats
      .filter((f) => f.ext === 'm4a' || f.ext === 'webm')
      .filter((f) => (f.abr || 0) >= 48 && (f.abr || 0) <= 80)
      .sort((a, b) => (a.abr || 0) - (b.abr || 0))[0]
      || audioFormats.sort((a, b) => (a.abr || 0) - (b.abr || 0))[0];

    if (!audioFormat?.url) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy URL audio hợp lệ' },
        { status: 400 }
      );
    }

    console.log(`Downloading audio: ${audioFormat.ext} ${Math.round(audioFormat.abr || 0)}kbps`);

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
      // Don't block valid audio - even small files can be valid (short clips, low bitrate)
      if (expectedSize > 0 && receivedLength < expectedSize * 0.9) {
        console.warn(`Incomplete download: expected ${expectedSize}, got ${receivedLength}`);
        // Don't throw - audio might still be usable, let FFmpeg validate it later
      }

      // Minimum sanity check: audio should have at least some data
      // Very minimal threshold - 1KB minimum, to catch completely empty responses
      if (receivedLength < 1024) {
        throw new Error(`Downloaded audio is empty or corrupted (${receivedLength} bytes).`);
      }

      console.log(`Audio downloaded successfully: ${receivedLength} bytes for ${videoInfo.duration}s duration`);

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
