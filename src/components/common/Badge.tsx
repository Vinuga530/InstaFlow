import React from 'react';
import { cn } from '../../utils/cn';
import { UserCheck, UserMinus, UserPlus, Users, Star, ArrowUpRight } from 'lucide-react';

export type BadgeVariant =
  | 'mutual'
  | 'not_following_back'
  | 'fan'
  | 'unfollower'
  | 'new'
  | 'whitelisted'
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
      bg: 'bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: <Users className="w-3 h-3" />,
    },
    not_following_back: {
      defaultLabel: 'Not Following Back',
      bg: 'bg-amber-500/10 border-amber-500/25 dark:bg-amber-500/15 dark:border-amber-500/30',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <ArrowUpRight className="w-3 h-3" />,
    },
    fan: {
      defaultLabel: 'Fan',
      bg: 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <UserCheck className="w-3 h-3" />,
    },
    unfollower: {
      defaultLabel: 'Unfollowed',
      bg: 'bg-rose-500/10 border-rose-500/25 dark:bg-rose-500/20 dark:border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300',
      icon: <UserMinus className="w-3 h-3" />,
    },
    new: {
      defaultLabel: 'New Follower',
      bg: 'bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/15 dark:border-purple-500/30',
      text: 'text-purple-700 dark:text-purple-300',
      icon: <UserPlus className="w-3 h-3" />,
    },
    whitelisted: {
      defaultLabel: 'Whitelisted',
      bg: 'bg-amber-500/10 border-amber-500/25 dark:bg-amber-500/15 dark:border-amber-500/30',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <Star className="w-3 h-3 fill-amber-400 text-amber-500" />,
    },
    neutral: {
      defaultLabel: 'Account',
      bg: 'bg-neutral-100 border-neutral-200/80 dark:bg-neutral-800/80 dark:border-neutral-700/60',
      text: 'text-neutral-700 dark:text-neutral-300',
      icon: null,
    },
  };

  const config = configs[variant] || configs.neutral;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none tracking-normal transition-colors',
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
