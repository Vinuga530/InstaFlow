import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'sm',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71806C]/30 dark:focus-visible:ring-[#899783]/30';

  const sizeStyles = {
    xs: 'text-[11px] px-3 py-1 gap-1.5 min-h-[30px]',
    sm: 'text-xs px-3.5 py-1.5 gap-2 min-h-[36px]',
    md: 'text-xs px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[#71806C] hover:bg-[#606E5B] dark:bg-[#899783] dark:hover:bg-[#98A792] text-[#F5F3EC] dark:text-[#151716] shadow-subtle font-medium',
    gradient:
      'bg-[#71806C] hover:bg-[#606E5B] dark:bg-[#899783] dark:hover:bg-[#98A792] text-[#F5F3EC] dark:text-[#151716] shadow-subtle font-medium',
    secondary:
      'bg-[#EAE8DF] dark:bg-[#202421] hover:bg-[#E2DFD6] dark:hover:bg-[#272C28] text-[#242823] dark:text-[#F0EEE6] border border-[#D5D2C5] dark:border-[#343B35] shadow-subtle',
    ghost:
      'hover:bg-[#E2DFD6]/60 dark:hover:bg-[#272C28]/60 text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6]',
    danger:
      'bg-[#A33F31]/10 hover:bg-[#A33F31]/15 active:bg-[#A33F31]/20 text-[#A33F31] dark:text-[#C45B4B] dark:bg-[#C45B4B]/15 border border-[#A33F31]/20 dark:border-[#C45B4B]/25',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
