/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Logo Component
 * Faithful vector rendering of the approved Sonora brand identity:
 * - Gradient 'S' ribbon
 * - Flanking musical sound wave bars
 * - Bold geometric wordmark with "MUSIC · COLLAB · CREATE" tagline
 */

import React from 'react';

interface SonoraLogoProps {
  variant?: 'full' | 'horizontal' | 'mark' | 'app-icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'light' | 'dark';
}

export const SonoraMark: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  const uniqueId = React.useId().replace(/:/g, '');
  const gradId = `sonora-s-grad-${uniqueId}`;
  const barLeftId = `sonora-bar-l-${uniqueId}`;
  const barRightId = `sonora-bar-r-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sonora Logo"
    >
      <defs>
        {/* S-curve gradient: Orange (#FF5A36) to Pink (#FF2D8B) */}
        <linearGradient id={gradId} x1="30" y1="10" x2="70" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5A36" />
          <stop offset="50%" stopColor="#FF4165" />
          <stop offset="100%" stopColor="#FF2D8B" />
        </linearGradient>

        {/* Left sound bars: Primary Orange */}
        <linearGradient id={barLeftId} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6644" />
          <stop offset="100%" stopColor="#FF5A36" />
        </linearGradient>

        {/* Right sound bars: Pink/Purple */}
        <linearGradient id={barRightId} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2D8B" />
          <stop offset="100%" stopColor="#D9218F" />
        </linearGradient>
      </defs>

      {/* Left Sound Wave 1 (outer, shorter) */}
      <rect x="10" y="38" width="6.5" height="24" rx="3.25" fill={`url(#${barLeftId})`} />

      {/* Left Sound Wave 2 (inner, taller) */}
      <rect x="20" y="30" width="7" height="40" rx="3.5" fill={`url(#${barLeftId})`} />

      {/* Center 'S' Ribbon */}
      <path
        d="M 64 12
           C 49 10 33 22 35 39
           C 36 50 47 54 58 59
           C 70 64 73 72 70 80
           C 66 90 51 92 38 86
           C 36 84 34 85 34 87
           C 35 91 49 97 65 92
           C 79 87 84 72 79 58
           C 74 46 62 43 51 38
           C 42 34 43 24 53 21
           C 63 18 73 24 75 29
           C 76 31 78 31 79 29
           C 80 25 76 14 64 12 Z"
        fill={`url(#${gradId})`}
      />

      {/* Right Sound Wave 1 (inner, taller) */}
      <rect x="73" y="30" width="7" height="40" rx="3.5" fill={`url(#${barRightId})`} />

      {/* Right Sound Wave 2 (outer, shorter) */}
      <rect x="83.5" y="38" width="6.5" height="24" rx="3.25" fill={`url(#${barRightId})`} />
    </svg>
  );
};

export const SonoraLogo: React.FC<SonoraLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  theme = 'light',
}) => {
  const sizeMap = {
    sm: { markSize: 26, titleSize: 'text-lg', subtitleSize: 'text-[9px]' },
    md: { markSize: 36, titleSize: 'text-2xl', subtitleSize: 'text-[10px]' },
    lg: { markSize: 48, titleSize: 'text-3xl', subtitleSize: 'text-xs' },
    xl: { markSize: 72, titleSize: 'text-5xl', subtitleSize: 'text-sm' },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#20201E]';
  const tagColor = theme === 'dark' ? 'text-white/60' : 'text-[#20201E]/70';

  if (variant === 'mark') {
    return <SonoraMark size={currentSize.markSize} className={className} />;
  }

  if (variant === 'app-icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl bg-white shadow-md p-2 ${className}`}
        style={{ width: currentSize.markSize * 1.5, height: currentSize.markSize * 1.5 }}
      >
        <SonoraMark size={currentSize.markSize * 1.1} />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <SonoraMark size={currentSize.markSize * 1.6} className="mb-2" />
        <span className={`font-extrabold tracking-tight ${currentSize.titleSize} ${textColor}`}>
          Sonora
        </span>
        <span className={`font-semibold tracking-[0.22em] uppercase ${currentSize.subtitleSize} ${tagColor} mt-0.5`}>
          Music · Collab · Create
        </span>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <SonoraMark size={currentSize.markSize} />
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-tight ${currentSize.titleSize} ${textColor}`}>
          Sonora
        </span>
        <span className={`font-semibold tracking-[0.18em] uppercase ${currentSize.subtitleSize} ${tagColor} mt-0.5`}>
          Music · Collab · Create
        </span>
      </div>
    </div>
  );
};
