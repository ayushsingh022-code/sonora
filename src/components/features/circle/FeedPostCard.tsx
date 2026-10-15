/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Post, UserProfile, Song, SongVersion, Contribution } from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { HeartFilledIcon, ShareIcon, SongDnaWaveIcon } from '../../common/SonoraIcons';

interface FeedPostCardProps {
  post: Post;
  creator: UserProfile;
  song?: Song;
  versions?: SongVersion[];
  contributions?: Contribution[];
  allArtists: Record<string, UserProfile>;
  onInspectDNA?: (song: Song) => void;
  onOpenWorkspace?: (song: Song, version?: SongVersion) => void;
  onAddPart?: (song: Song, version?: SongVersion) => void;
  onContribute?: (song: Song, version?: SongVersion) => void;
  onOpenComments?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onToggleLike?: (postId: string) => void;
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
  onInspectDNA,
  onOpenWorkspace,
  onAddPart,
  onContribute,
  onOpenComments,
  onShare,
  onToggleLike,
}) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const multiVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Synchronize local like state whenever post prop updates
  React.useEffect(() => {
    setIsLiked(post.isLikedByCurrentUser ?? false);
    setLikesCount(post.likesCount);
  }, [post.isLikedByCurrentUser, post.likesCount]);

  const handleLikeToggle = () => {
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
    // Fallback: If post has multiple media references directly attached
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

  const partCount = activeContributions.length > 0 ? activeContributions.length : (post.media?.length || 1);
  const isMultiPart = partCount > 1 || post.postType === 'collab';

  const mediaItem = post.media[0];
  const isVideo = mediaItem?.type === 'video';

  const togglePlay = () => {
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
      if (isVideo && videoRef.current && !hasVideoError) {
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

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const handleTryDemo = () => {
    if (song && onOpenWorkspace) {
      onOpenWorkspace(song, postVersion);
    } else if (song && onInspectDNA) {
      onInspectDNA(song);
    } else {
      togglePlay();
    }
  };

  return (
    <article className="bg-white rounded-3xl overflow-hidden shadow-2xs border border-[#EFE9DF] mx-4 mb-4">
      {/* Creator Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={creator.avatarUrl}
            alt={creator.displayName}
            size="sm"
            hasStoryRing={true}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#20201E] tracking-tight hover:underline cursor-pointer">
                {creator.username}
              </span>
              {post.postType === 'collab' ? (
                <span className="text-[10px] bg-[#D9F56A] text-[#20201E] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🧬</span>
                  <span>Collab ({postVersion?.orderedContributionIds.length || 2} parts · v{(postVersion?.versionNumber ?? 2.0).toFixed(1)})</span>
                </span>
              ) : post.songId ? (
                <span className="text-[10px] bg-[#D9F56A]/30 text-[#20201E] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🧬</span>
                  <span>Song DNA (v{(postVersion?.versionNumber ?? 1.0).toFixed(1)})</span>
                </span>
              ) : creator.isOpenForCollab ? (
                <span className="text-[10px] bg-[#FFEBE5] text-[#FF5A36] font-extrabold px-1.5 py-0.2 rounded-full">
                  Collab
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#B9B2A9]">
              <span>
                {post.postType === 'collab'
                  ? '👥 Multi-Part Collaboration'
                  : post.songId
                  ? '🧬 Song DNA Track'
                  : isVideo
                  ? '🎥 Music Video'
                  : 'Original audio'}
              </span>
              <span>·</span>
              <span>{post.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions: Try Demo (if demo post) and options */}
        <div className="flex items-center gap-2">
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

          <button
            className="text-[#B9B2A9] hover:text-[#20201E] p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Post options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media Card with Right Action Rail & Caption Overlay */}
      <div className="relative aspect-4/5 w-full bg-neutral-950 overflow-hidden select-none">
        {isMultiPart && partCount > 1 ? (
          /* Multi-Part Grid Layout for Published Collaborations */
          <div
            className={`w-full h-full p-1 gap-1 bg-black/95 ${
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
              const videoUrl =
                contrib.videoReference?.url ||
                (contrib.audioReference?.type === 'video' ? contrib.audioReference.url : null) ||
                post.media[idx]?.url;

              return (
                <div
                  key={contrib.id || `contrib_${idx}`}
                  className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center group"
                >
                  {videoUrl ? (
                    <video
                      ref={(el) => {
                        multiVideoRefs.current[contrib.id || `idx_${idx}`] = el;
                      }}
                      src={videoUrl}
                      playsInline
                      loop
                      muted={isMuted}
                      onEnded={idx === 0 ? () => setIsPlaying(false) : undefined}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black p-2 text-center">
                      <Avatar
                        src={contributor.avatarUrl}
                        alt={contributor.displayName}
                        size="xs"
                      />
                      <span className="text-[10px] text-white font-bold mt-1 line-clamp-1">{contributor.displayName}</span>
                      <span className="text-[9px] text-[#D9F56A] font-bold">{contrib.partType}</span>
                    </div>
                  )}

                  {/* Per-Frame Attribution Overlay */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full pointer-events-none z-10 border border-white/10">
                    <Avatar
                      src={contributor.avatarUrl}
                      alt={contributor.displayName}
                      size="xs"
                    />
                    <span className="text-[10px] font-bold text-white truncate max-w-[90px]">
                      {contributor.username}
                    </span>
                    <span className="text-[9px] text-[#FF5A36] font-extrabold bg-[#FFEBE5] px-1 rounded-xs">
                      {contrib.partType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Video or Image Media */
          mediaItem && (
            isVideo ? (
              <video
                ref={videoRef}
                src={mediaItem.url}
                poster={mediaItem.thumbnailUrl}
                playsInline
                loop
                muted={isMuted}
                onClick={togglePlay}
                onEnded={() => setIsPlaying(false)}
                onError={() => setHasVideoError(true)}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <img
                src={mediaItem.url}
                alt={post.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )
          )
        )}

        {/* Missing Media Clear Informative State */}
        {hasVideoError && !isMultiPart && (
          <div className="absolute inset-0 bg-[#141416] flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-3 border border-amber-500/30">
              ⚠️
            </div>
            <h4 className="text-sm font-black text-white tracking-tight">Prerecorded Demo Video Missing</h4>
            <p className="text-xs text-white/70 max-w-xs mt-1.5 leading-relaxed">
              The 4-way split screen video file was not found.
            </p>
          </div>
        )}

        {/* Ambient Top & Bottom Gradients */}
        {!hasVideoError && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 pointer-events-none" />
        )}

        {/* Video / Multi-Part Badge & Mute Button */}
        {!hasVideoError && (
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            {isMultiPart && partCount > 1 ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FF5A36] text-white font-mono text-[10px] font-black tracking-wide shadow-xs">
                {partCount} PARTS
              </span>
            ) : isVideo ? (
              <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                VIDEO
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs backdrop-blur-xs cursor-pointer hover:bg-black/80"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        )}

        {/* Play / Pause Toggle Center Button */}
        {!hasVideoError && (
          <button
            onClick={togglePlay}
            className={`absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer z-10 ${
              isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
            }`}
            aria-label={isPlaying ? 'Pause' : isMultiPart ? 'Play Together' : 'Play'}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M8 5V19L19 12L8 5Z" />
              </svg>
            )}
          </button>
        )}

        {/* Right Action Rail (Vertical Buttons) */}
        <div className="absolute right-3 bottom-14 flex flex-col items-center gap-4 z-10">
          {/* Like Button */}
          <button
            onClick={handleLikeToggle}
            className="flex flex-col items-center gap-1 text-white group cursor-pointer focus-visible:outline-none"
            aria-label="Like post"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
              isLiked ? 'bg-[#FF2D8B]/20 text-[#FF2D8B]' : 'bg-black/30 backdrop-blur-md text-white'
            }`}>
              <HeartFilledIcon size={22} color={isLiked ? '#FF2D8B' : '#FFFFFF'} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-xs">
              {formatStatCount(likesCount)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => onOpenComments && onOpenComments(post)}
            className="flex flex-col items-center gap-1 text-white group cursor-pointer focus-visible:outline-none"
            aria-label="Comments"
          >
            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-xs">
              {formatStatCount(post.commentsCount)}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => onShare && onShare(post)}
            className="flex flex-col items-center gap-1 text-white group cursor-pointer focus-visible:outline-none"
            aria-label="Share"
          >
            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110">
              <ShareIcon size={19} color="#FFFFFF" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow-xs">
              {formatStatCount(post.sharesCount)}
            </span>
          </button>

          {/* Spinning Audio Disc */}
          <div className={`w-9 h-9 rounded-full bg-black/70 border border-white/40 flex items-center justify-center shadow-lg ${
            isPlaying ? 'animate-spin [animation-duration:4s]' : ''
          }`}>
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>

        {/* Bottom Overlay Info (Caption & Tags) */}
        <div className="absolute left-3.5 bottom-3.5 right-16 text-white z-10">
          <p className="text-sm font-bold leading-snug drop-shadow-sm whitespace-pre-line">
            {post.caption}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs font-semibold text-white/80 hover:text-white cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Song DNA Lineage Footer Entry Point */}
      {song && (
        <div className="p-3 bg-[#FAF7F2] border-t border-[#EFE9DF] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (onOpenWorkspace) {
                onOpenWorkspace(song, postVersion);
              } else if (onInspectDNA) {
                onInspectDNA(song);
              }
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
            title="Open Collaboration Workspace"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <SongDnaWaveIcon size={16} color="#FFFFFF" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#20201E] group-hover:text-[#FF5A36] transition-colors truncate">
                  Song DNA: {song.title}
                </span>
                <span className="text-[10px] bg-[#D9F56A] text-[#20201E] font-extrabold px-1.5 rounded shrink-0">
                  v{(postVersion?.versionNumber ?? 1.0).toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-[#B9B2A9] truncate">
                {postVersion?.orderedContributionIds.length || 1} active {postVersion?.orderedContributionIds.length === 1 ? 'part' : 'parts'} · {versions?.length || 1} {versions?.length === 1 ? 'version' : 'versions'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {/* Play Together Action */}
            <button
              type="button"
              onClick={() => {
                if (onOpenWorkspace) {
                  onOpenWorkspace(song, postVersion);
                } else if (onInspectDNA) {
                  onInspectDNA(song);
                }
              }}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold text-[#FF5A36] bg-[#FFEBE5] hover:bg-[#FFDFD6] transition-colors cursor-pointer flex items-center gap-1"
              title="Play parts together in collaboration workspace"
            >
              <span>{isMultiPart ? 'Play Together' : 'Play'}</span>
              <span className="text-[10px]">▶</span>
            </button>

            {/* Prominent Add Part Action (Phase 3B requirement) */}
            <button
              type="button"
              onClick={() => {
                const targetVer = versions?.find((v) => v.id === post.versionId) || versions?.[versions.length - 1];
                if (onAddPart) {
                  onAddPart(song, targetVer);
                } else if (onContribute) {
                  onContribute(song);
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-black text-white bg-[#FF5A36] hover:bg-[#F04D29] transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
              title="Add your performance video to this song"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Part</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
