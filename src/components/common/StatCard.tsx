import React from 'react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/formatters';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  changeIndicator?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconColor = 'text-[var(--accent-primary)]',
  iconBg = 'bg-[var(--accent-subtle)]',
  changeIndicator,
  onClick,
  className,
  active = false,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl p-4 sm:p-4.5 border transition-all duration-150 select-none',
        'bg-[var(--bg-surface)]',
        'border-[var(--border-subtle)] shadow-subtle',
        isClickable &&
          'cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] active:scale-[0.99]',
        active && 'ring-1 ring-[var(--accent-primary)]/40 border-[var(--accent-primary)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--text-secondary)] truncate">
          {title}
        </p>
        {icon && (
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>

        {changeIndicator && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums',
              changeIndicator.isPositive
                ? 'bg-[var(--status-positive-bg)] text-[var(--status-positive)]'
                : 'bg-[var(--status-negative-bg)] text-[var(--status-negative)]'
            )}
          >
            {changeIndicator.isPositive ? '+' : ''}
            {changeIndicator.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)] truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
