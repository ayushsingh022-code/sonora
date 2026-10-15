/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Demo User Switcher
 * Allows seamlessly switching between the 4 fictional musician personas
 * to verify one-way Follow, mutual Add Friend, incoming/outgoing request states,
 * and private profile boundaries.
 */

import React, { useState } from 'react';
import { UserProfile } from '../../types/models';
import { Avatar } from './Avatar';

interface DemoUserSwitcherProps {
  currentUserId: string;
  artists: Record<string, UserProfile>;
  primaryKeys: readonly string[];
  onSelectUser: (userKey: string) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const DemoUserSwitcher: React.FC<DemoUserSwitcherProps> = ({
  currentUserId,
  artists,
  primaryKeys,
  onSelectUser,
  theme = 'light',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the artist object of the current user
  const currentArtistKey =
    primaryKeys.find((k) => artists[k]?.id === currentUserId) || primaryKeys[0];
  const currentUser = artists[currentArtistKey];

  const triggerClasses =
    theme === 'dark'
      ? 'bg-black/50 hover:bg-black/70 border-white/20 text-white shadow-md'
      : 'bg-[#F2ECE2] hover:bg-[#EBE3D7] border-[#E2DAD0] text-[#20201E] shadow-2xs';

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] ${triggerClasses}`}
        aria-label="Switch active demo persona"
        aria-expanded={isOpen}
      >
        <span className="w-2 h-2 rounded-full bg-[#FF5A36] animate-pulse shrink-0" />
        <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-white/60' : 'text-[#8E8E93]'}`}>
          User:
        </span>
        <span className="text-xs font-black max-w-[95px] truncate">
          {currentUser?.displayName || 'Musician'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border border-[#EFE9DF] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 mb-2 border-b border-[#EFE9DF]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#20201E] uppercase tracking-wider">
                  Switch Demo Persona
                </span>
                <span className="text-[10px] bg-[#FFEBE5] text-[#FF5A36] px-2 py-0.5 rounded-full font-bold">
                  Phase 2 Test
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Switch identity to test Follow, Friend requests, and permissions.
              </p>
            </div>

            <div className="space-y-1.5">
              {primaryKeys.map((key) => {
                const user = artists[key];
                if (!user) return null;
                const isSelected = user.id === currentUserId;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectUser(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFEBE5] border border-[#FF5A36]/30'
                        : 'hover:bg-[#FAF7F2] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#20201E] truncate">
                            {user.displayName}
                          </span>
                          {!user.isProfilePublic && (
                            <span className="text-[9px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.2 rounded">
                              🔒 Private
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8E8E93] truncate">
                          {user.instruments.slice(0, 2).join(' · ')} · @{user.username}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center text-[11px] font-black shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
