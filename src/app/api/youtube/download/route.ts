import { NextRequest, NextResponse } from 'next/server';
import { executeYtdlp, isValidYouTubeUrl, cleanYouTubeUrl } from '@/lib/youtube/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 240;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url, audioUrl } = await request.json();

    if (audioUrl && typeof audioUrl === 'string') {
      const response = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
        },
      });

      if (!response.ok) {
        throw new Error(`Proxy fetch failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const contentType = response.headers.get('content-type') || 'audio/webm';
      const contentLength = response.headers.get('content-length');

      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          ...(contentLength && { 'Content-Length': contentLength }),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

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

    const response = await fetch(audioFormat.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No audio data');
    }

    const extension = audioFormat.ext || 'webm';
    const mimeType = extension === 'm4a' ? 'audio/mp4' : 'audio/webm';
    const contentLength = response.headers.get('content-length');

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        ...(contentLength && { 'Content-Length': contentLength }),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('YouTube Download Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('private') || errorMessage.includes('unavailable')) {
      return NextResponse.json(
        { success: false, error: 'Video riêng tư hoặc không khả dụng' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Không thể tải xuống âm thanh từ YouTube. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
