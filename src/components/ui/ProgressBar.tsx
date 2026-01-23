import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  className = '',
}) => {
  // Ensure progress is a valid number between 0-100
  let clampedProgress = progress;
  if (!isFinite(clampedProgress) || isNaN(clampedProgress)) {
    clampedProgress = 0;
  }
  clampedProgress = Math.min(100, Math.max(0, clampedProgress));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="text-elderly-base font-medium text-grey-dark mb-2 text-center">
          {label}
        </div>
      )}

      <div className="relative">
        <div className="h-10 bg-grey-light rounded-elderly overflow-hidden shadow-inner">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-elderly"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-elderly-xl font-bold text-grey-dark drop-shadow-sm">
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
