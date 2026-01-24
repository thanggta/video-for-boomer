'use client';

import React, { useState, useEffect } from 'react';
import { StepContainer, LargeButton, ProgressBar, ErrorMessage } from '@/components/ui';
import useVideoStore from '@/store/videoStore';
import { t } from '@/lib/utils/i18n';
import {
  validateYouTubeUrl,
  fetchYouTubeMetadata,
  downloadYouTubeAudio,
  getYouTubeEmbedUrl,
  formatYouTubeDuration,
} from '@/lib/youtube/youtubeService';
import { YouTubeMetadata } from '@/types/youtube';

const Step3InputYouTube: React.FC = () => {
  const { previousStep, nextStep, youtubeAudio, setYoutubeAudio, videos } = useVideoStore();
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Calculate total video duration
  const totalVideoDuration = videos.reduce((sum, video) => sum + video.duration, 0);

  // Validate URL on change
  useEffect(() => {
    if (url.trim()) {
      const valid = validateYouTubeUrl(url.trim());
      setIsValidUrl(valid);
      if (!valid) {
        setMetadata(null);
      }
    } else {
      setIsValidUrl(false);
      setMetadata(null);
    }
  }, [url]);

  // Warn user before leaving page during download
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDownloading) {
        e.preventDefault();
        e.returnValue = 'Đang tải âm thanh từ YouTube, bạn có chắc muốn thoát?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDownloading]);

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) {
        setError('Trình duyệt không hỗ trợ tính năng dán. Vui lòng dán thủ công (long-press vào ô nhập liệu).');
        return;
      }

      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Không thể đọc clipboard. Vui lòng cấp quyền hoặc dán thủ công (long-press vào ô nhập liệu).');
    }
  };

  const handlePreview = async () => {
    if (!isValidUrl || !url.trim()) return;

    setIsLoadingMetadata(true);
    setError(null);

    try {
      const data = await fetchYouTubeMetadata(url.trim());
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin video');
      setMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleDownload = async () => {
    if (!isValidUrl || !url.trim()) return;

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const audioData = await downloadYouTubeAudio(url.trim(), (progress) => {
        setDownloadProgress(progress);
      });

      setYoutubeAudio(audioData);
      setDownloadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải âm thanh từ YouTube');
      setDownloadProgress(0);
    } finally {
      setIsDownloading(false);
    }
  };

  const embedUrl = metadata ? getYouTubeEmbedUrl(url) : null;

  return (
    <StepContainer
      currentStep={3}
      totalSteps={5}
      title={t('youtube.title')}
      onBack={previousStep}
      onNext={youtubeAudio ? nextStep : undefined}
      nextDisabled={!youtubeAudio}
      backLabel={t('common.back')}
      nextLabel={t('common.continue')}
    >
      <div className="bg-white rounded-elderly shadow-elderly p-8">
        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-elderly-base font-semibold text-grey-dark mb-2">
            Link YouTube:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('youtube.placeholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-touch text-elderly-base px-4 border-2 border-grey rounded-elderly focus:border-primary focus:outline-none min-w-0"
              autoFocus
            />
            <button
              onClick={handlePaste}
              className="w-[60px] h-touch bg-grey-light text-grey-dark rounded-elderly font-semibold text-elderly-base hover:bg-grey active:scale-95 transition-all flex-shrink-0"
            >
              {t('youtube.paste')}
            </button>
          </div>
          {url && !isValidUrl && (
            <p className="mt-2 text-elderly-sm text-danger">{t('youtube.invalidUrl')}</p>
          )}
        </div>

        {/* Preview Button */}
        {isValidUrl && !metadata && !youtubeAudio && (
          <div className="mb-4">
            <LargeButton
              onClick={handlePreview}
              variant="primary"
              disabled={isLoadingMetadata}
              loading={isLoadingMetadata}
            >
              {isLoadingMetadata ? t('common.loading') : t('youtube.preview')}
            </LargeButton>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              message={error}
              onRetry={() => {
                setError(null);
                handlePreview();
              }}
            />
          </div>
        )}

        {/* YouTube Preview */}
        {metadata && embedUrl && !youtubeAudio && (
          <div className="mb-6">
            <div className="aspect-video mb-4 rounded-elderly overflow-hidden bg-grey-light">
              <iframe
                src={embedUrl}
                title={metadata.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <h3 className="text-elderly-lg font-bold text-grey-dark mb-2">
              {metadata.title}
            </h3>
            <p className="text-elderly-base text-grey mb-2">
              Video từ YouTube
            </p>

            {/* Download Button */}
            <LargeButton
              onClick={handleDownload}
              variant="primary"
              disabled={isDownloading}
              loading={isDownloading}
            >
              {isDownloading ? t('youtube.downloading') : t('youtube.download')}
            </LargeButton>

            {/* Download Progress */}
            {isDownloading && downloadProgress > 0 && (
              <>
                <div className="mt-4">
                  <ProgressBar progress={downloadProgress} showPercentage />
                </div>

                {/* Warning Message */}
                <div className="mt-4 p-6 bg-red-50 border-2 border-danger rounded-elderly">
                  <p className="text-elderly-lg text-center text-danger font-bold mb-2">
                    ⚠️ ĐỪNG RỜI KHỎI TRANG NÀY
                  </p>
                  <p className="text-elderly-base text-center text-danger font-semibold">
                    Đang tải âm thanh từ YouTube
                  </p>
                  <p className="text-elderly-base text-center text-danger font-semibold">
                    ĐỪNG TẮT MÀN HÌNH
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Success State */}
        {youtubeAudio && (
          <div className="p-6 bg-green-50 border-2 border-success rounded-elderly">
            <div className="flex items-center gap-3 mb-3">
              <svg
                className="w-8 h-8 text-success flex-shrink-0"
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
              <div>
                <h3 className="text-elderly-lg font-bold text-grey-dark">
                  {youtubeAudio.metadata.title}
                </h3>
              </div>
            </div>
            <p className="text-elderly-sm text-success font-semibold">
              ✓ Âm thanh đã sẵn sàng! Nhấn &ldquo;Tiếp tục&rdquo; để xử lý video.
            </p>
          </div>
        )}
      </div>
    </StepContainer>
  );
};

export default Step3InputYouTube;
