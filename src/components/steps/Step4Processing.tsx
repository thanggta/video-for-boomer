'use client';

import React, { useEffect, useState, useRef } from 'react';
import { StepContainer, ProgressBar, ErrorMessage } from '@/components/ui';
import useVideoStore from '@/store/videoStore';
import { t } from '@/lib/utils/i18n';
import { loadFFmpeg, supportsSharedArrayBuffer } from '@/lib/ffmpeg/ffmpegService';
import { processVideos, estimateProcessingTime } from '@/lib/ffmpeg/videoProcessor';
import type { ProcessingProgress, ProcessedVideo } from '@/lib/ffmpeg/videoProcessor';

interface ProcessingState {
  stage: 'loading' | 'processing' | 'complete' | 'error';
  loadingProgress: number;
  processingProgress: ProcessingProgress | null;
  currentOperation: string;
  error: string | null;
  processedVideos: ProcessedVideo[];
}

const Step4Processing: React.FC = () => {
  const { videos, youtubeAudio, nextStep, setProcessingStatus, setProcessedVideos } = useVideoStore();
  const [state, setState] = useState<ProcessingState>({
    stage: 'loading',
    loadingProgress: 0,
    processingProgress: null,
    currentOperation: 'Đang khởi động...',
    error: null,
    processedVideos: [],
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const hasStartedRef = useRef(false);

  // Keep screen awake during processing
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activated');
        }
      } catch (err) {
        console.warn('Wake Lock not supported or failed:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        console.log('Wake Lock released');
      }
    };
  }, []);

  // Warn user before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.stage === 'loading' || state.stage === 'processing') {
        e.preventDefault();
        e.returnValue = 'Đang xử lý video, bạn có chắc muốn thoát?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.stage]);

  // Detect when tab is backgrounded (iOS issue)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (state.stage === 'loading' || state.stage === 'processing')) {
        console.warn('Tab backgrounded during processing - may pause on iOS');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.stage]);

  // Start processing
  useEffect(() => {
    if (hasStartedRef.current) return;
    if (!videos.length || !youtubeAudio) return;

    hasStartedRef.current = true;

    const startProcessing = async () => {
      try {
        // Stage 1: Load FFmpeg
        setState((prev) => ({
          ...prev,
          stage: 'loading',
          currentOperation: 'Đang tải công cụ xử lý...',
        }));

        await loadFFmpeg((progress) => {
          // Validate progress value
          const validProgress = isFinite(progress) && !isNaN(progress)
            ? Math.max(0, Math.min(100, Math.round(progress)))
            : 0;

          setState((prev) => ({
            ...prev,
            loadingProgress: validProgress,
            currentOperation: `Đang tải công cụ xử lý... ${validProgress}%`,
          }));
        });

        console.log('FFmpeg loaded successfully');
        console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer());

        // Stage 2: Process videos
        setState((prev) => ({
          ...prev,
          stage: 'processing',
          currentOperation: 'Bắt đầu xử lý video...',
        }));

        setProcessingStatus('processing');

        const result = await processVideos(videos, youtubeAudio, (progress) => {
          setState((prev) => ({
            ...prev,
            processingProgress: progress,
            currentOperation: progress.currentOperation,
          }));
        });

        if (result.success) {
          // All videos processed successfully
          setState((prev) => ({
            ...prev,
            stage: 'complete',
            processedVideos: result.processedVideos,
            currentOperation: 'Hoàn thành!',
          }));

          setProcessingStatus('complete');

          // Store processed videos in Zustand store
          setProcessedVideos(result.processedVideos);

          // Move to download step after a brief delay
          setTimeout(() => {
            nextStep();
          }, 1500);
        } else {
          // Some videos failed
          const errorMessage = result.errors.length === videos.length
            ? 'Tất cả video đều xử lý thất bại'
            : `${result.errors.length}/${videos.length} video xử lý thất bại`;

          setState((prev) => ({
            ...prev,
            stage: 'error',
            error: errorMessage,
            processedVideos: result.processedVideos,
          }));

          setProcessingStatus('error');
        }
      } catch (error) {
        console.error('Processing error:', error);

        let errorMessage = 'Lỗi không xác định';
        if (error instanceof Error) {
          if (error.message.includes('memory')) {
            errorMessage = 'Không đủ bộ nhớ. Vui lòng thử video nhỏ hơn.';
          } else if (error.message.includes('FFmpeg')) {
            errorMessage = 'Lỗi tải công cụ xử lý. Vui lòng thử lại.';
          } else {
            errorMessage = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: errorMessage,
        }));

        setProcessingStatus('error');
      }
    };

    startProcessing();
  }, [videos, youtubeAudio, nextStep, setProcessingStatus]);

  const handleRetry = () => {
    hasStartedRef.current = false;
    setState({
      stage: 'loading',
      loadingProgress: 0,
      processingProgress: null,
      currentOperation: 'Đang khởi động...',
      error: null,
      processedVideos: [],
    });
  };

  const estimatedTime = estimateProcessingTime(videos);

  // Calculate overall progress
  let overallProgress = 0;
  if (state.stage === 'loading') {
    overallProgress = state.loadingProgress * 0.2; // Loading is 20% of total
  } else if (state.stage === 'processing' && state.processingProgress) {
    // Now we process as one single operation (concatenate + audio)
    overallProgress = 20 + state.processingProgress.progress * 0.8; // Processing is 80%
  } else if (state.stage === 'complete') {
    overallProgress = 100;
  }

  // Clamp progress to valid range (0-100)
  overallProgress = Math.max(0, Math.min(100, overallProgress));
  if (!isFinite(overallProgress) || isNaN(overallProgress)) {
    overallProgress = 0;
  }

  return (
    <StepContainer
      currentStep={4}
      totalSteps={5}
      title={t('processing.title')}
      hideNavigation={true}
    >
      <div className="bg-white rounded-elderly shadow-elderly p-8">
        {/* Error State */}
        {state.stage === 'error' && (
          <ErrorMessage
            message={state.error || 'Có lỗi xảy ra'}
            onRetry={handleRetry}
          />
        )}

        {/* Processing States */}
        {(state.stage === 'loading' || state.stage === 'processing' || state.stage === 'complete') && (
          <>
            {/* Spinner */}
            <div className="flex justify-center mb-8">
              <svg
                className={`h-16 w-16 text-primary ${state.stage === 'complete' ? '' : 'animate-spin'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                {state.stage === 'complete' ? (
                  <path
                    fill="currentColor"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              progress={overallProgress}
              label={state.currentOperation}
              showPercentage={true}
            />

            {/* Estimated Time (only during processing) */}
            {state.stage === 'processing' && estimatedTime > 0 && (
              <p className="text-elderly-sm text-center text-grey mt-2">
                Thời gian ước tính: ~{estimatedTime} giây
              </p>
            )}

            {/* iOS Warning */}
            <div className="mt-8 p-6 bg-red-50 border-2 border-danger rounded-elderly">
              <p className="text-elderly-lg text-center text-danger font-bold mb-2">
                ⚠️ ĐỪNG CHUYỂN SANG APP KHÁC
              </p>
              <p className="text-elderly-base text-center text-danger font-semibold">
                {t('processing.doNotClose')}
              </p>
              <p className="text-elderly-base text-center text-danger font-semibold">
                ĐỪNG TẮT MÀN HÌNH
              </p>
            </div>
          </>
        )}
      </div>
    </StepContainer>
  );
};

export default Step4Processing;
