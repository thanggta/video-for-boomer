export interface YouTubeMetadata {
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  url: string;
}

export interface YouTubeAudioData {
  blob: Blob;
  metadata: YouTubeMetadata;
}

export interface YouTubeValidation {
  valid: boolean;
  url?: string;
  videoId?: string;
  error?: string;
}
