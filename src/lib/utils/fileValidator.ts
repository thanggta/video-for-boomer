import { ValidationResult, VideoMetadata } from '@/types/video';
import { MAX_FILE_SIZE, MAX_DURATION, SUPPORTED_VIDEO_FORMATS, SUPPORTED_IMAGE_FORMATS, IMAGE_DURATION } from '@/config/constants';
import { t } from './i18n';

export const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|webp)$/i.test(fileName);
};

export const validateVideoFile = async (file: File): Promise<ValidationResult> => {
  const fileName = file.name.toLowerCase();

  const isSupported = SUPPORTED_VIDEO_FORMATS.includes(file.type) ||
                      SUPPORTED_IMAGE_FORMATS.includes(file.type) ||
                      isImageFile(fileName) ||
                      fileName.endsWith('.mov') || fileName.endsWith('.mp4');

  if (!isSupported) {
    return {
      valid: false,
      error: t('errors.FORMAT_ERROR'),
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: t('errors.FILE_TOO_LARGE'),
    };
  }

  try {
    const isImage = file.type.startsWith('image/') || isImageFile(fileName);
    let metadata: VideoMetadata;

    if (isImage) {
      metadata = await extractImageMetadata(file);
    } else {
      metadata = await extractVideoMetadata(file);
    }

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

export const extractImageMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Clean up
      URL.revokeObjectURL(img.src);

      resolve({
        duration: IMAGE_DURATION,
        width: img.width,
        height: img.height,
        size: file.size,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image metadata'));
    };

    img.src = URL.createObjectURL(file);
  });
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
