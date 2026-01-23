'use client';

import React, { useState } from 'react';
import { StepContainer, LargeButton, ProgressBar } from '@/components/ui';
import useVideoStore from '@/store/videoStore';
import { t } from '@/lib/utils/i18n';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Step5Download: React.FC = () => {
  const { processedVideos, reset } = useVideoStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadSingle = (video: typeof processedVideos[0]) => {
    try {
      const url = URL.createObjectURL(video.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = video.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Lỗi tải xuống video. Vui lòng thử lại.');
    }
  };

  const handleDownloadAll = async () => {
    if (processedVideos.length === 0) return;

    // If only one video, download directly
    if (processedVideos.length === 1) {
      handleDownloadSingle(processedVideos[0]);
      return;
    }

    // Multiple videos - create ZIP
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();

      // Add each video to the ZIP
      processedVideos.forEach((video, index) => {
        zip.file(video.fileName, video.blob);
        const progress = ((index + 1) / processedVideos.length) * 50;
        setDownloadProgress(Math.round(progress));
      });

      setDownloadProgress(60);

      // Generate ZIP file
      const zipBlob = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          const progress = 60 + (metadata.percent * 0.4);
          setDownloadProgress(Math.round(progress));
        }
      );

      setDownloadProgress(100);

      // Download ZIP
      saveAs(zipBlob, `ghep_video_${Date.now()}.zip`);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Lỗi tạo file ZIP. Vui lòng thử tải từng video.');
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleStartOver = () => {
    if (confirm('Bạn có chắc muốn bắt đầu lại? Các video đã xử lý sẽ bị xóa.')) {
      reset();
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (processedVideos.length === 0) {
    return (
      <StepContainer
        currentStep={5}
        totalSteps={5}
        title={t('download.title')}
        hideNavigation={true}
      >
        <div className="bg-white rounded-elderly shadow-elderly p-8 text-center">
          <p className="text-elderly-base text-grey-dark">
            Không có video nào để tải xuống. Vui lòng quay lại bước trước.
          </p>
          <div className="mt-6">
            <LargeButton onClick={handleStartOver} variant="secondary">
              {t('download.startOver')}
            </LargeButton>
          </div>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      currentStep={5}
      totalSteps={5}
      title={t('download.title')}
      hideNavigation={true}
    >
      <div className="bg-white rounded-elderly shadow-elderly p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <svg
              className="w-20 h-20 mx-auto text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-elderly-2xl font-bold text-success mb-2">
            ✓ {t('download.complete', { count: String(processedVideos.length) })}
          </h2>

          <p className="text-elderly-base text-grey-dark">
            Video đã được ghép và sẵn sàng tải xuống
          </p>
        </div>

        {/* Video List */}
        <div className="space-y-4 mb-8">
          {processedVideos.map((video, index) => (
            <div
              key={video.id}
              className="bg-grey-light rounded-elderly p-4 flex items-center gap-4"
            >
              <div className="flex-shrink-0 text-elderly-xl font-bold text-primary">
                {index + 1}.
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-elderly-base font-semibold text-grey-dark truncate">
                  {video.fileName}
                </h3>
                <p className="text-elderly-sm text-grey">
                  {formatFileSize(video.blob.size)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => handleDownloadSingle(video)}
                  className="h-12 px-6 bg-primary text-white rounded-elderly font-medium text-elderly-sm hover:bg-primary-dark active:scale-95 transition-all"
                >
                  {t('download.individual')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-6">
            <ProgressBar
              progress={downloadProgress}
              label="Đang tạo file ZIP..."
              showPercentage
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <LargeButton
            onClick={handleDownloadAll}
            variant="primary"
            disabled={isDownloading}
            loading={isDownloading}
          >
            {processedVideos.length === 1
              ? t('download.individual')
              : `${t('download.downloadAll')} (${processedVideos.length} video)`}
          </LargeButton>

          <LargeButton onClick={handleStartOver} variant="secondary">
            {t('download.startOver')}
          </LargeButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step5Download;
