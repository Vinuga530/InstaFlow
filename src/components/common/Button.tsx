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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40';

  const sizeStyles = {
    xs: 'text-[11px] px-3 py-1 gap-1.5 min-h-[30px]',
    sm: 'text-xs px-3.5 py-1.5 gap-2 min-h-[36px]',
    md: 'text-xs px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-canvas)] shadow-subtle font-semibold',
    gradient:
      'bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-canvas)] shadow-subtle font-semibold',
    secondary:
      'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-subtle',
    ghost:
      'hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    danger:
      'bg-[var(--status-negative-bg)] hover:opacity-90 active:opacity-100 text-[var(--status-negative)] border border-[var(--status-negative)]/25',
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
