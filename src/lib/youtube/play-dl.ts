import * as play from 'play-dl';

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  audioUrl: string;
  videoId: string;
}

export async function getYouTubeInfo(url: string): Promise<VideoInfo> {
  const info = await play.video_info(url);

  if (!info) {
    throw new Error('Failed to fetch video info');
  }

  const videoDetails = info.video_details;

  const audioFormats = info.format
    .filter(f => !f.width && !f.height && f.audioQuality && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  if (audioFormats.length === 0) {
    throw new Error('No audio format available');
  }

  const bestAudio = audioFormats[0];
  console.log(`Selected audio: ${bestAudio.mimeType} @ ${Math.round(bestAudio.bitrate! / 1000)}kbps`);

  return {
    title: videoDetails.title || 'Unknown',
    duration: videoDetails.durationInSec,
    thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
    audioUrl: bestAudio.url!,
    videoId: videoDetails.id!,
  };
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#\s]+)/,
    /youtube\.com\/shorts\/([^&\n?#\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export function cleanYouTubeUrl(url: string): string {
  return url.split('&list=')[0].split('?list=')[0];
}
