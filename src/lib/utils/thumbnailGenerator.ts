import { VIDEO_THUMBNAIL_TIME } from '@/config/constants';

export const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      reject(new Error('Canvas context not supported'));
      return;
    }

    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      // Set video to the thumbnail time (default: 1 second)
      video.currentTime = Math.min(VIDEO_THUMBNAIL_TIME, video.duration);
    };

    video.onseeked = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Clean up
      URL.revokeObjectURL(video.src);

      resolve(thumbnailUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };

    video.src = URL.createObjectURL(file);
  });
};

export const generateMultipleThumbnails = async (files: File[]): Promise<string[]> => {
  const thumbnailPromises = files.map((file) => generateVideoThumbnail(file));
  return Promise.all(thumbnailPromises);
};
