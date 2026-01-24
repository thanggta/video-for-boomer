import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl, cleanYouTubeUrl, extractVideoId } from '@/lib/youtube/ytdlp';

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

interface OEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
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

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Không thể trích xuất video ID' },
        { status: 400 }
      );
    }

    console.log('Fetching metadata with oEmbed (fast):', videoId);

    // Use YouTube oEmbed API - much faster than yt-dlp
    // No authentication required, no rate limits for basic metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Video không tồn tại hoặc đã bị xóa' },
          { status: 404 }
        );
      }
      throw new Error(`oEmbed request failed: ${response.status}`);
    }

    const oembedData: OEmbedResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        title: oembedData.title || 'Unknown',
        duration: 0, // oEmbed doesn't provide duration, but we don't need it
        thumbnail: oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId: videoId,
      },
    });
  } catch (error) {
    console.error('YouTube Metadata Error:', {
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
      { success: false, error: 'Không thể tải thông tin video. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
