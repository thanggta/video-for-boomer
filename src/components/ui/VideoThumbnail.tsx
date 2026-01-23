import React from 'react';
import { VideoItem } from '@/types/video';

interface VideoThumbnailProps {
  video: VideoItem;
  showOrder?: boolean;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  video,
  showOrder = false,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-elderly shadow-elderly p-2 sm:p-4 border-2 border-grey-light">
      <div className="flex items-center gap-2 sm:gap-4">
        {showOrder && (
          <div className="flex-shrink-0">
            <span className="text-elderly-lg sm:text-elderly-2xl font-bold text-primary">
              {video.order}.
            </span>
          </div>
        )}

        <div className="relative flex-shrink-0">
          <img
            src={video.thumbnail}
            alt={video.fileName}
            className="w-20 h-20 sm:w-[150px] sm:h-[150px] object-cover rounded-lg"
          />
          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black bg-opacity-75 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm font-semibold">
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-elderly-base font-semibold text-grey-dark truncate">
            {video.fileName}
          </h3>
          <p className="text-xs sm:text-elderly-sm text-grey">
            {formatFileSize(video.fileSize)}
          </p>
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-danger text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Xóa video"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        {(onMoveUp || onMoveDown) && (
          <div className="flex-shrink-0 flex flex-col gap-1 sm:gap-2">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="w-10 h-10 sm:w-[60px] sm:h-[60px] bg-primary text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center"
                aria-label="Di chuyển lên"
              >
                <svg
                  className="w-5 h-5 sm:w-8 sm:h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="w-10 h-10 sm:w-[60px] sm:h-[60px] bg-primary text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center"
                aria-label="Di chuyển xuống"
              >
                <svg
                  className="w-5 h-5 sm:w-8 sm:h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoThumbnail;
