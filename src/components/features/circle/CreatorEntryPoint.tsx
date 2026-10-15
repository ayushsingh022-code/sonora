/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, PostType } from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { PrimaryButton } from '../../common/Buttons';

interface CreatorEntryPointProps {
  currentUser: UserProfile;
  onOpenCreate: (initialType?: PostType) => void;
}

export const CreatorEntryPoint: React.FC<CreatorEntryPointProps> = ({
  currentUser,
  onOpenCreate,
}) => {
  return (
    <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-[#EFE9DF] mx-4 mb-3">
      {/* Top Input Row */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
        <div
          onClick={() => onOpenCreate('post')}
          className="flex-1 bg-[#F5EFE6] hover:bg-[#EFE9DF] transition-colors rounded-full py-2.5 px-4 cursor-pointer text-xs font-medium text-[#B9B2A9] truncate"
        >
          What's brewing on your mind?
        </div>
        <PrimaryButton
          size="sm"
          onClick={() => onOpenCreate('post')}
          className="rounded-full px-4 text-xs font-bold shrink-0"
        >
          Create
        </PrimaryButton>
      </div>

      {/* Sub-Actions Row */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F5EFE6]">
        {/* Video Action */}
        <button
          onClick={() => onOpenCreate('video')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-[#FFF2EE] hover:bg-[#FFE5DC] text-[#FF5A36] text-xs font-bold transition-all cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V8C2 6.89543 2.89543 6 4 6Z" />
            <path d="M18 10L22 7V17L18 14V10Z" />
          </svg>
          <span>Video</span>
        </button>

        {/* Jam Action */}
        <button
          onClick={() => onOpenCreate('jam')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-[#F4EEFF] hover:bg-[#E9DFFF] text-[#7A49D8] text-xs font-bold transition-all cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" />
          </svg>
          <span>Jam</span>
        </button>

        {/* + Post Action */}
        <button
          onClick={() => onOpenCreate('post')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-[#F5FAD6] hover:bg-[#EDF7BD] text-[#4A6400] text-xs font-bold transition-all cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Post</span>
        </button>
      </div>
    </div>
  );
};
