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
  iconColor = 'text-brand-500',
  iconBg = 'bg-brand-500/10',
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
        'bg-white dark:bg-[#1B1918]',
        'border-black/[0.06] dark:border-white/[0.08] shadow-subtle',
        isClickable &&
          'cursor-pointer hover:border-black/[0.12] dark:hover:border-white/[0.15] hover:shadow-cozy hover:scale-[1.01] active:scale-[0.99]',
        active && 'ring-2 ring-brand-500/30 border-brand-500/80',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
          {title}
        </p>
        {icon && (
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-[26px] font-fredoka font-normal tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>

        {changeIndicator && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums',
              changeIndicator.isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            )}
          >
            {changeIndicator.isPositive ? '+' : ''}
            {changeIndicator.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
