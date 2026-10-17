/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — SongDNALineageModal
 * Minimal Summary & Accurate History:
 * - Compact view shows only Creators and Additions.
 * - Removed separate AI Copilot and AI Guide buttons.
 * - Timeline is hidden by default until explicitly requested.
 * - Avoids excessive version numbers, technical labels, and verbose lineage text.
 * - Accurate counts of actual persisted Contribution records.
 * - Distinguishes inherited contributions from newly added contributions.
 */

import React, { useState, useMemo } from 'react';
import { Song, SongVersion, Contribution, UserProfile, Post } from '../../../types/models';
import { SongDnaWaveIcon } from '../../common/SonoraIcons';
import { Avatar } from '../../common/Avatar';
import { SecondaryButton, PrimaryButton } from '../../common/Buttons';

interface SongDNALineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  versions: SongVersion[];
  contributions: Contribution[];
  artists: Record<string, UserProfile>;
  posts?: Post[];
  initialVersionId?: string;
  onOpenWorkspace?: (song: Song, version?: SongVersion) => void;
  onNavigateToPost?: (postId: string) => void;
  onCollabClick?: (song: Song, version?: SongVersion) => void;
}

export const SongDNALineageModal: React.FC<SongDNALineageModalProps> = ({
  isOpen,
  onClose,
  song,
  versions,
  contributions,
  artists,
  initialVersionId,
  onOpenWorkspace,
  onCollabClick,
}) => {
  // Hide expanded timeline until explicitly requested
  const [showTimeline, setShowTimeline] = useState<boolean>(false);

  // Sort versions by versionNumber ascending
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => a.versionNumber - b.versionNumber),
    [versions]
  );
  const rootVersion = sortedVersions[0];
  const latestVersion = sortedVersions[sortedVersions.length - 1];

  // Actual saved Contribution records for this song (from data source)
  const songContributions = useMemo(
    () => contributions.filter((c) => c.songId === song.id),
    [contributions, song.id]
  );

  // Total additions: actual count of distinct non-stem contribution records or recorded additions
  const totalActualAdditions = useMemo(() => {
    // If song has actual saved contributions, count them accurately
    if (songContributions.length > 0) {
      return songContributions.length;
    }
    return song.totalLineageAdditions || 1;
  }, [songContributions.length, song.totalLineageAdditions]);

  // Distinct creators who contributed to this song
  const participatingCreators = useMemo(() => {
    const list: UserProfile[] = [];
    const seenIds = new Set<string>();

    // Original creator first
    const rootArtist = artists[song.originalCreatorId];
    if (rootArtist) {
      seenIds.add(rootArtist.id);
      list.push(rootArtist);
    }

    // Collaborators
    songContributions.forEach((c) => {
      if (c.contributorId && !seenIds.has(c.contributorId)) {
        seenIds.add(c.contributorId);
        const art = artists[c.contributorId];
        if (art) list.push(art);
      }
    });

    return list;
  }, [song.originalCreatorId, songContributions, artists]);

  if (!isOpen) return null;

  const originalArtist = artists[song.originalCreatorId] || {
    displayName: 'Original Creator',
    username: 'creator',
    avatarUrl: '',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-lg rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center shadow-xs">
              <SongDnaWaveIcon size={20} color="#FFFFFF" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D9F56A]">
                Song DNA
              </span>
              <h2 className="text-lg font-black tracking-tight">{song.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* =========================================================== */}
        {/* COMPACT VIEW: Only Creators and Additions                     */}
        {/* =========================================================== */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3.5">
          {/* 1. Creators */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-2">
              Creators ({participatingCreators.length})
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Original Creator Spotlight */}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                <Avatar src={originalArtist.avatarUrl} alt={originalArtist.displayName} size="xs" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">{originalArtist.displayName}</span>
                    <span className="text-[9px] bg-[#FF5A36] text-white font-extrabold px-1 rounded-xs uppercase">
                      Origin
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50">@{originalArtist.username}</span>
                </div>
              </div>

              {/* Additional Contributors (without excessive names or text) */}
              {participatingCreators.filter((c) => c.id !== song.originalCreatorId).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/5">
                  <Avatar src={c.avatarUrl} alt={c.displayName} size="xs" />
                  <span className="text-xs text-white/90 font-medium">{c.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Additions Metric */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                Additions
              </span>
              <p className="text-base font-black text-[#D9F56A]">
                {totalActualAdditions} {totalActualAdditions === 1 ? 'addition' : 'additions'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTimeline(!showTimeline)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
            >
              {showTimeline ? 'Hide Timeline' : 'View Timeline →'}
            </button>
          </div>
        </div>

        {/* =========================================================== */}
        {/* EXPANDED TIMELINE: Hidden until explicitly requested        */}
        {/* =========================================================== */}
        {showTimeline && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                Timeline History ({sortedVersions.length} {sortedVersions.length === 1 ? 'version' : 'versions'})
              </span>
              <span className="text-[10px] text-white/40">Root → Current</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {sortedVersions.map((ver, idx) => {
                const isRoot = idx === 0;
                const isLatest = idx === sortedVersions.length - 1;

                // Parent version to separate newly added from inherited contributions
                const parentVer = ver.parentVersionId
                  ? versions.find((v) => v.id === ver.parentVersionId)
                  : null;

                const versionContribs = (ver.orderedContributionIds || [])
                  .map((id) => contributions.find((c) => c.id === id))
                  .filter((c): c is Contribution => c !== undefined);

                const newlyAdded = parentVer
                  ? versionContribs.filter((c) => !parentVer.orderedContributionIds.includes(c.id))
                  : versionContribs;

                const inherited = parentVer
                  ? versionContribs.filter((c) => parentVer.orderedContributionIds.includes(c.id))
                  : [];

                return (
                  <div
                    key={ver.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isLatest
                        ? 'bg-gradient-to-r from-white/10 to-white/5 border-[#FF5A36]/50'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    {/* Version row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isLatest ? 'bg-[#FF5A36] text-white' : 'bg-white/15 text-white/80'
                          }`}
                        >
                          v{ver.versionNumber.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {ver.versionLabel || (isRoot ? 'Root Idea' : 'Collaboration Mix')}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        {isRoot ? '🌱 Root' : isLatest ? '★ Current' : ''}
                      </span>
                    </div>

                    {/* Newly added contributions in this version */}
                    {newlyAdded.length > 0 && (
                      <div className="space-y-1 mt-1.5">
                        {newlyAdded.map((c) => {
                          const art = artists[c.contributorId];
                          return (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-xs bg-black/40 px-2.5 py-1 rounded-lg border border-[#D9F56A]/20"
                            >
                              <div className="flex items-center gap-1.5">
                                <Avatar src={art?.avatarUrl} alt={art?.displayName} size="xs" />
                                <span className="font-semibold text-white/90">{art?.displayName || 'Artist'}</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#D9F56A]">
                                + {c.partType}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inherited contributions (compact summary) */}
                    {inherited.length > 0 && (
                      <div className="mt-1.5 text-[10px] text-white/40 flex items-center gap-1.5 px-1">
                        <span>↳ Inherited:</span>
                        <span>
                          {inherited.map((c) => c.partType).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
          <SecondaryButton size="sm" onClick={onClose}>
            Close
          </SecondaryButton>

          <div className="flex items-center gap-2">
            {onOpenWorkspace && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkspace(song, latestVersion);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                Open Mix
              </button>
            )}

            {onCollabClick && (
              <PrimaryButton
                size="sm"
                onClick={() => {
                  onClose();
                  onCollabClick(song, latestVersion);
                }}
                className="px-4 font-black"
              >
                + Add Part
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
