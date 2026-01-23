'use client';

import React from 'react';
import { StepContainer, VideoThumbnail } from '@/components/ui';
import useVideoStore from '@/store/videoStore';
import { t } from '@/lib/utils/i18n';

const Step2ReorderVideos: React.FC = () => {
  const { videos, previousStep, nextStep, moveVideoUp, moveVideoDown, removeVideo } = useVideoStore();

  const handleMoveUp = (id: string) => {
    moveVideoUp(id);
  };

  const handleMoveDown = (id: string) => {
    moveVideoDown(id);
  };

  const handleRemove = (id: string) => {
    removeVideo(id);
  };

  // Empty state
  if (videos.length === 0) {
    return (
      <StepContainer
        currentStep={2}
        totalSteps={5}
        title={t('reorder.title')}
        onBack={previousStep}
        onNext={nextStep}
        backLabel={t('common.back')}
        nextLabel={t('common.continue')}
        nextDisabled={true}
      >
        <div className="bg-white rounded-elderly shadow-elderly p-8 text-center">
          <p className="text-elderly-base text-grey-dark">
            Chưa có video nào. Vui lòng quay lại bước trước để tải video lên.
          </p>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      currentStep={2}
      totalSteps={5}
      title={t('reorder.title')}
      onBack={previousStep}
      onNext={nextStep}
      backLabel={t('common.back')}
      nextLabel={t('common.continue')}
    >
      <div className="bg-white rounded-elderly shadow-elderly p-8">
        {/* Instruction text */}
        <div className="mb-6 text-center">
          <p className="text-elderly-base text-grey-dark">
            Bạn có <span className="font-semibold text-primary">{videos.length} video</span>
          </p>
          <p className="text-elderly-sm text-grey mt-2">
            Sử dụng nút Lên/Xuống để sắp xếp thứ tự video
          </p>
        </div>

        {/* Video list */}
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="transition-all duration-200 ease-in-out"
            >
              <VideoThumbnail
                video={video}
                showOrder={true}
                onMoveUp={index > 0 ? () => handleMoveUp(video.id) : undefined}
                onMoveDown={index < videos.length - 1 ? () => handleMoveDown(video.id) : undefined}
                onRemove={() => handleRemove(video.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </StepContainer>
  );
};

export default Step2ReorderVideos;
