'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { StepContainer, LargeButton, ErrorMessage, VideoThumbnail } from '@/components/ui';
import useVideoStore from '@/store/videoStore';
import { t } from '@/lib/utils/i18n';
import { validateVideoFile } from '@/lib/utils/fileValidator';
import { generateVideoThumbnail } from '@/lib/utils/thumbnailGenerator';
import { VideoItem } from '@/types/video';
import { MAX_VIDEOS } from '@/config/constants';

const Step1UploadVideos: React.FC = () => {
  const { videos, addVideo, removeVideo, nextStep } = useVideoStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);

    try {
      for (const file of files) {
        // Check if we've reached the max videos limit
        if (videos.length >= MAX_VIDEOS) {
          setError(`Chỉ có thể tải tối đa ${MAX_VIDEOS} video`);
          break;
        }

        // Validate file
        const validation = await validateVideoFile(file);
        if (!validation.valid) {
          setError(validation.error || t('errors.INVALID_FORMAT'));
          continue;
        }

        // Generate thumbnail
        const thumbnail = await generateVideoThumbnail(file);

        // Create video item
        const videoItem: VideoItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          fileName: file.name,
          fileSize: file.size,
          duration: validation.metadata?.duration || 0,
          thumbnail,
          order: videos.length + 1,
        };

        addVideo(videoItem);
      }
    } catch (err) {
      setError(t('errors.PROCESSING_ERROR', { fileName: 'video' }));
      console.error('Error processing files:', err);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept: {
      'video/quicktime': ['.mov'],
      'video/mp4': ['.mp4'], // Also accept MP4 for broader compatibility
    },
    multiple: true,
    disabled: uploading || videos.length >= MAX_VIDEOS,
  });

  const handleRemove = (id: string) => {
    removeVideo(id);
    setError(null);
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <StepContainer
      currentStep={1}
      totalSteps={5}
      title={t('upload.title')}
      onNext={videos.length > 0 ? handleContinue : undefined}
      nextDisabled={videos.length === 0 || uploading}
      hideNavigation={false}
    >
      <div
        {...getRootProps()}
        className={`bg-white rounded-elderly shadow-elderly p-8 text-center border-2 border-dashed transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary bg-blue-50'
            : uploading || videos.length >= MAX_VIDEOS
            ? 'border-grey bg-grey-light cursor-not-allowed'
            : 'border-grey hover:border-primary hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />

        <div className="mb-6">
          <svg
            className={`w-20 h-20 mx-auto ${
              uploading ? 'text-grey animate-pulse' : 'text-primary'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {uploading ? (
          <>
            <h2 className="text-elderly-lg font-semibold text-grey-dark mb-4">
              {t('upload.processing')}
            </h2>
            <p className="text-elderly-base text-grey">Vui lòng đợi...</p>
          </>
        ) : videos.length >= MAX_VIDEOS ? (
          <>
            <h2 className="text-elderly-lg font-semibold text-grey-dark mb-4">
              Đã đạt giới hạn {MAX_VIDEOS} video
            </h2>
            <p className="text-elderly-base text-grey">
              Xóa bớt video nếu muốn tải thêm
            </p>
          </>
        ) : (
          <>
            <h2 className="text-elderly-lg font-semibold text-grey-dark mb-4">
              {isDragActive ? 'Thả video vào đây' : t('upload.dragDrop')}
            </h2>
            <p className="text-elderly-base text-grey mb-2">{t('upload.maxSize')}</p>
            <p className="text-elderly-base text-grey mb-2">{t('upload.maxDuration')}</p>
            <p className="text-elderly-base text-grey mb-4">{t('upload.supported')}</p>

            <div className="mt-8">
              <LargeButton onClick={() => {}} variant="primary">
                {t('upload.chooseVideos')}
              </LargeButton>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={() => setError(null)} showIcon={true} />
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-elderly-lg font-semibold text-grey-dark">
              Đã chọn {videos.length} video
            </h3>
            {videos.length < MAX_VIDEOS && (
              <p className="text-elderly-sm text-grey">
                Có thể chọn thêm {MAX_VIDEOS - videos.length} video
              </p>
            )}
          </div>

          <div className="space-y-4">
            {videos.map((video) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                showOrder={true}
                onRemove={() => handleRemove(video.id)}
              />
            ))}
          </div>
        </div>
      )}
    </StepContainer>
  );
};

export default Step1UploadVideos;
