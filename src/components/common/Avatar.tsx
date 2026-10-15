/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStoryRing?: boolean;
  hasCollabBadge?: boolean;
  hasAddBadge?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  hasStoryRing = false,
  hasCollabBadge = false,
  hasAddBadge = false,
  isOnline = false,
  className = '',
  onClick,
}) => {
  const sizeStyles = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const content = (
    <div
      className={`relative inline-flex shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Outer Story Ring if active */}
      <div
        className={`rounded-full p-[2.5px] transition-transform ${
          hasStoryRing
            ? 'bg-gradient-to-tr from-[#FF5A36] via-[#FF2D8B] to-[#FF5A36]'
            : 'bg-transparent'
        }`}
      >
        <div
          className={`rounded-full overflow-hidden bg-[#FAF7F2] border-2 ${
            hasStoryRing ? 'border-[#FAF7F2]' : 'border-black/5'
          } ${sizeStyles[size]} flex items-center justify-center font-bold text-[#20201E]/70`}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback to initials if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{getInitials(alt)}</span>
          )}
        </div>
      </div>

      {/* Story '+' Add Badge */}
      {hasAddBadge && (
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#20201E] text-white rounded-full flex items-center justify-center ring-2 ring-[#FAF7F2] text-[10px] font-bold">
          +
        </span>
      )}

      {/* Collab Spark / Audio Badge */}
      {hasCollabBadge && (
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#FF5A36] text-white rounded-full flex items-center justify-center ring-2 ring-[#FAF7F2]">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
          </svg>
        </span>
      )}

      {/* Online indicator */}
      {isOnline && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-[#D9F56A] rounded-full ring-2 ring-[#FAF7F2]" />
      )}
    </div>
  );

  return content;
};
