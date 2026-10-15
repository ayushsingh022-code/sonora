/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Song, SongVersion, Contribution, UserProfile, Post, MAX_VISIBLE_CONTRIBUTIONS } from '../../../types/models';
import { SongDnaWaveIcon, SparklesIcon } from '../../common/SonoraIcons';
import { SecondaryButton } from '../../common/Buttons';
import { Avatar } from '../../common/Avatar';
import { SongDNAGuideSection } from '../ai/SongDNAGuideSection';
import { RecommendedContributionProposal } from '../../../types/ai';

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
  onCollabClick?: (song: Song, version?: SongVersion, proposal?: RecommendedContributionProposal) => void;
}

export const SongDNALineageModal: React.FC<SongDNALineageModalProps> = ({
  isOpen,
  onClose,
  song,
  versions,
  contributions,
  artists,
  posts,
  initialVersionId,
  onOpenWorkspace,
  onNavigateToPost,
  onCollabClick,
}) => {
  if (!isOpen) return null;

  // View mode tab
  const [activeTab, setActiveTab] = useState<'ai_guide' | 'timeline'>('ai_guide');

  // Sort versions by versionNumber ascending
  const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const rootVersion = sortedVersions[0];
  const latestVersion = sortedVersions[sortedVersions.length - 1];

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    initialVersionId || latestVersion?.id || rootVersion?.id || ''
  );

  const originalArtist = artists[song.originalCreatorId] || {
    displayName: 'Original Creator',
    username: 'creator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  };

  // Find root post
  const rootPost = posts?.find(
    (p) => p.id === song.originalPostId || (p.songId === song.id && p.versionId === rootVersion?.id)
  );

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) || latestVersion || rootVersion;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center shadow-md">
              <SongDnaWaveIcon size={20} color="#FFFFFF" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9F56A]">
                  Song DNA Lineage
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                  {song.totalLineageAdditions} total additions
                </span>
                <span className="text-[10px] bg-[#FF5A36]/20 text-[#FF5A36] px-2 py-0.5 rounded-full font-bold">
                  {versions.length} {versions.length === 1 ? 'version' : 'versions'}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">{song.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Root Creator & Original Post Banner */}
        <div className="bg-gradient-to-r from-white/8 via-white/5 to-transparent rounded-2xl p-4 my-3 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={originalArtist.avatarUrl}
              alt={originalArtist.displayName}
              size="md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-[#FF5A36] text-white font-extrabold px-1.5 py-0.2 rounded-xs uppercase">
                  Root Creator
                </span>
                <span className="text-xs text-white/50">{song.rootCreatedAt || 'Original Post'}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{originalArtist.displayName}</h4>
              <p className="text-[11px] text-[#D9F56A]">@{originalArtist.username} · Started this song lineage</p>
            </div>
          </div>

          {rootPost && onNavigateToPost && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToPost(rootPost.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer border border-white/10 shrink-0 text-right"
              title="Locate root post in feed"
            >
              <span>View Root Post ↗</span>
            </button>
          )}
        </div>

        {/* Main View Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl my-2 border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ai_guide')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ai_guide'
                ? 'bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <SparklesIcon size={14} color={activeTab === 'ai_guide' ? '#FFFFFF' : '#FF5A36'} />
            <span>AI Lineage Guide & Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#2C2C2E] text-white border border-white/10 shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <SongDnaWaveIcon size={14} color={activeTab === 'timeline' ? '#D9F56A' : '#8E8E93'} />
            <span>Version Timeline ({sortedVersions.length})</span>
          </button>
        </div>

        {/* View Mode: AI Guide & Next Stems */}
        {activeTab === 'ai_guide' && (
          <div className="flex-1 overflow-y-auto">
            <SongDNAGuideSection
              song={song}
              versions={sortedVersions}
              contributions={contributions}
              artists={artists}
              onSelectContributionProposal={(proposal) => {
                onClose();
                if (onCollabClick) {
                  onCollabClick(song, latestVersion, proposal);
                }
              }}
            />
          </div>
        )}

        {/* View Mode: Versions Timeline */}
        {activeTab === 'timeline' && (
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Quick Filter / Version Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mb-2 border-b border-white/5 shrink-0">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider mr-1">
                Versions:
              </span>
              {sortedVersions.map((v, i) => {
                const isSel = v.id === selectedVersion?.id;
                const isLatest = i === sortedVersions.length - 1;
                const isRoot = i === 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVersionId(v.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      isSel
                        ? 'bg-[#FF5A36] text-white shadow-xs'
                        : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <span>v{v.versionNumber.toFixed(1)}</span>
                    {isRoot && <span className="text-[9px] opacity-75">(Root)</span>}
                    {isLatest && <span className="text-[9px] text-[#D9F56A] font-black">★</span>}
                  </button>
                );
              })}
            </div>

            {/* Lineage Versions Timeline */}
            <div className="space-y-4 my-2">
          {sortedVersions.map((ver, idx) => {
            const isRoot = idx === 0;
            const isLatest = idx === sortedVersions.length - 1;
            const isSelected = ver.id === selectedVersion?.id;

            // Find parent version to calculate inherited vs newly added stems
            const parentVer = ver.parentVersionId
              ? versions.find((v) => v.id === ver.parentVersionId)
              : null;

            const allVersionContribs = contributions.filter((c) =>
              ver.orderedContributionIds.includes(c.id)
            );

            // Separate newly added in this version from inherited
            const newlyAddedContribs = parentVer
              ? allVersionContribs.filter((c) => !parentVer.orderedContributionIds.includes(c.id))
              : allVersionContribs;

            const inheritedContribs = parentVer
              ? allVersionContribs.filter((c) => parentVer.orderedContributionIds.includes(c.id))
              : [];

            return (
              <div
                key={ver.id}
                id={`lineage-version-${ver.id}`}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-white/15 to-white/5 border-[#FF5A36] ring-1 ring-[#FF5A36]/40'
                    : isLatest
                    ? 'bg-white/8 border-[#FF5A36]/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                {/* Version Title and Badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        isLatest
                          ? 'bg-[#FF5A36] text-white'
                          : isRoot
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      v{ver.versionNumber.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {ver.versionLabel || (isRoot ? 'Original Stems' : 'Collaboration Mix')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isRoot && (
                      <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-bold">
                        🌱 Root Version
                      </span>
                    )}
                    {isLatest && (
                      <span className="text-[10px] text-[#20201E] bg-[#D9F56A] px-2 py-0.5 rounded-full font-black uppercase">
                        Current Mix
                      </span>
                    )}
                  </div>
                </div>

                {ver.changelogDescription && (
                  <p className="text-xs text-white/70 mb-3 bg-black/20 p-2 rounded-xl">
                    {ver.changelogDescription}
                  </p>
                )}

                {/* Stems Section */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {/* Newly Added Stems */}
                  {newlyAddedContribs.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#D9F56A] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>✨ Added in v{ver.versionNumber.toFixed(1)}</span>
                        <span>({newlyAddedContribs.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {newlyAddedContribs.map((contrib) => {
                          const contributor = artists[contrib.contributorId] || {
                            displayName: 'Musician',
                            username: 'artist',
                            avatarUrl: '',
                          };
                          return (
                            <div
                              key={contrib.id}
                              className="flex items-center justify-between bg-black/40 border border-[#D9F56A]/20 rounded-xl px-3 py-1.5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={contributor?.avatarUrl}
                                  alt={contributor?.displayName}
                                  size="xs"
                                />
                                <span className="font-semibold text-white">
                                  {contributor?.displayName}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  @{contributor?.username}
                                </span>
                                {contrib.isOriginalStem && (
                                  <span className="text-[9px] bg-[#FF5A36]/30 text-[#FF5A36] px-1.5 py-0.2 rounded font-bold">
                                    Original
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-[#D9F56A] bg-[#D9F56A]/10 px-2 py-0.5 rounded">
                                + {contrib.partType}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inherited Stems from previous version */}
                  {inheritedContribs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                        Inherited from previous lineage ({inheritedContribs.length})
                      </div>
                      <div className="space-y-1">
                        {inheritedContribs.map((contrib) => {
                          const contributor = artists[contrib.contributorId] || {
                            displayName: 'Musician',
                            username: 'artist',
                            avatarUrl: '',
                          };
                          return (
                            <div
                              key={contrib.id}
                              className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-1 text-xs opacity-70"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={contributor?.avatarUrl}
                                  alt={contributor?.displayName}
                                  size="xs"
                                />
                                <span className="text-white/80">{contributor?.displayName}</span>
                              </div>
                              <span className="text-[11px] text-white/60 font-medium">
                                {contrib.partType}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions per Version */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/5">
                  {onOpenWorkspace && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWorkspace(song, ver);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Play this version</span>
                      <span className="text-[10px]">▶</span>
                    </button>
                  )}
                  {onCollabClick && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onCollabClick(song, ver);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-black bg-[#FF5A36] text-white hover:bg-[#F04D29] transition-all cursor-pointer shadow-xs"
                    >
                      Branch / Add Part
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (latestVersion && onOpenWorkspace) {
                onClose();
                onOpenWorkspace(song, latestVersion);
              }
            }}
            className="text-xs font-bold text-[#D9F56A] hover:underline cursor-pointer"
          >
            Jump to Latest Mix (v{latestVersion?.versionNumber.toFixed(1) || '1.0'}) ↗
          </button>

          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={onClose}
              className="bg-white/10 text-white border-transparent hover:bg-white/20"
            >
              Close
            </SecondaryButton>
            <button
              onClick={() => {
                onClose();
                if (onCollabClick) onCollabClick(song, latestVersion);
              }}
              className="px-5 py-2 rounded-full text-xs font-black bg-[#FF5A36] text-white hover:bg-[#F04D29] transition-all cursor-pointer shadow-sm"
            >
              Add Part to Song
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
