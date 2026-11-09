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
      bg: 'bg-[#71806C]/10 border-[#71806C]/25 dark:bg-[#899783]/15 dark:border-[#899783]/30',
      text: 'text-[#5A6755] dark:text-[#A6B5A0]',
      icon: <Users className="w-3 h-3" />,
    },
    not_following_back: {
      defaultLabel: 'Not Following Back',
      bg: 'bg-[#9E7E43]/10 border-[#9E7E43]/25 dark:bg-[#C0A268]/15 dark:border-[#C0A268]/30',
      text: 'text-[#876A32] dark:text-[#D5BA85]',
      icon: <ArrowUpRight className="w-3 h-3" />,
    },
    fan: {
      defaultLabel: 'Fan',
      bg: 'bg-[#686E64]/10 border-[#686E64]/20 dark:bg-[#A6AA9D]/15 dark:border-[#A6AA9D]/25',
      text: 'text-[#50554C] dark:text-[#C5C9BC]',
      icon: <UserCheck className="w-3 h-3" />,
    },
    unfollower: {
      defaultLabel: 'Unfollowed',
      bg: 'bg-[#A33F31]/10 border-[#A33F31]/25 dark:bg-[#C45B4B]/15 dark:border-[#C45B4B]/30',
      text: 'text-[#8A3226] dark:text-[#DC7C6E]',
      icon: <UserMinus className="w-3 h-3" />,
    },
    new: {
      defaultLabel: 'New Follower',
      bg: 'bg-[#71806C]/15 border-[#71806C]/30 dark:bg-[#899783]/20 dark:border-[#899783]/35',
      text: 'text-[#505D4A] dark:text-[#B2C1AC]',
      icon: <UserPlus className="w-3 h-3" />,
    },
    whitelisted: {
      defaultLabel: 'Whitelisted',
      bg: 'bg-[#9E7E43]/10 border-[#9E7E43]/20 dark:bg-[#C0A268]/12 dark:border-[#C0A268]/25',
      text: 'text-[#876A32] dark:text-[#D5BA85]',
      icon: <Star className="w-3 h-3 fill-current text-[#9E7E43] dark:text-[#C0A268]" />,
    },
    neutral: {
      defaultLabel: 'Account',
      bg: 'bg-[#E2DFD6] border-[#D5D2C5] dark:bg-[#272C28] dark:border-[#343B35]',
      text: 'text-[#686E64] dark:text-[#A6AA9D]',
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
