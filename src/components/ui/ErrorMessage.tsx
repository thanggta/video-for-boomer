import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onSkip?: () => void;
  retryText?: string;
  skipText?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onSkip,
  retryText = 'Thử lại',
  skipText = 'Bỏ qua',
  showIcon = true,
}) => {
  return (
    <div className="bg-red-50 border-2 border-danger rounded-elderly p-6 shadow-elderly">
      <div className="flex items-start gap-4">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-elderly-lg font-semibold text-danger mb-2">
            Lỗi
          </h3>
          <p className="text-elderly-base text-grey-dark leading-relaxed">
            {message}
          </p>

          {(onRetry || onSkip) && (
            <div className="flex gap-3 mt-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 h-touch min-h-[60px] bg-danger text-white rounded-elderly font-semibold text-elderly-base shadow-md hover:bg-red-700 active:scale-95 transition-all"
                >
                  {retryText}
                </button>
              )}
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="flex-1 h-touch min-h-[60px] bg-grey-light text-grey-dark border-2 border-grey rounded-elderly font-semibold text-elderly-base shadow-md hover:bg-grey-200 active:scale-95 transition-all"
                >
                  {skipText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
