'use client';

import React from 'react';
import useVideoStore from '@/store/videoStore';
import Step1UploadVideos from '@/components/steps/Step1UploadVideos';
import Step2ReorderVideos from '@/components/steps/Step2ReorderVideos';
import Step3InputYouTube from '@/components/steps/Step3InputYouTube';
import Step4Processing from '@/components/steps/Step4Processing';
import Step5Download from '@/components/steps/Step5Download';

export default function Home() {
  const currentStep = useVideoStore((state) => state.currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UploadVideos />;
      case 2:
        return <Step2ReorderVideos />;
      case 3:
        return <Step3InputYouTube />;
      case 4:
        return <Step4Processing />;
      case 5:
        return <Step5Download />;
      default:
        return <Step1UploadVideos />;
    }
  };

  return <main className="min-h-screen">{renderStep()}</main>;
}
