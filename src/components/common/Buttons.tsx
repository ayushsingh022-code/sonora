/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3.5 gap-1.5 min-h-[36px]',
    md: 'text-sm py-2 px-5 gap-2 min-h-[44px]',
    lg: 'text-base py-3 px-7 gap-2.5 min-h-[48px]',
  };

  const bgStyles = variant === 'gradient'
    ? 'bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white hover:brightness-105 active:scale-[0.98]'
    : 'bg-[#FF5A36] text-white hover:bg-[#F04D29] active:scale-[0.98]';

  return (
    <button
      className={`inline-flex items-center justify-center font-bold rounded-full transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${sizeStyles[size]} ${bgStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

export const SecondaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3.5 gap-1.5 min-h-[36px]',
    md: 'text-sm py-2 px-5 gap-2 min-h-[44px]',
    lg: 'text-base py-3 px-7 gap-2.5 min-h-[48px]',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-full bg-white text-[#20201E] border border-[#EFE9DF] hover:bg-[#F6F2EB] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-2xs disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
