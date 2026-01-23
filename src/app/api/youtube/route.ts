import { NextRequest, NextResponse } from 'next/server';
import { executeYtdlp, extractVideoId, isValidYouTubeUrl, cleanYouTubeUrl } from '@/lib/youtube/ytdlp';

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

    const videoInfo = await executeYtdlp(cleanUrl, {
      dumpSingleJson: true,
      preferFreeFormats: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    console.log('Video info retrieved:', {
      title: videoInfo.title,
      duration: videoInfo.duration,
      formats: videoInfo.formats?.length || 0,
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

    console.log('Selected audio format:', {
      ext: audioFormat.ext,
      abr: audioFormat.abr,
      hasUrl: !!audioFormat.url,
    });

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return NextResponse.json({
      success: true,
      data: {
        title: videoInfo.title || 'Unknown',
        duration: Math.round(videoInfo.duration || 0),
        thumbnail: thumbnail,
        audioUrl: audioFormat.url,
        videoId: videoId,
      },
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

    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Không thể tải thông tin từ YouTube. Vui lòng thử lại.` },
      { status: 500 }
    );
  }
}
