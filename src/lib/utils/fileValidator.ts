import { ValidationResult, VideoMetadata } from '@/types/video';
import { MAX_FILE_SIZE, MAX_DURATION, SUPPORTED_VIDEO_FORMATS } from '@/config/constants';
import { t } from './i18n';

export const validateVideoFile = async (file: File): Promise<ValidationResult> => {
  // Check file format
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileName.endsWith('.mov') || fileName.endsWith('.mp4');

  if (!SUPPORTED_VIDEO_FORMATS.includes(file.type) && !hasValidExtension) {
    return {
      valid: false,
      error: t('errors.FORMAT_ERROR'),
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: t('errors.FILE_TOO_LARGE'),
    };
  }

  // Extract video metadata
  try {
    const metadata = await extractVideoMetadata(file);

    // Check duration
    if (metadata.duration > MAX_DURATION) {
      return {
        valid: false,
        error: t('errors.DURATION_TOO_LONG'),
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      error: t('errors.INVALID_FORMAT'),
    };
  }
};

export const extractVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Clean up
      URL.revokeObjectURL(video.src);

      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
