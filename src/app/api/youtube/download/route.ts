import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl, cleanYouTubeUrl, downloadAudioWithYtdlp } from '@/lib/youtube/ytdlp';

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

    console.log('Downloading audio with yt-dlp:', cleanUrl);

    try {
      const { buffer, duration } = await downloadAudioWithYtdlp(cleanUrl);

      const audioData = new Uint8Array(buffer);

      return new NextResponse(audioData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'X-Video-Duration': duration.toString(),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Failed to download audio:', error);
      return NextResponse.json(
        { success: false, error: 'Không thể tải xuống âm thanh từ video' },
        { status: 500 }
      );
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
