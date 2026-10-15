/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Custom Filled-Style Icon Pack
 * Matches the approved icon pack in the Sonora mobile app UI showcase.
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Circle Tab Icon: 5 filled sound wave bars with symmetrical heights
 * Matches Sonora Music App Icon System reference (MAIN NAVIGATION - FILLED STYLE)
 */
export const CircleNavIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="1.9" y="8.5" width="2.6" height="7" rx="1.3" fill={color} />
    <rect x="6.3" y="5.0" width="2.6" height="14" rx="1.3" fill={color} />
    <rect x="10.7" y="2.5" width="2.6" height="19" rx="1.3" fill={color} />
    <rect x="15.1" y="5.0" width="2.6" height="14" rx="1.3" fill={color} />
    <rect x="19.5" y="8.5" width="2.6" height="7" rx="1.3" fill={color} />
  </svg>
);

/**
 * Explore Tab Icon: Solid filled circle disk with sharp 45° compass needle cutout
 * Matches Sonora Music App Icon System reference (MAIN NAVIGATION - FILLED STYLE)
 */
export const ExploreNavIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Outer filled circle */}
    <circle cx="12" cy="12" r="10" fill={color} />
    {/* 45-degree angled compass needle cutout in white */}
    <path
      d="M16.5 7.5 L13.8 13.8 L7.5 16.5 L10.2 10.2 Z"
      fill="#FAF7F2"
    />
    {/* Subtle center seam dividing line */}
    <line
      x1="7.5"
      y1="16.5"
      x2="16.5"
      y2="7.5"
      stroke={color}
      strokeWidth="0.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Link Tab Icon: Filled message bubble with curved tail and 3 sound/speech dots
 * Matches Sonora Music App Icon System reference (MAIN NAVIGATION - FILLED STYLE)
 */
export const LinkNavIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Smooth rounded chat balloon with tail on bottom-left */}
    <path
      d="M7.5 4.5 H16.5 C19 4.5 21 6.5 21 9 V13 C21 15.5 19 17.5 16.5 17.5 H7.8 L4.2 20.6 C3.6 21.1 3 20.7 3 20 V9 C3 6.5 5 4.5 7.5 4.5 Z"
      fill={color}
    />
    {/* 3 circular punch holes */}
    <circle cx="8.2" cy="11" r="1.3" fill="#FAF7F2" />
    <circle cx="12" cy="11" r="1.3" fill="#FAF7F2" />
    <circle cx="15.8" cy="11" r="1.3" fill="#FAF7F2" />
  </svg>
);

/**
 * Stage Tab Icon: Solid studio microphone with capsule, U-cradle, stem, and stand
 * Matches Sonora Music App Icon System reference (MAIN NAVIGATION - FILLED STYLE)
 */
export const StageNavIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Microphone Capsule */}
    <rect x="8.3" y="2.5" width="7.4" height="11" rx="3.7" fill={color} />
    {/* U-shaped Cradle */}
    <path
      d="M5.5 9 C5.5 13.5 8.4 16.5 12 16.5 C15.6 16.5 18.5 13.5 18.5 9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Center Vertical Stem */}
    <line
      x1="12"
      y1="16.5"
      x2="12"
      y2="20.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Base Stand */}
    <line
      x1="8.5"
      y1="20.5"
      x2="15.5"
      y2="20.5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Notification Bell
 */
export const BellIcon: React.FC<IconProps & { hasUnread?: boolean }> = ({
  size = 22,
  color = 'currentColor',
  hasUnread = false,
  className = '',
}) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C8.68629 3 6 5.68629 6 9V14.5L4 16.5V17.5H20V16.5L18 14.5V9C18 5.68629 15.3137 3 12 3Z"
        fill={color}
      />
      <path d="M10 19C10 20.1046 10.8954 21 12 21C13.1046 21 14 20.1046 14 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
    {hasUnread && (
      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#FF2D8B] ring-2 ring-[#FAF7F2]" />
    )}
  </div>
);

/**
 * Search Icon
 */
export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
    <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Sliders / Filter Icon
 */
export const FilterSlidersIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="2.5" fill={color} />
    <line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="15" cy="17" r="2.5" fill={color} />
  </svg>
);

/**
 * Heart (Filled)
 */
export const HeartFilledIcon: React.FC<IconProps> = ({ size = 20, color = '#FF2D8B', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      fill={color}
    />
  </svg>
);

/**
 * Share Arrow
 */
export const ShareIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M15 5L20 10L15 15"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 10H9C6 10 4 12 4 15V19"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Musical DNA Waveform Icon
 */
export const SongDnaWaveIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
    <rect x="2" y="8" width="2" height="4" rx="1" fill={color} />
    <rect x="5" y="5" width="2" height="10" rx="1" fill={color} />
    <rect x="8" y="3" width="2" height="14" rx="1" fill={color} />
    <rect x="11" y="6" width="2" height="8" rx="1" fill={color} />
    <rect x="14" y="2" width="2" height="16" rx="1" fill={color} />
    <rect x="17" y="7" width="2" height="6" rx="1" fill={color} />
  </svg>
);

/**
 * AI Sparkles Icon - Signature Sonora AI styling
 */
export const SparklesIcon: React.FC<IconProps> = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z"
      fill={color}
    />
    <path
      d="M19 16L20.2 19.8L24 21L20.2 22.2L19 26L17.8 22.2L14 21L17.8 19.8L19 16Z"
      fill={color}
      transform="scale(0.6) translate(10, 2)"
    />
  </svg>
);
