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
        'relative inline-flex items-center justify-center rounded-xl font-medium shrink-0 select-none shadow-subtle',
        sizeClasses[size],
        gradientClass,
        hasRing &&
          'ring-1 ring-[#71806C] dark:ring-[#899783] ring-offset-2 ring-offset-[#F5F3EC] dark:ring-offset-[#151716]',
        className
      )}
    >
      <span>{initial}</span>
    </div>
  );
};

