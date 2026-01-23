import { NextRequest, NextResponse } from 'next/server';
import { executeYtdlp, isValidYouTubeUrl, cleanYouTubeUrl } from '@/lib/youtube/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 240;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url, audioUrl } = await request.json();

    if (audioUrl && typeof audioUrl === 'string') {
      console.log('Streaming audio from provided URL');

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

    console.log('Extracting audio URL for:', cleanUrl);

    const videoInfo = await executeYtdlp(cleanUrl, {
      dumpSingleJson: true,
      preferFreeFormats: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    const audioFormat = videoInfo.formats
      ?.filter((f) => f.resolution === 'audio only' || f.vcodec === 'none')
      ?.sort((a, b) => (b.abr || 0) - (a.abr || 0))
      ?.find((f) => f.ext === 'm4a' || f.ext === 'webm');

    if (!audioFormat?.url) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy audio từ video này' },
        { status: 400 }
      );
    }

    console.log('Streaming audio, format:', audioFormat.ext);

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
