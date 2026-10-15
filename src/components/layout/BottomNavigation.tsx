/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppDestination } from '../../types/models';
import {
  CircleNavIcon,
  ExploreNavIcon,
  LinkNavIcon,
  StageNavIcon,
} from '../common/SonoraIcons';

interface BottomNavigationProps {
  currentTab: AppDestination;
  onTabChange: (tab: AppDestination) => void;
  unreadCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 1,
}) => {
  const tabs: Array<{
    id: AppDestination;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'circle',
      label: 'Circle',
      icon: (isActive) => (
        <CircleNavIcon size={24} color={isActive ? '#FF5A36' : '#8E8E93'} />
      ),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: (isActive) => (
        <ExploreNavIcon size={24} color={isActive ? '#FF5A36' : '#8E8E93'} />
      ),
    },
    {
      id: 'link',
      label: 'Link',
      badge: unreadCount,
      icon: (isActive) => (
        <LinkNavIcon size={24} color={isActive ? '#FF5A36' : '#8E8E93'} />
      ),
    },
    {
      id: 'stage',
      label: 'Stage',
      icon: (isActive) => (
        <StageNavIcon size={24} color={isActive ? '#FF5A36' : '#8E8E93'} />
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#EFE9DF] pb-safe"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto px-3 h-18 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 relative transition-all duration-150 cursor-pointer min-h-[48px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] rounded-2xl ${
                isActive
                  ? 'text-[#FF5A36]'
                  : 'text-[#8E8E93] hover:text-[#FF5A36] hover:bg-[#FFEFEA]/80'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center w-6 h-6 transition-transform duration-150 group-active:scale-95">
                {tab.icon(isActive)}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#FF2D8B] ring-2 ring-[#FAF7F2]" />
                )}
              </div>
              <span
                className={`text-[11px] font-bold mt-1 tracking-tight transition-colors duration-150 ${
                  isActive ? 'text-[#FF5A36]' : 'text-[#8E8E93] group-hover:text-[#FF5A36]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
