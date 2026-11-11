import React from 'react';
import { cn } from '../../utils/cn';
import { UserCheck, UserMinus, UserPlus, Users, Star, ArrowUpRight, User, Building2, CheckCircle2 } from 'lucide-react';

export type BadgeVariant =
  | 'mutual'
  | 'not_following_back'
  | 'fan'
  | 'unfollower'
  | 'new'
  | 'whitelisted'
  | 'personal'
  | 'page'
  | 'verified'
  | 'neutral';

export interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  label,
  className,
  showIcon = true,
}) => {
  const configs: Record<
    BadgeVariant,
    { defaultLabel: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    mutual: {
      defaultLabel: 'Mutual',
      bg: 'bg-[var(--status-positive-bg)] border-[var(--status-positive)]/25',
      text: 'text-[var(--status-positive)]',
      icon: <Users className="w-3 h-3" />,
    },
    not_following_back: {
      defaultLabel: 'Not Following Back',
      bg: 'bg-[var(--status-warning-bg)] border-[var(--status-warning)]/25',
      text: 'text-[var(--status-warning)]',
      icon: <ArrowUpRight className="w-3 h-3" />,
    },
    fan: {
      defaultLabel: 'Fan',
      bg: 'bg-[var(--accent-subtle)] border-[var(--accent-primary)]/20',
      text: 'text-[var(--accent-primary)]',
      icon: <UserCheck className="w-3 h-3" />,
    },
    unfollower: {
      defaultLabel: 'Unfollowed',
      bg: 'bg-[var(--status-negative-bg)] border-[var(--status-negative)]/25',
      text: 'text-[var(--status-negative)]',
      icon: <UserMinus className="w-3 h-3" />,
    },
    new: {
      defaultLabel: 'New Follower',
      bg: 'bg-[var(--status-positive-bg)] border-[var(--status-positive)]/30',
      text: 'text-[var(--status-positive)]',
      icon: <UserPlus className="w-3 h-3" />,
    },
    whitelisted: {
      defaultLabel: 'Whitelisted',
      bg: 'bg-[var(--status-warning-bg)] border-[var(--status-warning)]/25',
      text: 'text-[var(--status-warning)]',
      icon: <Star className="w-3 h-3 fill-current text-[var(--status-warning)]" />,
    },
    personal: {
      defaultLabel: 'Personal',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: <User className="w-3 h-3" />,
    },
    page: {
      defaultLabel: 'Page / Brand',
      bg: 'bg-sky-500/10 border-sky-500/25',
      text: 'text-sky-700 dark:text-sky-400',
      icon: <Building2 className="w-3 h-3" />,
    },
    verified: {
      defaultLabel: 'Verified',
      bg: 'bg-blue-500/10 border-blue-500/25',
      text: 'text-blue-600 dark:text-blue-400',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    neutral: {
      defaultLabel: 'Account',
      bg: 'bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)]',
      text: 'text-[var(--text-secondary)]',
      icon: null,
    },
  };

  const config = configs[variant] || configs.neutral;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none tracking-normal transition-colors',
        config.bg,
        config.text,
        className
      )}
    >
      {showIcon && config.icon && <span className="shrink-0">{config.icon}</span>}
      <span>{displayLabel}</span>
    </span>
  );
};
