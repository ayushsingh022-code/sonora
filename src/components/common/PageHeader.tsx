/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightActions,
  className = '',
}) => {
  return (
    <header className={`flex items-center justify-between py-3.5 px-4 sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md transition-all ${className}`}>
      <div className="flex items-center gap-3">
        {leftAction && <div className="shrink-0">{leftAction}</div>}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#20201E]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#B9B2A9] font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {rightActions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {rightActions}
        </div>
      )}
    </header>
  );
};
