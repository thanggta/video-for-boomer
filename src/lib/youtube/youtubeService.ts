import { YouTubeAudioData, YouTubeMetadata } from '@/types/youtube';

export const validateYouTubeUrl = (url: string): boolean => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;
  return regex.test(url);
};

export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#\s]+)/,
    /youtube\.com\/shorts\/([^&\n?#\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Get a CORS-friendly thumbnail URL
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'hq' | 'max' = 'max'): string => {
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    max: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

export const fetchYouTubeMetadata = async (url: string): Promise<YouTubeMetadata> => {
  try {
    const response = await fetch('/api/youtube/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Không thể tải thông tin video');
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Không thể tải thông tin video');
    }

    return {
      title: data.data.title,
      duration: data.data.duration,
      thumbnail: data.data.thumbnail,
      url: url,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    throw error;
  }
};

export const downloadYouTubeAudio = async (
  url: string,
  onProgress?: (progress: number) => void
): Promise<YouTubeAudioData> => {
  try {
    console.log('Downloading audio from YouTube...');

    const audioResponse = await fetch('/api/youtube/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!audioResponse.ok) {
      const errorData = await audioResponse.json();
      throw new Error(errorData.error || 'Không thể tải âm thanh');
    }

    const contentLength = audioResponse.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!audioResponse.body) {
      throw new Error('Không có dữ liệu âm thanh');
    }

    const reader = audioResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && total > 0) {
        onProgress(Math.round((receivedLength / total) * 100));
      }
    }

    const audioData = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      audioData.set(chunk, position);
      position += chunk.length;
    }

    const contentType = audioResponse.headers.get('content-type') || 'audio/webm';
    const audioBlob = new Blob([audioData], { type: contentType });

    console.log('Audio downloaded:', { size: audioBlob.size, type: audioBlob.type });

    // Get duration from download response header (more reliable than metadata endpoint)
    const durationHeader = audioResponse.headers.get('X-Video-Duration');
    const duration = durationHeader ? parseFloat(durationHeader) : 0;

    const metadata = await fetchYouTubeMetadata(url);

    // Override duration with actual value from yt-dlp
    return {
      blob: audioBlob,
      metadata: {
        ...metadata,
        duration: duration || metadata.duration, // Use yt-dlp duration if available
      },
    };
  } catch (error) {
    console.error('Error downloading YouTube audio:', error);
    throw error;
  }
};

export const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = extractVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export const formatYouTubeDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
