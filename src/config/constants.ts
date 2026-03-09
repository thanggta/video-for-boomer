// File size and duration limits (iOS Safari tested limits)
export const MAX_FILE_SIZE = 600 * 1024 * 1024; // 600MB in bytes
export const MAX_DURATION = 10 * 60; // 10 minutes in seconds (realistic mobile processing)
export const MAX_VIDEOS = 20; // Maximum number of videos per session (memory management)

// Audio settings
export const AUDIO_BITRATE = '128k'; // MP3 bitrate for YouTube audio
export const AUDIO_FORMAT = 'mp3';

// Video settings
export const SUPPORTED_VIDEO_FORMATS = ['video/quicktime', 'video/mov', 'video/mp4'];
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_DURATION = 3; // 3 seconds per image
export const VIDEO_THUMBNAIL_TIME = 1; // Generate thumbnail at 1 second

// Processing settings (simplified - no IndexedDB)
// All state managed in-memory via Zustand for simplicity
export const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes max processing time

// YouTube settings
export const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
