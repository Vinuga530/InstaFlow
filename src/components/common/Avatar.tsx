import React from 'react';
import { cn } from '../../utils/cn';
import { getAvatarGradient } from '../../utils/formatters';

export interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hasRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  username,
  size = 'md',
  className,
  hasRing = false,
}) => {
  const gradientClass = getAvatarGradient(username);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  const initial = username.charAt(0).toUpperCase() || '?';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl text-white shadow-cozy shrink-0 select-none bg-gradient-to-tr font-fredoka',
        sizeClasses[size],
        gradientClass,
        hasRing &&
          'ring-2 ring-[#E05A47]/80 ring-offset-2 ring-offset-white dark:ring-offset-[#1B1918]',
        className
      )}
    >
      <span>{initial}</span>
    </div>
  );
};

