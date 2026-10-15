/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { SongDnaWaveIcon } from './SonoraIcons';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white/70 rounded-3xl border border-[#EFE9DF] my-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#FFEBE5] text-[#FF5A36] flex items-center justify-center mb-3.5 shadow-2xs">
        {icon || <SongDnaWaveIcon size={28} color="#FF5A36" />}
      </div>
      <h3 className="text-base font-bold text-[#20201E] tracking-tight">{title}</h3>
      <p className="text-xs text-[#B9B2A9] mt-1 mb-5 max-w-xs leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <PrimaryButton size="sm" onClick={onAction}>
              {actionLabel}
            </PrimaryButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <SecondaryButton size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </SecondaryButton>
          )}
        </div>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading Sonora vibe...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {/* Animated Waveform bars */}
      <div className="flex items-end gap-1.5 h-10 mb-3">
        <span className="w-1.5 bg-[#FF5A36] rounded-full animate-bounce [animation-delay:-0.3s] h-5" />
        <span className="w-1.5 bg-[#FF4165] rounded-full animate-bounce [animation-delay:-0.15s] h-8" />
        <span className="w-1.5 bg-[#FF2D8B] rounded-full animate-bounce h-10" />
        <span className="w-1.5 bg-[#D9F56A] rounded-full animate-bounce [animation-delay:-0.2s] h-6" />
        <span className="w-1.5 bg-[#E9DFFF] rounded-full animate-bounce [animation-delay:-0.35s] h-4" />
      </div>
      <p className="text-xs font-semibold text-[#B9B2A9] tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Something went out of tune',
  message = 'We could not load this section. Check your connection or try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-red-50/50 rounded-3xl border border-red-100 my-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-[#20201E]">{title}</h3>
      <p className="text-xs text-[#B9B2A9] mt-1 mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <SecondaryButton size="sm" onClick={onRetry}>
          Try Again
        </SecondaryButton>
      )}
    </div>
  );
};
