import React from 'react';

interface StepContainerProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideNavigation?: boolean;
}

const StepContainer: React.FC<StepContainerProps> = ({
  currentStep,
  totalSteps,
  title,
  children,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Tiếp tục',
  backLabel = 'Quay lại',
  hideNavigation = false,
}) => {
  return (
    <div className="min-h-screen bg-grey-light">
      <div className="bg-primary text-white py-4 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-elderly-base font-medium mb-1">
            Bước {currentStep}/{totalSteps}
          </div>
          <div className="flex gap-1 mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index < currentStep
                    ? 'bg-white'
                    : index === currentStep - 1
                    ? 'bg-white/70'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-elderly-2xl font-bold text-grey-dark mb-6 text-center">
          {title}
        </h1>

        <div className="mb-6">{children}</div>

        {!hideNavigation && (
          <div className="flex gap-3 mt-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 h-touch min-h-[60px] bg-grey-light text-grey-dark border-2 border-grey rounded-elderly font-semibold text-elderly-base shadow-md hover:bg-grey-200 active:scale-95 transition-all"
              >
                {backLabel}
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex-1 h-touch min-h-[60px] bg-primary text-white rounded-elderly font-semibold text-elderly-base shadow-md hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nextLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepContainer;
