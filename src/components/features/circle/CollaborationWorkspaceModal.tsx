/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — CollaborationWorkspaceModal (Phase 3B)
 * Core Collaborative Multi-Video Performance Workspace
 * Features:
 * 1. Synchronized Multi-Video Grid (1, 2, 3, 4, 5, 6 parts)
 * 2. Transport Controls: Play Together, Pause, Replay
 * 3. Individual Track Solo / Mute Controls
 * 4. Compact Song DNA with expandable Version Timeline
 * 5. Historical Version Switching (never deletes previous versions)
 * 6. "Add Part" action triggering the contribution flow
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Song,
  SongVersion,
  Contribution,
  UserProfile,
  Post,
  MAX_VISIBLE_CONTRIBUTIONS,
} from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { getLocalFallbackVideo } from '../../../utils/mediaFallback';
import { SongDnaWaveIcon, SparklesIcon } from '../../common/SonoraIcons';
import { MusicCopilotModal } from '../ai/MusicCopilotModal';
import { SongDNAGuideSection } from '../ai/SongDNAGuideSection';

export interface PublishCollaborationPayload {
  songId: string;
  versionId: string;
  caption?: string;
  tags?: string[];
}

interface CollaborationWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  initialVersionId?: string;
  versions: SongVersion[];
  contributions: Contribution[];
  artists: Record<string, UserProfile>;
  currentUser: UserProfile;
  onOpenAddPart: (song: Song, version: SongVersion) => void;
  onPublishCollaboration?: (
    payload: PublishCollaborationPayload
  ) => { success: boolean; error?: string; post?: Post };
}

export const CollaborationWorkspaceModal: React.FC<CollaborationWorkspaceModalProps> = ({
  isOpen,
  onClose,
  song,
  initialVersionId,
  versions,
  contributions,
  artists,
  currentUser,
  onOpenAddPart,
  onPublishCollaboration,
}) => {
  // Sort versions by versionNumber ascending
  const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const latestVersion = sortedVersions[sortedVersions.length - 1] || versions[0];

  const [activeVersionId, setActiveVersionId] = useState<string>(
    initialVersionId || latestVersion?.id || ''
  );
  const [isPlayingTogether, setIsPlayingTogether] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [showAdvancedLineage, setShowAdvancedLineage] = useState<boolean>(false);
  const [showAIGuide, setShowAIGuide] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [mutedParts, setMutedParts] = useState<Record<string, boolean>>({});

  // Collaboration Publishing States (Phase 3B Fix)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishCaption, setPublishCaption] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>({});

  // Sync activeVersionId when initialVersionId changes, modal opens, or versions change
  useEffect(() => {
    if (initialVersionId) {
      setActiveVersionId(initialVersionId);
      setIsPlayingTogether(false);
      setPlaybackProgress(0);
    } else if (isOpen && latestVersion) {
      setActiveVersionId(latestVersion.id);
      setIsPlayingTogether(false);
      setPlaybackProgress(0);
    }
  }, [isOpen, initialVersionId, versions.length]);

  const activeVersion =
    sortedVersions.find((v) => v.id === activeVersionId) || latestVersion;

  // Get active contributions for the selected version
  const activeContributions: Contribution[] = (activeVersion?.orderedContributionIds || [])
    .map((id) => contributions.find((c) => c.id === id))
    .filter((c): c is Contribution => c !== undefined);

  // References to all active video/audio elements for coordinated playback
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Clean up playback when closing or switching versions
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [activeVersionId, isOpen]);

  const stopAllMedia = () => {
    Object.values(videoRefs.current).forEach((v) => {
      if (v) {
        v.pause();
      }
    });
    Object.values(audioRefs.current).forEach((a) => {
      if (a) {
        a.pause();
      }
    });
    setIsPlayingTogether(false);
  };

  if (!isOpen || !song || !activeVersion) return null;

  const originalArtist = artists[song.originalCreatorId] || {
    displayName: 'Original Creator',
    username: 'creator',
    avatarUrl: '',
  };

  // Coordinated Play Together: play only the active contributions of the current version
  const handlePlayTogether = () => {
    let anyPlayed = false;

    activeContributions.forEach((contrib) => {
      const v = videoRefs.current[contrib.id];
      if (v) {
        v.muted = !!mutedParts[contrib.id];
        v.play().catch(() => {});
        anyPlayed = true;
      }

      const a = audioRefs.current[contrib.id];
      if (a) {
        a.muted = !!mutedParts[contrib.id];
        a.play().catch(() => {});
        anyPlayed = true;
      }
    });

    setIsPlayingTogether(true);
  };

  // Coordinated Pause: pause active contributions
  const handlePause = () => {
    activeContributions.forEach((contrib) => {
      const v = videoRefs.current[contrib.id];
      if (v) v.pause();
      const a = audioRefs.current[contrib.id];
      if (a) a.pause();
    });
    setIsPlayingTogether(false);
  };

  // Coordinated Replay: rewind and play active contributions
  const handleReplay = () => {
    activeContributions.forEach((contrib) => {
      const v = videoRefs.current[contrib.id];
      if (v) {
        v.currentTime = 0;
        v.muted = !!mutedParts[contrib.id];
        v.play().catch(() => {});
      }
      const a = audioRefs.current[contrib.id];
      if (a) {
        a.currentTime = 0;
        a.muted = !!mutedParts[contrib.id];
        a.play().catch(() => {});
      }
    });
    setPlaybackProgress(0);
    setIsPlayingTogether(true);
  };

  // Toggle Solo / Mute on a specific track
  const toggleMutePart = (contribId: string) => {
    setMutedParts((prev) => {
      const isMuted = !prev[contribId];
      const next = { ...prev, [contribId]: isMuted };
      if (videoRefs.current[contribId]) {
        videoRefs.current[contribId]!.muted = isMuted;
      }
      if (audioRefs.current[contribId]) {
        audioRefs.current[contribId]!.muted = isMuted;
      }
      return next;
    });
  };

  // Time update sync on master track
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const el = e.currentTarget;
    if (el.duration) {
      setPlaybackProgress((el.currentTime / el.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlayingTogether(false);
  };

  // Open publish collaboration confirmation modal
  const handleOpenPublishModal = () => {
    setPublishCaption(
      `Collaborative Jam on "${song.title}" with @${originalArtist.username} 🎶\n#SongDNA #Collab #v${activeVersion.versionNumber.toFixed(1)}`
    );
    setPublishError(null);
    setPublishSuccess(false);
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    if (!onPublishCollaboration) {
      setPublishError('Publishing collaboration handler is not configured.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const result = onPublishCollaboration({
        songId: song.id,
        versionId: activeVersion.id,
        caption: publishCaption.trim(),
        tags: ['collab', 'songdna', `${partCount}parts`],
      });

      if (!result.success) {
        setPublishError(result.error || 'Failed to publish collaboration. Please try again.');
        setIsPublishing(false);
      } else {
        setIsPublishing(false);
        setPublishSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while publishing.';
      setPublishError(msg);
      setIsPublishing(false);
    }
  };

  // Part count for dynamic layout
  const partCount = activeContributions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121214] text-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 max-h-[96vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 bg-[#1C1C1E] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center shrink-0 shadow-sm">
              <SongDnaWaveIcon size={20} color="#FFFFFF" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                  {song.title}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D9F56A] text-[#20201E] shrink-0">
                  v{activeVersion.versionNumber.toFixed(1)}
                </span>
                {activeVersion.id === latestVersion.id && (
                  <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                    Current Mix
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 truncate">
                {partCount} {partCount === 1 ? 'part' : 'parts'} playing together · Lineage of {originalArtist.displayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* AI Copilot Action */}
            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="px-3 sm:px-3.5 py-2 rounded-full text-xs font-black bg-gradient-to-r from-[#FF5A36]/20 to-[#FF2D8B]/20 border border-[#FF5A36]/40 hover:border-[#FF5A36] text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Get AI advice for this collaboration"
            >
              <SparklesIcon size={14} color="#FF5A36" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Publish Collaboration Action (Hidden until user has added a valid contribution) */}
            {activeContributions.some((c) => c.contributorId === currentUser.id) && (
              <button
                type="button"
                onClick={handleOpenPublishModal}
                className="px-3 sm:px-4 py-2 rounded-full text-xs font-black bg-[#D9F56A] hover:bg-[#C9E758] text-[#20201E] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Publish this collaboration take to Circle"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>Publish Collab</span>
              </button>
            )}

            {/* Add Part Button */}
            <button
              type="button"
              onClick={() => onOpenAddPart(song, activeVersion)}
              className="px-3 sm:px-4 py-2 rounded-full text-xs font-black bg-[#FF5A36] hover:bg-[#F04D29] text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Part</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close workspace"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Performance Canvas */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col justify-center min-h-[300px]">
          {partCount === 0 ? (
            <div className="p-8 text-center text-white/50">
              <p>No active parts found in this version.</p>
            </div>
          ) : (
            <div
              className={`w-full transition-all duration-300 ${
                // Dynamic responsive layouts based on part count
                partCount === 1
                  ? 'flex justify-center'
                  : partCount === 2
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto'
                  : partCount === 3
                  ? 'grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-4xl mx-auto'
                  : partCount === 4
                  ? 'grid grid-cols-2 grid-rows-2 gap-2.5 max-w-3xl mx-auto'
                  : partCount === 5
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-4xl mx-auto'
                  : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-4xl mx-auto' // 6 parts: 3x2 grid
              }`}
            >
              {activeContributions.map((contrib, index) => {
                const contributor = artists[contrib.contributorId] || {
                  displayName: 'Artist',
                  username: 'musician',
                  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                };

                const isMuted = !!mutedParts[contrib.id];
                const rawVideoUrl =
                  contrib.videoReference?.url ||
                  (contrib.audioReference?.type === 'video' ? contrib.audioReference.url : null);
                const fallbackUrl = getLocalFallbackVideo(contrib.partType, false);
                const videoUrl = videoOverrides[contrib.id] || rawVideoUrl || (contrib.audioReference ? null : fallbackUrl);

                // Special handling for 3-part layout: primary frame gets prominent col-span on mobile/desktop
                const isThreePartPrimary = partCount === 3 && index === 0;
                // Special handling for 5-part layout: last part can span 2 cols on mobile
                const isFivePartHero = partCount === 5 && index === 0;

                return (
                  <div
                    key={contrib.id}
                    className={`relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-lg group transition-transform ${
                      partCount === 1
                        ? 'w-full max-w-2xl aspect-video'
                        : isThreePartPrimary
                        ? 'sm:col-span-1 aspect-video sm:aspect-4/3'
                        : isFivePartHero
                        ? 'col-span-2 sm:col-span-1 aspect-video'
                        : 'aspect-video sm:aspect-4/3'
                    }`}
                  >
                    {videoUrl ? (
                      <video
                        ref={(el) => {
                          videoRefs.current[contrib.id] = el;
                        }}
                        src={videoUrl}
                        playsInline
                        loop
                        muted={isMuted}
                        onTimeUpdate={index === 0 ? handleTimeUpdate : undefined}
                        onEnded={index === 0 ? handleEnded : undefined}
                        onError={() => {
                          if (videoUrl !== fallbackUrl) {
                            setVideoOverrides((prev) => ({ ...prev, [contrib.id]: fallbackUrl }));
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Audio-only contribution: Render audio visualizer frame
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 text-center">
                        {contrib.audioReference?.url && (
                          <audio
                            ref={(el) => {
                              audioRefs.current[contrib.id] = el;
                            }}
                            src={contrib.audioReference.url}
                            loop
                            muted={isMuted}
                            onTimeUpdate={index === 0 ? handleTimeUpdate : undefined}
                            onEnded={index === 0 ? handleEnded : undefined}
                          />
                        )}
                        <Avatar
                          src={contributor.avatarUrl}
                          alt={contributor.displayName}
                          size="md"
                        />
                        <p className="text-xs font-bold text-white mt-2">{contributor.displayName}</p>
                        <p className="text-[10px] text-[#D9F56A] font-bold">{contrib.partType}</p>
                        {/* Audio Wave Bars Visualizer */}
                        <div className="flex items-center gap-1 mt-3">
                          {[12, 24, 16, 28, 20, 14, 26].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: isPlayingTogether ? `${h}px` : '4px' }}
                              className="w-1 bg-[#FF5A36] rounded-full transition-all duration-150"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frame Attribution Badge (Overlay) */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl pointer-events-none">
                      <Avatar
                        src={contributor.avatarUrl}
                        alt={contributor.displayName}
                        size="xs"
                      />
                      <div className="leading-tight">
                        <span className="text-[11px] font-bold text-white block">
                          {contributor.username}
                        </span>
                        <span className="text-[9px] font-extrabold text-[#D9F56A] block">
                          {contrib.partType}
                          {contrib.isOriginalStem && ' (Root)'}
                        </span>
                      </div>
                    </div>

                    {/* Frame Controls: Solo/Mute */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMutePart(contrib.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                          isMuted
                            ? 'bg-red-500/80 text-white'
                            : 'bg-black/50 backdrop-blur-md text-white/80 hover:text-white'
                        }`}
                        title={isMuted ? 'Unmute part' : 'Mute part'}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? '🔇' : '🔊'}
                      </button>
                    </div>

                    {/* Playing Pulse Dot */}
                    {isPlayingTogether && !isMuted && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-[#D9F56A] animate-pulse" />
                        <span className="text-[9px] font-bold text-white/90">LIVE</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coordinated Transport Controls Bar */}
        <div className="p-3 sm:p-4 bg-[#18181A] border-t border-white/10 flex flex-col gap-2.5">
          {/* Progress Timeline Scrubber */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] h-full transition-all duration-200"
              style={{ width: `${playbackProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Play Together / Pause / Replay Buttons */}
            <div className="flex items-center gap-2">
              {isPlayingTogether ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-4 py-2 rounded-full bg-white text-[#20201E] font-black text-xs hover:bg-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlayTogether}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white font-black text-xs hover:opacity-95 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5V19L19 12L8 5Z" />
                  </svg>
                  <span>Play Together ({partCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReplay}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Replay from start"
                aria-label="Replay"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </button>
            </div>

            {/* Quick Summary / Toggle Timeline Icon */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/60">
                <span>Mix:</span>
                <span className="font-bold text-white">
                  {partCount}/{MAX_VISIBLE_CONTRIBUTIONS} parts
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAIGuide(!showAIGuide);
                  if (!showAIGuide) setShowAdvancedLineage(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showAIGuide
                    ? 'bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <SparklesIcon size={12} color={showAIGuide ? '#FFFFFF' : '#FF5A36'} />
                <span>AI Guide & Radar</span>
                <span className="text-[10px]">{showAIGuide ? '▲' : '▼'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdvancedLineage(!showAdvancedLineage);
                  if (!showAdvancedLineage) setShowAIGuide(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showAdvancedLineage
                    ? 'bg-[#D9F56A] text-[#20201E]'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <span>🧬 DNA Timeline ({sortedVersions.length})</span>
                <span className="text-[10px]">{showAdvancedLineage ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Song DNA Section (Section 3: Simple by default, expandable details) */}
        <div className="p-3 sm:p-4 bg-[#141416] border-t border-white/5">
          {/* Simple Default Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={originalArtist.avatarUrl}
                alt={originalArtist.displayName}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Root by {originalArtist.displayName} (@{originalArtist.username})
                </p>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span>Version {activeVersion.versionNumber.toFixed(1)}</span>
                  <span>•</span>
                  <span>{song.totalLineageAdditions} total lineage contributions</span>
                </div>
              </div>
            </div>

            {/* Contributor Avatars Cluster */}
            <div className="flex items-center -space-x-2 shrink-0">
              {activeContributions.map((c) => {
                const musician = artists[c.contributorId];
                return (
                  <div key={c.id} title={`${musician?.displayName || 'Artist'} (${c.partType})`}>
                    <Avatar
                      src={musician?.avatarUrl}
                      alt={musician?.displayName || 'Artist'}
                      size="xs"
                      className="border-2 border-[#141416]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable Advanced Timeline (loads actual video set for chosen version!) */}
          {showAdvancedLineage && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/50 uppercase tracking-wider">
                <span>Select a version to load its performances:</span>
                <span>Rule: Immutable History</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sortedVersions.map((ver) => {
                  const isSelected = ver.id === activeVersion.id;
                  const verContribs = contributions.filter((c) =>
                    ver.orderedContributionIds.includes(c.id)
                  );
                  const verCreator = artists[ver.createdByUserId];

                  return (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => {
                        stopAllMedia();
                        setActiveVersionId(ver.id);
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white shadow-sm'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-white/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#FF5A36] text-white'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          v{ver.versionNumber.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-[#D9F56A] font-bold">
                          {verContribs.length} parts
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate">
                        {ver.versionLabel || 'Stem Take'}
                      </p>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">
                        by {verCreator?.username || 'artist'} · {ver.changelogDescription || 'Musical contribution'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* 6 Visible Stems rule explanation if at capacity */}
              {activeContributions.length >= MAX_VISIBLE_CONTRIBUTIONS && (
                <div className="p-2.5 bg-white/5 rounded-xl text-[11px] text-white/60 flex items-center gap-2">
                  <span className="text-[#D9F56A]">✓</span>
                  <span>
                    Mix has reached the maximum of {MAX_VISIBLE_CONTRIBUTIONS} visible parts. Adding new parts replaces the oldest non-root stem while preserving the entire historical tree.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expandable AI Song DNA Guide Section */}
          {showAIGuide && (
            <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-150 max-h-[50vh] overflow-y-auto">
              <SongDNAGuideSection
                song={song}
                versions={sortedVersions}
                contributions={contributions}
                artists={artists}
                onSelectContributionProposal={(proposal) => {
                  setShowAIGuide(false);
                  onOpenAddPart(song, activeVersion);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Publish Collaboration Confirmation & Success Dialog */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1C1C1E] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-in zoom-in-95 duration-150 p-5 sm:p-6 space-y-4">
            {publishSuccess ? (
              /* Success State */
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-full bg-[#D9F56A]/20 text-[#D9F56A] flex items-center justify-center mx-auto text-2xl font-black border border-[#D9F56A]/30">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Collaboration Published to Circle!
                  </h3>
                  <p className="text-xs text-white/70 mt-1 max-w-xs mx-auto">
                    Your version <span className="font-bold text-[#D9F56A]">v{activeVersion.versionNumber.toFixed(1)}</span> with {partCount} synchronized parts is now live in Circle.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishModalOpen(false);
                      onClose(); // Return to Circle immediately
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-black bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    Return to Circle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishModalOpen(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Keep Jamming
                  </button>
                </div>
              </div>
            ) : (
              /* Confirmation Form */
              <>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white">
                      <SongDnaWaveIcon size={16} color="#FFFFFF" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-tight text-white">
                        Publish Collaboration
                      </h3>
                      <p className="text-[11px] text-white/50">
                        {song.title} · v{activeVersion.versionNumber.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Summary Card */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Active mix:</span>
                    <span className="font-bold text-[#D9F56A]">
                      {partCount} {partCount === 1 ? 'part' : 'parts'} synchronized
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-[11px] text-white/50">Contributors:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeContributions.map((c) => {
                        const artist = artists[c.contributorId];
                        return (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 font-medium"
                          >
                            <span>{artist?.displayName || 'Musician'}</span>
                            <span className="text-white/40">({c.partType})</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-white/50 pt-1 border-t border-white/5">
                    Rule: Publishes a dedicated collaboration post on Circle credited to @{currentUser.username} while preserving the original post and historical versions.
                  </p>
                </div>

                {/* Caption Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80">Caption</label>
                  <textarea
                    value={publishCaption}
                    onChange={(e) => setPublishCaption(e.target.value)}
                    rows={3}
                    className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D9F56A] transition-colors resize-none"
                    placeholder="Add a caption for your collaboration take..."
                  />
                </div>

                {/* Error Alert */}
                {publishError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                    <span className="text-red-400 font-bold">⚠️</span>
                    <span className="flex-1">{publishError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    disabled={isPublishing}
                    className="px-4 py-2 rounded-full text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="px-4 py-2 rounded-full text-xs font-black bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#20201E] border-t-transparent rounded-full animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Publish to Circle</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Music Copilot Modal */}
      {isCopilotOpen && (
        <MusicCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          songTitle={song.title}
          initialGenre={artists[song.originalCreatorId]?.genres?.[0] || 'Indie'}
          contextTitle={`AI Copilot · ${song.title}`}
          existingParts={activeContributions.map((c) => ({
            instrument: c.partType,
            creatorName: artists[c.contributorId]?.displayName || 'Artist',
            note: c.isOriginalStem ? 'Original Stem' : c.partType,
          }))}
          onApplySuggestions={(res) => {
            setIsCopilotOpen(false);
            if (res.instrument) {
              onOpenAddPart(song, activeVersion);
            }
          }}
        />
      )}
    </div>
  );
};
