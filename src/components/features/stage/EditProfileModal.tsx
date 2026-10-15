/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EditProfileModal
 * Polished, validated profile editing modal for Sonora artist profiles.
 */

import React, { useState } from 'react';
import { UserProfile } from '../../../types/models';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';
import { Avatar } from '../../common/Avatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  existingUsernames: string[];
  onSave: (updated: Partial<UserProfile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  existingUsernames,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location || '');
  const [instruments, setInstruments] = useState(profile.instruments.join(', '));
  const [genres, setGenres] = useState(profile.genres.join(', '));
  const [interests, setInterests] = useState(profile.interests.join(', '));
  const [isProfilePublic, setIsProfilePublic] = useState(profile.isProfilePublic);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required.';
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) {
      newErrors.username = 'Username is required.';
    } else if (
      cleanUsername !== profile.username.toLowerCase() &&
      existingUsernames.map((u) => u.toLowerCase()).includes(cleanUsername)
    ) {
      newErrors.username = 'This username is already taken by another artist.';
    } else if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      newErrors.username = 'Only letters, numbers, dots, and underscores allowed.';
    }

    if (!bio.trim()) {
      newErrors.bio = 'Artist bio is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      displayName: displayName.trim(),
      username: username.trim().toLowerCase().replace(/^@/, ''),
      bio: bio.trim(),
      location: location.trim(),
      instruments: instruments.split(',').map((s) => s.trim()).filter(Boolean),
      genres: genres.split(',').map((s) => s.trim()).filter(Boolean),
      interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
      isProfilePublic,
      avatarUrl,
    });
    onClose();
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 border border-[#EFE9DF] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#20201E]">
              Edit Stage Profile
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Update your musical identity, instruments, and privacy
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#EFE9DF] flex items-center justify-center text-[#20201E] transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Preview & Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#20201E] block">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl} alt={displayName} size="xl" />
              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] text-[#8E8E93] block">Choose a studio avatar:</span>
                <div className="flex gap-2">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                        avatarUrl === url ? 'border-[#FF5A36] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Preset avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Display / Artist Name <span className="text-[#FF5A36]">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full bg-[#FAF7F2] border rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40 ${
                errors.displayName ? 'border-red-400' : 'border-[#EFE9DF]'
              }`}
              placeholder="e.g. Bryan The Mensah"
            />
            {errors.displayName && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Username Handle <span className="text-[#FF5A36]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-[#8E8E93]">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-[#FAF7F2] border rounded-2xl pl-7 pr-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40 ${
                  errors.username ? 'border-red-400' : 'border-[#EFE9DF]'
                }`}
                placeholder="bryanthemensah"
              />
            </div>
            {errors.username && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.username}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Bio <span className="text-[#FF5A36]">*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className={`w-full bg-[#FAF7F2] border rounded-2xl p-3 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40 resize-none ${
                errors.bio ? 'border-red-400' : 'border-[#EFE9DF]'
              }`}
              placeholder="Artist, songwriter and vocalist. Collab with me!"
            />
            {errors.bio && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.bio}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              placeholder="e.g. Accra / London"
            />
          </div>

          {/* Instruments */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Instruments & Roles (comma separated)
            </label>
            <input
              type="text"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              placeholder="Vocals, Keys, Production"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Genres (comma separated)
            </label>
            <input
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              placeholder="Afro-fusion, Indie, Hip Hop"
            />
          </div>

          {/* Musical Interests */}
          <div>
            <label className="text-xs font-bold text-[#20201E] block mb-1">
              Musical Interests & Collab Needs (comma separated)
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              placeholder="Live Vocal Stems, Beat Swaps, Song DNA Lineages"
            />
          </div>

          {/* Privacy & Profile Visibility Toggle (Section 9 requirement!) */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EFE9DF] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#20201E] block">
                {isProfilePublic ? '🌐 Public Profile' : '🔒 Private Profile'}
              </span>
              <p className="text-[11px] text-[#8E8E93]">
                {isProfilePublic
                  ? 'Anyone on Sonora can discover your posts and Song DNA stems.'
                  : 'Only confirmed Friends can view your full posts, stems, and collaboration lineage.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfilePublic(!isProfilePublic)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-3 ${
                isProfilePublic ? 'bg-[#FF5A36] justify-end' : 'bg-neutral-300 justify-start'
              }`}
              aria-label="Toggle profile visibility"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE9DF]">
            <SecondaryButton size="sm" type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" type="submit">
              Save Profile
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
