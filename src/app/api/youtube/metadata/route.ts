import { NextRequest, NextResponse } from 'next/server';
import { executeYtdlp, isValidYouTubeUrl, cleanYouTubeUrl, extractVideoId } from '@/lib/youtube/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MetadataResponse {
  success: boolean;
  data?: {
    title: string;
    duration: number;
    thumbnail: string;
    videoId: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<MetadataResponse>> {
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

    const videoId = extractVideoId(cleanUrl);

    console.log('Fetching metadata with yt-dlp:', cleanUrl);

    const videoInfo = await executeYtdlp(cleanUrl, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        title: videoInfo.title || 'Unknown',
        duration: Math.round(videoInfo.duration || 0),
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId: videoId || '',
      },
    });
  } catch (error) {
    console.error('YouTube Metadata Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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

    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin video. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
