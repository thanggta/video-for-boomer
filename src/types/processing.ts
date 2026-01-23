export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';

export interface ProcessingProgress {
  currentVideoIndex: number;
  totalVideos: number;
  currentVideoProgress: number; // 0-100
  currentOperation: string;
  estimatedTimeRemaining?: number;
}

export interface ProcessingSession {
  sessionId: string;
  timestamp: number;
  currentStep: number;
  videos: string[]; // Array of video IDs
  youtubeUrl?: string;
  currentVideoIndex: number;
  status: ProcessingStatus;
}

export interface ProcessingError {
  type: 'MEMORY_ERROR' | 'FORMAT_ERROR' | 'YOUTUBE_ERROR' | 'PROCESSING_ERROR' | 'BROWSER_ERROR';
  message: string;
  videoId?: string;
  recoverable: boolean;
}
