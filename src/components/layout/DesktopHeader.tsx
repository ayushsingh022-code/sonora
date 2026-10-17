/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppDestination, UserProfile } from '../../types/models';
import { SonoraLogo } from '../common/SonoraLogo';
import { Avatar } from '../common/Avatar';
import { BellIcon } from '../common/SonoraIcons';
import { PrimaryButton } from '../common/Buttons';

import { DemoUserSwitcher } from '../common/DemoUserSwitcher';

interface DesktopHeaderProps {
  currentTab: AppDestination;
  onTabChange: (tab: AppDestination) => void;
  currentUser: UserProfile;
  onCreateClick: () => void;
  allArtists?: Record<string, UserProfile>;
  primaryDemoKeys?: readonly string[];
  onSwitchUser?: (key: string) => void;
  onOpenTutorial?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onCreateClick,
  allArtists,
  primaryDemoKeys,
  onSwitchUser,
  onOpenTutorial,
}) => {
  const navItems: Array<{ id: AppDestination; label: string }> = [
    { id: 'circle', label: 'Circle' },
    { id: 'explore', label: 'Explore' },
    { id: 'link', label: 'Link' },
    { id: 'stage', label: 'Stage' },
  ];

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EFE9DF] sticky top-0 z-40">
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onTabChange('circle')}
          className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] rounded-xl"
        >
          <SonoraLogo variant="horizontal" size="sm" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-1.5 ml-4" role="navigation" aria-label="Desktop Navigation">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'text-[#20201E] hover:bg-[#F0EBE1]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Desktop Actions */}
      <div className="flex items-center gap-3">
        {allArtists && primaryDemoKeys && onSwitchUser && (
          <DemoUserSwitcher
            currentUserId={currentUser.id}
            artists={allArtists}
            primaryKeys={primaryDemoKeys}
            onSelectUser={onSwitchUser}
          />
        )}

        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            className="px-3 py-1.5 rounded-full bg-[#FFEBE5] text-[#FF5A36] hover:bg-[#FFDFD6] text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Replay Sonora Interactive Tour"
          >
            <span>💡</span>
            <span>Tour</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onTabChange('link')}
          className="p-2 rounded-full hover:bg-[#F0EBE1] text-[#20201E] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <BellIcon size={20} hasUnread={true} />
        </button>

        <PrimaryButton size="sm" onClick={onCreateClick}>
          + Create
        </PrimaryButton>

        <button
          onClick={() => onTabChange('stage')}
          className="flex items-center gap-2 pl-2 cursor-pointer rounded-full hover:opacity-90"
          aria-label="Your Profile"
        >
          <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
          <span className="text-xs font-bold text-[#20201E] hidden lg:inline">
            {currentUser.displayName}
          </span>
        </button>
      </div>
    </header>
  );
};
