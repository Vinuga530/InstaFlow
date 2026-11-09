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
        'border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 shadow-subtle',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-primary)] mb-4 shadow-subtle">
        {icon}
      </div>
      <h3 className="font-bold text-base text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
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
