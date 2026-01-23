import React from 'react';

interface LargeButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const LargeButton: React.FC<LargeButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  type = 'button',
}) => {
  const baseStyles = 'h-touch min-h-[60px] text-elderly-base font-semibold rounded-elderly shadow-elderly transition-all duration-200 flex items-center justify-center gap-3 tracking-relaxed disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const widthStyles = fullWidth ? 'w-full' : 'px-8';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
    secondary: 'bg-grey-light text-grey-dark border-2 border-grey hover:bg-grey-200 active:bg-grey-300',
    danger: 'bg-danger text-white hover:bg-red-700 active:bg-red-800',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${widthStyles} ${variantStyles[variant]}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          </svg>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default LargeButton;
