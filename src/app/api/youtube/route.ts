import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeInfo, extractVideoId, isValidYouTubeUrl, cleanYouTubeUrl } from '@/lib/youtube/play-dl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface YouTubeResponse {
  success: boolean;
  data?: {
    title: string;
    duration: number;
    thumbnail: string;
    audioUrl: string;
    videoId: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<YouTubeResponse>> {
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
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Không thể trích xuất video ID từ URL' },
        { status: 400 }
      );
    }

    console.log('Fetching YouTube info for:', cleanUrl);

    const videoInfo = await getYouTubeInfo(cleanUrl);

    console.log(`Audio: ${videoInfo.title} (${Math.round(videoInfo.duration / 60)}m)`);

    return NextResponse.json({
      success: true,
      data: videoInfo,
    });
  } catch (error) {
    console.error('YouTube API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Private video') || errorMessage.includes('private')) {
      return NextResponse.json(
        { success: false, error: 'Video riêng tư hoặc không khả dụng' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('Video unavailable') || errorMessage.includes('unavailable')) {
      return NextResponse.json(
        { success: false, error: 'Video không khả dụng. Có thể bị giới hạn khu vực hoặc đã bị xóa.' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('bot')) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin từ YouTube. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
