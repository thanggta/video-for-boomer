import { YouTubeAudioData, YouTubeMetadata } from '@/types/youtube';

export interface YouTubeAPIResponse {
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
    const response = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data: YouTubeAPIResponse = await response.json();

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
    // First, get metadata
    const metadataResponse = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const metadataData: YouTubeAPIResponse = await metadataResponse.json();

    if (!metadataData.success || !metadataData.data) {
      throw new Error(metadataData.error || 'Không thể tải thông tin video');
    }

    const metadata = metadataData.data;

    console.log('Metadata fetched, downloading audio...');

    // Try to download through proxy first (pass audioUrl for faster proxy download)
    try {
      const audioResponse = await fetch('/api/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, audioUrl: metadata.audioUrl }),
      });

      if (audioResponse.ok) {
        // Track download progress
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
            const progress = (receivedLength / total) * 100;
            onProgress(Math.round(progress));
          }
        }

        console.log('Audio downloaded, total size:', receivedLength);

        // Combine chunks into a single Uint8Array
        const audioData = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          audioData.set(chunk, position);
          position += chunk.length;
        }

        // Detect mime type from content-type header
        const contentType = audioResponse.headers.get('content-type') || 'audio/webm';

        // Create blob from audio data
        const audioBlob = new Blob([audioData], { type: contentType });

        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
        });

        return {
          blob: audioBlob,
          metadata: {
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            url: url,
          },
        };
      }
    } catch (proxyError) {
      console.warn('Proxy download failed, trying direct download:', proxyError);
    }

    // Fallback: Try direct download from audioUrl
    console.log('Attempting direct download from audioUrl...');

    if (!metadata.audioUrl) {
      throw new Error('Không có URL âm thanh khả dụng');
    }

    const directResponse = await fetch(metadata.audioUrl);

    if (!directResponse.ok) {
      throw new Error('YouTube hiện đang chặn tải xuống tự động. Vui lòng thử lại sau hoặc sử dụng link khác.');
    }

    const contentLength = directResponse.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!directResponse.body) {
      throw new Error('Không có dữ liệu âm thanh');
    }

    const reader = directResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && total > 0) {
        const progress = (receivedLength / total) * 100;
        onProgress(Math.round(progress));
      }
    }

    const audioData = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      audioData.set(chunk, position);
      position += chunk.length;
    }

    const audioBlob = new Blob([audioData], { type: 'audio/webm' });

    return {
      blob: audioBlob,
      metadata: {
        title: metadata.title,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        url: url,
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
