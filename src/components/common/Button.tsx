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
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';

  const sizeStyles = {
    xs: 'text-[11px] px-3 py-1 gap-1.5 min-h-[30px]',
    sm: 'text-xs px-3.5 py-1.5 gap-2 min-h-[36px]',
    md: 'text-xs px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-cozy hover:shadow-elevated',
    gradient:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-cozy hover:shadow-elevated',
    secondary:
      'bg-white dark:bg-[#242220] hover:bg-neutral-50 dark:hover:bg-[#2C2926] text-neutral-800 dark:text-neutral-100 border border-black/[0.07] dark:border-white/[0.09] shadow-subtle',
    ghost:
      'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/15 active:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20',
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
