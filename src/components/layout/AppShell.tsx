/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppDestination, UserProfile } from '../../types/models';
import { BottomNavigation } from './BottomNavigation';
import { DesktopHeader } from './DesktopHeader';

interface AppShellProps {
  currentTab: AppDestination;
  onTabChange: (tab: AppDestination) => void;
  currentUser: UserProfile;
  onCreateClick: () => void;
  unreadCount?: number;
  allArtists?: Record<string, UserProfile>;
  primaryDemoKeys?: readonly string[];
  onSwitchUser?: (key: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onCreateClick,
  unreadCount = 1,
  allArtists,
  primaryDemoKeys,
  onSwitchUser,
  children,
}) => {
  const isStage = currentTab === 'stage';

  return (
    <div className={`min-h-screen flex flex-col antialiased selection:bg-[#FF5A36]/20 selection:text-[#FF5A36] transition-colors duration-200 ${
      isStage ? 'bg-[#0A0A0C] text-white' : 'bg-[#FAF7F2] text-[#20201E]'
    }`}>
      {/* Desktop Header Navigation */}
      <DesktopHeader
        currentTab={currentTab}
        onTabChange={onTabChange}
        currentUser={currentUser}
        onCreateClick={onCreateClick}
        allArtists={allArtists}
        primaryDemoKeys={primaryDemoKeys}
        onSwitchUser={onSwitchUser}
      />

      {/* Main Content Viewport */}
      <main className={`flex-1 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto transition-all ${
        isStage ? 'p-0 md:py-4' : 'md:py-6'
      }`}>
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation
          currentTab={currentTab}
          onTabChange={onTabChange}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
};
