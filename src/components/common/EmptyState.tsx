import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed',
        'border-[#D5D2C5] dark:border-[#343B35] bg-[#EAE8DF]/50 dark:bg-[#202421]/50 shadow-subtle',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EAE8DF] dark:bg-[#202421] border border-[#D5D2C5] dark:border-[#343B35] text-[#686E64] dark:text-[#A6AA9D] mb-4 shadow-subtle">
        {icon}
      </div>
      <h3 className="font-medium text-base text-[#242823] dark:text-[#F0EEE6]">
        {title}
      </h3>
      <p className="mt-1.5 text-xs text-[#686E64] dark:text-[#A6AA9D] max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

