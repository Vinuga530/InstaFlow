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
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl border border-dashed',
        'border-black/[0.08] dark:border-white/[0.08] bg-[#FAF8F5]/80 dark:bg-[#141312]/80 backdrop-blur-sm shadow-cozy',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-[#1B1918] border border-black/[0.06] dark:border-white/[0.08] text-[#8C827A] dark:text-[#A8A199] mb-4 shadow-cozy">
        {icon}
      </div>
      <h3 className="font-fredoka text-lg text-[#292522] dark:text-[#F7F4EF]">
        {title}
      </h3>
      <p className="mt-1.5 text-xs text-[#8C827A] dark:text-[#A8A199] max-w-sm leading-relaxed">
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

