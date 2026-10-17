/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Post, UserProfile, Song, SongVersion, Contribution } from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { HeartFilledIcon, ShareIcon, SongDnaWaveIcon, BookmarkIcon } from '../../common/SonoraIcons';
import { getLocalFallbackVideo } from '../../../utils/mediaFallback';

interface FeedPostCardProps {
  post: Post;
  creator: UserProfile;
  song?: Song;
  versions?: SongVersion[];
  contributions?: Contribution[];
  allArtists: Record<string, UserProfile>;
  isSaved?: boolean;
  isPlaybackPaused?: boolean;
  onInspectDNA?: (song: Song) => void;
  onOpenWorkspace?: (song: Song, version?: SongVersion) => void;
  onAddPart?: (song: Song, version?: SongVersion, initialContribution?: Contribution) => void;
  onContribute?: (song: Song, version?: SongVersion) => void;
  onOpenComments?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onToggleLike?: (postId: string) => void;
  onToggleBookmark?: (post: Post) => void;
  onNavigateToStage?: (artistIdOrHandle: string) => void;
}

export const formatStatCount = (count: number): string => {
  if (!count || count < 0) return '0';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  creator,
  song,
  versions,
  contributions,
  allArtists,
  isSaved = false,
  isPlaybackPaused = false,
  onInspectDNA,
  onOpenWorkspace,
  onAddPart,
  onContribute,
  onOpenComments,
  onShare,
  onToggleLike,
  onToggleBookmark,
  onNavigateToStage,
}) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isBookmarked, setIsBookmarked] = useState(isSaved || (post.isBookmarkedByCurrentUser ?? false));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoOverride, setVideoOverride] = useState<string | null>(null);
  const [hasPermanentVideoError, setHasPermanentVideoError] = useState(false);
  const [partVideoOverrides, setPartVideoOverrides] = useState<Record<string, string>>({});
  const [partPermanentErrors, setPartPermanentErrors] = useState<Record<string, boolean>>({});
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const multiVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Synchronize local states when props update
  useEffect(() => {
    setIsLiked(post.isLikedByCurrentUser ?? false);
    setLikesCount(post.likesCount);
  }, [post.isLikedByCurrentUser, post.likesCount]);

  useEffect(() => {
    setIsBookmarked(isSaved || (post.isBookmarkedByCurrentUser ?? false));
  }, [isSaved, post.isBookmarkedByCurrentUser]);

  // Reel playback lifecycle: stop when Add Part is opened
  useEffect(() => {
    if (isPlaybackPaused) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      Object.values(multiVideoRefs.current).forEach((v) => v?.pause());
      setIsPlaying(false);
    }
  }, [isPlaybackPaused]);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLike) {
      onToggleLike(post.id);
    } else {
      if (isLiked) {
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !isBookmarked;
    setIsBookmarked(nextSaved);
    if (onToggleBookmark) {
      onToggleBookmark(post);
    }
  };

  const postVersion =
    (post.versionId ? versions?.find((v) => v.id === post.versionId) : undefined) ||
    versions?.[versions.length - 1];

  // Resolve all visible contributions belonging to the published version
  const activeContributions = React.useMemo(() => {
    if (postVersion?.orderedContributionIds && contributions) {
      const list = postVersion.orderedContributionIds
        .map((cid) => contributions.find((c) => c.id === cid))
        .filter((c): c is Contribution => c !== undefined);
      if (list.length > 0) return list;
    }
    // Fallback if multiple media attached
    if (post.media && post.media.length > 1) {
      return post.media.map((m, idx) => ({
        id: `media_${post.id}_${idx}`,
        songId: post.songId || '',
        versionId: post.versionId || '',
        contributorId: post.creatorId,
        partType: idx === 0 ? 'Original' : `Part ${idx + 1}`,
        videoReference: m.type === 'video' ? m : undefined,
        audioReference: m.type === 'audio' ? m : undefined,
        orderIndex: idx,
        createdAt: post.createdAt,
      } as Contribution));
    }
    return [];
  }, [postVersion, contributions, post]);

  // Determine if this reel is eligible for Song DNA / Add Part collaboration
  const isEligibleMusicReel = Boolean(
    song ||
    post.songId ||
    (post.media && post.media.length > 0) ||
    post.postType === 'video' ||
    post.postType === 'jam' ||
    post.postType === 'collab'
  );

  const effectiveSong: Song = React.useMemo(() => {
    if (song) return song;
    return {
      id: post.songId || `song_${post.id}`,
      title: post.caption
        ? post.caption.split('\n')[0].replace(/#\S+/g, '').trim().slice(0, 28) || `${creator.displayName || creator.username}'s Jam`
        : `${creator.displayName || creator.username}'s Jam`,
      originalCreatorId: post.creatorId,
      originalPostId: post.id,
      lineageIdentifier: `dna_${post.id}`,
      totalLineageAdditions: 1,
      rootCreatedAt: post.createdAt || new Date().toISOString(),
    };
  }, [song, post, creator]);

  const effectiveVersion: SongVersion = React.useMemo(() => {
    if (postVersion) return postVersion;
    return {
      id: post.versionId || `ver_${effectiveSong.id}_root`,
      songId: effectiveSong.id,
      parentVersionId: null,
      versionNumber: 1.0,
      versionLabel: 'Original Mix',
      orderedContributionIds: [`contrib_${post.id}_stem0`],
      createdAt: post.createdAt || new Date().toISOString(),
      createdByUserId: post.creatorId,
      changelogDescription: post.caption || 'Original track stem',
    };
  }, [postVersion, effectiveSong, post]);

  const standaloneInitialContribution = React.useMemo(() => {
    if (song && postVersion && activeContributions.length > 0) return undefined;
    const mediaItem = post.media && post.media.length > 0 ? post.media[0] : undefined;
    return {
      id: `contrib_${post.id}_stem0`,
      songId: effectiveSong.id,
      versionId: effectiveVersion.id,
      contributorId: post.creatorId,
      partType: 'Original' as const,
      videoReference: mediaItem?.type === 'video' ? mediaItem : undefined,
      audioReference: mediaItem,
      orderIndex: 0,
      isOriginalStem: true,
      createdAt: post.createdAt || new Date().toISOString(),
    } as Contribution;
  }, [song, postVersion, activeContributions.length, post, effectiveSong.id, effectiveVersion.id]);

  // List of extra contributors besides the original creator
  const extraContributors = React.useMemo(() => {
    const list: UserProfile[] = [];
    const seenIds = new Set<string>([creator.id, post.creatorId]);

    activeContributions.forEach((c) => {
      if (c.contributorId && !seenIds.has(c.contributorId)) {
        seenIds.add(c.contributorId);
        const art = allArtists[c.contributorId];
        if (art) list.push(art);
      }
    });

    return list;
  }, [activeContributions, creator.id, post.creatorId, allArtists]);

  const partCount = activeContributions.length > 0 ? activeContributions.length : (post.media?.length || 1);
  const isMultiPart = partCount > 1 || post.postType === 'collab';

  const mediaItem = post.media && post.media.length > 0 ? post.media[0] : undefined;
  const isVideo = mediaItem ? mediaItem.type === 'video' : (post.postType === 'video' || post.postType === 'jam');

  // Determine ideal bundled video fallback for this post
  const targetSingleFallbackVideo = React.useMemo(() => {
    return getLocalFallbackVideo(effectiveSong?.title || post.tags?.[0], isMultiPart);
  }, [effectiveSong?.title, post.tags, isMultiPart]);

  const activeVideoSrc = videoOverride || (mediaItem?.url || targetSingleFallbackVideo);

  const handleSingleVideoError = () => {
    if (activeVideoSrc !== targetSingleFallbackVideo) {
      // First fallback: Switch to suitable bundled local demo video
      setVideoOverride(targetSingleFallbackVideo);
      setHasPermanentVideoError(false);
    } else {
      // Both original and local fallback failed: Show polished placeholder
      setHasPermanentVideoError(true);
    }
  };

  const handleRetrySingleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasPermanentVideoError(false);
    setVideoOverride(targetSingleFallbackVideo);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (isPlaybackPaused) return;

    if (isMultiPart && partCount > 1) {
      if (isPlaying) {
        Object.values(multiVideoRefs.current).forEach((v) => v?.pause());
        setIsPlaying(false);
      } else {
        Object.values(multiVideoRefs.current).forEach((v) => {
          if (v) {
            v.muted = isMuted;
            v.play().catch(() => {});
          }
        });
        setIsPlaying(true);
      }
    } else {
      if (videoRef.current && !hasPermanentVideoError) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.muted = isMuted;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (isMultiPart && partCount > 1) {
      Object.values(multiVideoRefs.current).forEach((v) => {
        if (v) v.muted = newMuted;
      });
    } else if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const handleTryDemo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song && onOpenWorkspace) {
      onOpenWorkspace(song, postVersion);
    } else if (song && onInspectDNA) {
      onInspectDNA(song);
    } else {
      togglePlay();
    }
  };

  return (
    <article
      className="relative bg-neutral-950 rounded-3xl overflow-hidden shadow-sm border border-[#EFE9DF] mx-4 mb-4 select-none"
      style={{ minHeight: '440px' }}
    >
      {/* ------------------------------------------------------------- */}
      {/* MEDIA CONTAINER (Video / Multi-Part Video Grid)               */}
      {/* ------------------------------------------------------------- */}
      <div className="relative aspect-4/5 w-full bg-neutral-950 overflow-hidden">
        {isMultiPart && partCount > 1 ? (
          /* Multi-Part Synchronized Grid Layout */
          <div
            onClick={togglePlay}
            className={`w-full h-full p-1 gap-1 bg-black cursor-pointer ${
              partCount === 2
                ? 'grid grid-rows-2'
                : partCount === 3
                ? 'grid grid-rows-3'
                : partCount === 4
                ? 'grid grid-cols-2 grid-rows-2'
                : 'grid grid-cols-2 grid-rows-3'
            }`}
          >
            {activeContributions.map((contrib, idx) => {
              const contributor = allArtists[contrib.contributorId] || {
                displayName: 'Artist',
                username: 'musician',
                avatarUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              };
              const rawVideoUrl =
                contrib.videoReference?.url ||
                (contrib.audioReference?.type === 'video' ? contrib.audioReference.url : null) ||
                post.media?.[idx]?.url;
              const fallbackUrl = getLocalFallbackVideo(contrib.partType, false);
              const activeUrl = partVideoOverrides[contrib.id] || rawVideoUrl || fallbackUrl;
              const hasFramePermanentError = partPermanentErrors[contrib.id];

              return (
                <div
                  key={contrib.id || `contrib_${idx}`}
                  className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center group"
                >
                  {!hasFramePermanentError ? (
                    <video
                      ref={(el) => {
                        multiVideoRefs.current[contrib.id || `idx_${idx}`] = el;
                      }}
                      src={activeUrl}
                      playsInline
                      loop
                      muted={isMuted}
                      onEnded={idx === 0 ? () => setIsPlaying(false) : undefined}
                      onError={() => {
                        if (activeUrl !== fallbackUrl) {
                          setPartVideoOverrides((prev) => ({ ...prev, [contrib.id]: fallbackUrl }));
                        } else {
                          setPartPermanentErrors((prev) => ({ ...prev, [contrib.id]: true }));
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-2 text-center select-none">
                      <Avatar src={contributor.avatarUrl} alt={contributor.displayName} size="xs" />
                      <span className="text-[10px] text-white font-bold mt-1 line-clamp-1">
                        {contributor.displayName}
                      </span>
                      <span className="text-[9px] text-[#FF5A36] font-bold">{contrib.partType}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPartPermanentErrors((prev) => ({ ...prev, [contrib.id]: false }));
                          setPartVideoOverrides((prev) => ({ ...prev, [contrib.id]: fallbackUrl }));
                        }}
                        className="mt-1 text-[8px] text-white/80 hover:text-white bg-white/15 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                      >
                        ↻ Retry
                      </button>
                    </div>
                  )}

                  {/* Per-Frame Attribution Micro-badge */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full pointer-events-none z-10 border border-white/10">
                    <span className="text-[9px] font-bold text-white truncate max-w-[70px]">
                      {contributor.username}
                    </span>
                    <span className="text-[8px] text-[#FF5A36] font-black bg-[#FFEBE5] px-1 rounded-xs">
                      {contrib.partType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Video or Image */
          isVideo ? (
            <video
              ref={videoRef}
              src={activeVideoSrc}
              poster={mediaItem?.thumbnailUrl}
              playsInline
              loop
              muted={isMuted}
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
              onError={handleSingleVideoError}
              className="w-full h-full object-cover cursor-pointer"
            />
          ) : mediaItem?.url ? (
            <img
              src={mediaItem.url}
              alt={post.caption}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
              loading="lazy"
            />
          ) : (
            <video
              ref={videoRef}
              src={targetSingleFallbackVideo}
              playsInline
              loop
              muted={isMuted}
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
              onError={handleSingleVideoError}
              className="w-full h-full object-cover cursor-pointer"
            />
          )
        )}

        {/* Polished, non-black media placeholder with retry option */}
        {hasPermanentVideoError && !isMultiPart && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#18181B] via-[#09090B] to-[#18181B] flex flex-col items-center justify-center p-6 text-center text-white z-20 select-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5A36]/20 to-[#FF2D8B]/20 border border-[#FF5A36]/30 flex items-center justify-center text-2xl mb-3 shadow-lg">
              <SongDnaWaveIcon size={24} color="#FF5A36" />
            </div>
            <h4 className="text-sm font-black text-white">{effectiveSong?.title || 'Musical Reel'}</h4>
            <p className="text-xs text-white/70 max-w-xs mt-1">
              Performance stream preview temporarily paused.
            </p>
            <button
              type="button"
              onClick={handleRetrySingleVideo}
              className="mt-4 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
            >
              <span>↻</span>
              <span>Retry Playback</span>
            </button>
          </div>
        )}

        {/* Cinematic Vignette / Readability Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35 pointer-events-none z-10" />

        {/* ------------------------------------------------------------- */}
        {/* TOP CONTROLS (Mute, Part Tag, Try Demo)                       */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs backdrop-blur-md hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {isMultiPart && partCount > 1 ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FF5A36] text-white font-mono text-[10px] font-black tracking-wide shadow-xs">
                {partCount} PARTS
              </span>
            ) : isVideo ? (
              <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] font-bold backdrop-blur-md border border-white/10">
                REEL
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {post.isDemoPost && (
              <button
                type="button"
                onClick={handleTryDemo}
                className="px-3 py-1 rounded-full bg-[#D9F56A] text-[#20201E] text-xs font-black shadow-xs hover:bg-[#C9E758] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>▶</span>
                <span>Try demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Play/Pause Toggle Center Button */}
        {!hasPermanentVideoError && (
          <button
            onClick={togglePlay}
            className={`absolute inset-0 m-auto w-13 h-13 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer z-20 ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
            }`}
            aria-label={isPlaying ? 'Pause' : isMultiPart ? 'Play Together' : 'Play'}
          >
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M8 5V19L19 12L8 5Z" />
              </svg>
            )}
          </button>
        )}

        {/* ------------------------------------------------------------- */}
        {/* RIGHT ACTION RAIL (Like, Comment, Share, Red Bookmark)        */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute right-2.5 bottom-3.5 z-30 flex flex-col items-center gap-3">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className="flex flex-col items-center gap-0.5 text-white group cursor-pointer focus:outline-none"
            aria-label="Like reel"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover:scale-110 active:scale-90 ${
                isLiked ? 'bg-[#FF2D8B]/25 text-[#FF2D8B]' : 'bg-black/40 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <HeartFilledIcon size={20} color={isLiked ? '#FF2D8B' : '#FFFFFF'} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-xs">
              {formatStatCount(likesCount)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenComments) onOpenComments(post);
            }}
            className="flex flex-col items-center gap-0.5 text-white group cursor-pointer focus:outline-none"
            aria-label="Comments"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 active:scale-90 border border-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-xs">
              {formatStatCount(post.commentsCount)}
            </span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onShare) onShare(post);
            }}
            className="flex flex-col items-center gap-0.5 text-white group cursor-pointer focus:outline-none"
            aria-label="Share reel"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 active:scale-90 border border-white/10">
              <ShareIcon size={17} color="#FFFFFF" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-xs">
              {formatStatCount(post.sharesCount)}
            </span>
          </button>

          {/* Red Bookmark / Save to Playlist Action (Requirement 1) */}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            className="flex flex-col items-center gap-0.5 text-white group cursor-pointer focus:outline-none"
            aria-label={isBookmarked ? 'Saved to playlist' : 'Save to playlist'}
            title={isBookmarked ? 'Saved in your playlist' : 'Save reel to playlist'}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover:scale-110 active:scale-90 ${
                isBookmarked
                  ? 'bg-[#FF2D8B]/30 text-[#FF2D8B] ring-1 ring-[#FF2D8B]'
                  : 'bg-black/40 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <BookmarkIcon size={18} color={isBookmarked ? '#FF2D8B' : '#FFFFFF'} isFilled={isBookmarked} />
            </div>
            <span
              className={`text-[9px] font-black drop-shadow-xs uppercase tracking-tight ${
                isBookmarked ? 'text-[#FF2D8B]' : 'text-white/80'
              }`}
            >
              {isBookmarked ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Spinning Audio Disc */}
          <div
            className={`w-8 h-8 rounded-full bg-black/80 border border-white/30 flex items-center justify-center shadow-md mt-0.5 ${
              isPlaying ? 'animate-spin [animation-duration:3.5s]' : ''
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* NATIVE BOTTOM REEL OVERLAY (Inspired by Instagram Reels)       */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute left-3.5 bottom-3.5 right-14 sm:right-16 z-20 flex flex-col gap-2 text-white pointer-events-auto">
          {/* Row 1: Original Creator & Contributor Avatars Cluster */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              onClick={() => onNavigateToStage && onNavigateToStage(creator.id || creator.username)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <Avatar
                src={creator.avatarUrl}
                alt={creator.displayName}
                size="sm"
                hasStoryRing={true}
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-white tracking-tight group-hover:underline drop-shadow-xs truncate max-w-[130px]">
                  {creator.displayName || creator.username}
                </span>
                <span className="text-[10px] text-white/60 font-medium">
                  @{creator.username}
                </span>
              </div>
            </div>

            {/* Overlapping Contributor Avatars (without excessive names or text) */}
            {extraContributors.length > 0 && (
              <div
                className="flex items-center -space-x-2 ml-1"
                title={`${extraContributors.length} additional contributor${extraContributors.length > 1 ? 's' : ''}`}
              >
                {extraContributors.slice(0, 3).map((contrib) => (
                  <div
                    key={contrib.id}
                    onClick={() => onNavigateToStage && onNavigateToStage(contrib.id)}
                    className="cursor-pointer transition-transform hover:scale-110 hover:z-10"
                    title={contrib.displayName}
                  >
                    <img
                      src={contrib.avatarUrl}
                      alt={contrib.displayName}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-black border border-white/40 shadow-xs"
                    />
                  </div>
                ))}
                {extraContributors.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-black/70 border border-white/30 text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-black">
                    +{extraContributors.length - 3}
                  </span>
                )}
              </div>
            )}

            {creator.isOpenForCollab && (
              <span className="text-[9px] bg-[#FF5A36] text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-2xs">
                Collab
              </span>
            )}
          </div>

          {/* Row 2: Caption & Hashtags */}
          <div className="max-w-full">
            <p
              onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
              className={`text-xs text-white/95 leading-snug drop-shadow-xs cursor-pointer ${
                isCaptionExpanded ? 'whitespace-pre-line' : 'line-clamp-2'
              }`}
            >
              {post.caption}
            </p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold text-white/75 hover:text-white transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Integrated Song DNA & Add Part Native Action Bar */}
          {isEligibleMusicReel && (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {/* Native Song DNA Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInspectDNA) onInspectDNA(effectiveSong);
                  else if (onOpenWorkspace) onOpenWorkspace(effectiveSong, effectiveVersion);
                }}
                className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                title={`Song DNA: ${effectiveSong.title} (v${(effectiveVersion?.versionNumber ?? 1.0).toFixed(1)})`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white shrink-0">
                  <SongDnaWaveIcon size={10} color="#FFFFFF" />
                </div>
                <span className="truncate max-w-[110px] text-white font-bold">{effectiveSong.title}</span>
                <span className="text-[10px] text-[#D9F56A] font-black">
                  v{(effectiveVersion?.versionNumber ?? 1.0).toFixed(1)}
                </span>
              </button>

              {/* Native Add Part Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddPart) {
                    onAddPart(effectiveSong, effectiveVersion, standaloneInitialContribution);
                  } else if (onContribute) {
                    onContribute(effectiveSong, effectiveVersion);
                  }
                }}
                className="bg-[#FF5A36] hover:bg-[#F04D29] text-white rounded-full px-3 py-1 text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                title="Add your recorded part or video stem to this song"
              >
                <span className="text-xs leading-none font-black">+</span>
                <span>Add Part</span>
              </button>

              {/* Play Together / Mix Pill */}
              {(song || (activeContributions && activeContributions.length > 1) || isMultiPart) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenWorkspace) {
                      onOpenWorkspace(effectiveSong, effectiveVersion);
                    } else {
                      togglePlay();
                    }
                  }}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  title="Open collaboration mix"
                >
                  <span>Mix</span>
                  <span className="text-[9px]">▶</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
