/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile } from '../../../types/models';
import { Avatar } from '../../common/Avatar';

interface StoryCircleListProps {
  currentUser: UserProfile;
  artists: UserProfile[];
  onSelectStory: (artist: UserProfile | 'currentUser') => void;
}

export const StoryCircleList: React.FC<StoryCircleListProps> = ({
  currentUser,
  artists,
  onSelectStory,
}) => {
  return (
    <div className="py-2 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-4 px-4 min-w-max">
        {/* Your Story item with '+' badge */}
        <button
          onClick={() => onSelectStory('currentUser')}
          className="flex flex-col items-center gap-1.5 cursor-pointer group focus-visible:outline-none"
          aria-label="Add to your story"
        >
          <Avatar
            src={currentUser.avatarUrl}
            alt="Your story"
            size="lg"
            hasAddBadge={true}
          />
          <span className="text-[11px] font-semibold text-[#20201E] tracking-tight">
            Your story
          </span>
        </button>

        {/* Followed Creators in Circle */}
        {artists.map((artist) => (
          <button
            key={artist.id}
            onClick={() => onSelectStory(artist)}
            className="flex flex-col items-center gap-1.5 cursor-pointer group focus-visible:outline-none"
            aria-label={`View story from ${artist.username}`}
          >
            <Avatar
              src={artist.avatarUrl}
              alt={artist.displayName}
              size="lg"
              hasStoryRing={true}
            />
            <span className="text-[11px] font-semibold text-[#20201E] tracking-tight group-hover:text-[#FF5A36] transition-colors max-w-[68px] truncate">
              {artist.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
