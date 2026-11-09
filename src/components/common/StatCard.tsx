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
  iconColor = 'text-[#71806C] dark:text-[#899783]',
  iconBg = 'bg-[#71806C]/10 dark:bg-[#899783]/15',
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
        'bg-[#EAE8DF] dark:bg-[#202421]',
        'border-[#D5D2C5] dark:border-[#343B35] shadow-subtle',
        isClickable &&
          'cursor-pointer hover:border-[#BCB8A9] dark:hover:border-[#444E46] active:scale-[0.99]',
        active && 'ring-1 ring-[#71806C]/40 dark:ring-[#899783]/40 border-[#71806C] dark:border-[#899783]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#686E64] dark:text-[#A6AA9D] truncate">
          {title}
        </p>
        {icon && (
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-[26px] font-semibold tracking-tight text-[#242823] dark:text-[#F0EEE6] tabular-nums">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>

        {changeIndicator && (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums',
              changeIndicator.isPositive
                ? 'bg-[#71806C]/15 text-[#5A6755] dark:text-[#A6B5A0]'
                : 'bg-[#A33F31]/10 text-[#8A3226] dark:text-[#DC7C6E]'
            )}
          >
            {changeIndicator.isPositive ? '+' : ''}
            {changeIndicator.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-[#8D9387] dark:text-[#72776C] truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
