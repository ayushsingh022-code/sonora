/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { UserProfile, Post, Song, SongVersion, Contribution, PostType, Comment } from '../../../types/models';
import { PageHeader } from '../../common/PageHeader';
import { BellIcon, SearchIcon } from '../../common/SonoraIcons';
import { CreatorEntryPoint } from './CreatorEntryPoint';
import { StoryCircleList } from './StoryCircleList';
import { FeedPostCard } from './FeedPostCard';
import { SongDNALineageModal } from './SongDNALineageModal';
import { CreatePostModal, CreatePostSubmitPayload } from './CreatePostModal';
import { AddPartModal, PublishPartPayload, AddPartSubmitPayload } from './AddPartModal';
import {
  CollaborationWorkspaceModal,
  PublishCollaborationPayload,
} from './CollaborationWorkspaceModal';
import { PostCommentsModal } from './PostCommentsModal';
import { EmptyState } from '../../common/FeedbackStates';

interface CircleScreenProps {
  currentUser: UserProfile;
  artists: Record<string, UserProfile>;
  posts: Post[];
  songs: Song[];
  songVersions: SongVersion[];
  contributions: Contribution[];
  comments?: Comment[];
  savedPostIds?: string[];
  onAddPost: (payload: CreatePostSubmitPayload) => void;
  onAddPartContribution: (payload: any) => { newVersion: SongVersion; updatedSong: Song };
  onPublishCollaboration?: (
    payload: PublishCollaborationPayload
  ) => { success: boolean; error?: string; post?: Post };
  onPublishCollaborationPart?: (
    payload: PublishPartPayload
  ) => Promise<{ success: boolean; error?: string; post?: Post }> | { success: boolean; error?: string; post?: Post };
  onNavigateToStage: (artistId?: string) => void;
  onToggleLike?: (postId: string) => void;
  onToggleBookmark?: (post: Post) => Promise<{ success: boolean; isSaved: boolean; message: string }> | void;
  onAddComment?: (postId: string, text: string) => { success: boolean; error?: string };
  initialWorkspaceSong?: Song | null;
  initialWorkspaceVersionId?: string | null;
  initialAddPartSong?: { song: Song; version?: SongVersion } | null;
  onClearInitialWorkspace?: () => void;
  onOpenTutorial?: () => void;
}

export const CircleScreen: React.FC<CircleScreenProps> = ({
  currentUser,
  artists,
  posts,
  songs,
  songVersions,
  contributions,
  comments = [],
  savedPostIds = [],
  onAddPost,
  onAddPartContribution,
  onPublishCollaboration,
  onPublishCollaborationPart,
  onNavigateToStage,
  onToggleLike,
  onToggleBookmark,
  onAddComment,
  initialWorkspaceSong,
  initialWorkspaceVersionId,
  initialAddPartSong,
  onClearInitialWorkspace,
  onOpenTutorial,
}) => {
  const [selectedSongDNA, setSelectedSongDNA] = useState<Song | null>(null);
  const [activeWorkspaceSong, setActiveWorkspaceSong] = useState<Song | null>(null);
  const [activeWorkspaceVersionId, setActiveWorkspaceVersionId] = useState<string | undefined>(undefined);
  const [addPartTarget, setAddPartTarget] = useState<{
    song: Song;
    parentVersion: SongVersion;
    initialContribution?: Contribution;
  } | null>(null);

  // Sync initial workspace or add part targets from navigation (e.g. from Explore)
  React.useEffect(() => {
    if (initialWorkspaceSong) {
      setActiveWorkspaceSong(initialWorkspaceSong);
      if (initialWorkspaceVersionId) {
        setActiveWorkspaceVersionId(initialWorkspaceVersionId);
      }
      if (onClearInitialWorkspace) onClearInitialWorkspace();
    }
  }, [initialWorkspaceSong, initialWorkspaceVersionId, onClearInitialWorkspace]);

  React.useEffect(() => {
    if (initialAddPartSong) {
      handleOpenAddPart(initialAddPartSong.song, initialAddPartSong.version);
      if (onClearInitialWorkspace) onClearInitialWorkspace();
    }
  }, [initialAddPartSong, onClearInitialWorkspace]);

  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<PostType>('post');
  const [createInitialSongId, setCreateInitialSongId] = useState<string | undefined>(undefined);
  const [activeStoryArtist, setActiveStoryArtist] = useState<UserProfile | null>(null);

  const artistsList = useMemo(() => Object.values(artists), [artists]);

  const handleOpenCreate = (type: PostType = 'post', songId?: string) => {
    setCreateInitialType(type);
    setCreateInitialSongId(songId);
    setIsCreateModalOpen(true);
  };

  const handleInspectDNA = (song: Song) => {
    setSelectedSongDNA(song);
  };

  // Open the Collaboration Workspace modal
  const handleOpenWorkspace = (song: Song, version?: SongVersion) => {
    setActiveWorkspaceSong(song);
    if (version) {
      setActiveWorkspaceVersionId(version.id);
    } else {
      const songVers = songVersions.filter((v) => v.songId === song.id);
      const latest = [...songVers].sort((a, b) => b.versionNumber - a.versionNumber)[0];
      setActiveWorkspaceVersionId(latest?.id);
    }
  };

  // Open the Add Part contribution flow
  const handleOpenAddPart = (
    song: Song,
    version?: SongVersion,
    initialContribution?: Contribution
  ) => {
    const songVers = songVersions.filter((v) => v.songId === song.id);
    const targetVersion =
      version ||
      [...songVers].sort((a, b) => b.versionNumber - a.versionNumber)[0] || {
        id: `ver_root_${song.id}`,
        songId: song.id,
        parentVersionId: null,
        versionNumber: 1.0,
        versionLabel: 'Original Root',
        orderedContributionIds: initialContribution ? [initialContribution.id] : [],
        createdAt: new Date().toISOString(),
        createdByUserId: song.originalCreatorId,
      };

    setAddPartTarget({
      song,
      parentVersion: targetVersion,
      initialContribution,
    });
  };

  // Confirm contribution: create child version and open the updated collaboration workspace
  const handleConfirmAddPart = (payload: AddPartSubmitPayload): { success: boolean; error?: string } => {
    try {
      const result = onAddPartContribution(payload);

      if (!result || !result.newVersion || !result.updatedSong) {
        return {
          success: false,
          error: 'Unable to save contribution to song. Please verify input and try again.',
        };
      }

      // Close the AddPartModal on success
      setAddPartTarget(null);

      // Open and refresh Collaboration Workspace to the newly created version
      setActiveWorkspaceSong(result.updatedSong);
      setActiveWorkspaceVersionId(result.newVersion.id);

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save part to song.';
      return { success: false, error: msg };
    }
  };

  const handleSelectStory = (artist: UserProfile | 'currentUser') => {
    if (artist === 'currentUser') {
      handleOpenCreate('post');
    } else {
      setActiveStoryArtist(artist);
      setTimeout(() => {
        setActiveStoryArtist(null);
      }, 3500);
    }
  };

  // Sharing with native share and safe clipboard fallback
  const handleSharePost = async (post: Post) => {
    const postUrl = `${window.location.origin}/#post-${post.id}`;
    const shareData = {
      title: `Sonora: ${post.caption.slice(0, 40)}`,
      text: post.caption,
      url: postUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        setToastMessage('Link copied to clipboard!');
        setTimeout(() => setToastMessage(null), 2500);
      } else {
        setToastMessage('Sharing not supported on this browser.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch {
      setToastMessage('Unable to copy link.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Locate and scroll to a post (e.g. from DNA Lineage Root Post)
  const handleNavigateToPost = (postId: string) => {
    setSelectedSongDNA(null);
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-[#FF5A36]');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#FF5A36]');
        }, 2500);
      }
    }, 150);
  };

  // Filter posts if feed search query is active
  const displayedPosts = useMemo(() => {
    if (!feedSearchQuery.trim()) return posts;
    const q = feedSearchQuery.toLowerCase().trim();
    return posts.filter((p) => {
      const creator = artists[p.creatorId];
      const song = songs.find((s) => s.id === p.songId);
      return (
        p.caption.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (creator && (creator.displayName.toLowerCase().includes(q) || creator.username.toLowerCase().includes(q))) ||
        (song && song.title.toLowerCase().includes(q))
      );
    });
  }, [posts, feedSearchQuery, artists, songs]);

  return (
    <div className="pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#20201E] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-white/20 animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Circle Header */}
      <PageHeader
        title="Circle"
        rightActions={
          <>
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="px-2.5 py-1 rounded-full bg-[#FFEBE5] text-[#FF5A36] hover:bg-[#FFDFD6] text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                aria-label="Guide and Demo Videos"
                title="Sonora Guide & Demo Videos"
              >
                <span>💡</span>
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setToastMessage("You're all caught up! 🎵 3 new collaborations active.");
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="p-2 rounded-full hover:bg-[#F0EBE1] text-[#20201E] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <BellIcon size={22} hasUnread={true} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setFeedSearchQuery('');
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isSearchOpen ? 'bg-[#20201E] text-white' : 'hover:bg-[#F0EBE1] text-[#20201E]'
              }`}
              aria-label="Search Circle Feed"
            >
              <SearchIcon size={22} />
            </button>
          </>
        }
      />

      {/* Feed Search Bar (Expandable) */}
      {isSearchOpen && (
        <div className="px-4 mb-3 animate-in fade-in duration-150">
          <div className="relative flex items-center">
            <input
              type="text"
              value={feedSearchQuery}
              onChange={(e) => setFeedSearchQuery(e.target.value)}
              placeholder="Search feed captions, #tags, creators..."
              autoFocus
              className="w-full bg-white text-[#20201E] placeholder-[#B9B2A9] text-xs rounded-full py-2.5 pl-4 pr-9 border border-[#EFE9DF] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF5A36]"
            />
            {feedSearchQuery && (
              <button
                type="button"
                onClick={() => setFeedSearchQuery('')}
                className="absolute right-3 text-[#B9B2A9] hover:text-[#20201E] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Creator Entry Point */}
      <CreatorEntryPoint
        currentUser={currentUser}
        onOpenCreate={handleOpenCreate}
      />

      {/* Stories / Creator Circle Shortcuts */}
      <div className="mb-4">
        <StoryCircleList
          currentUser={currentUser}
          artists={artistsList}
          onSelectStory={handleSelectStory}
        />
      </div>

      {/* Story Quick Preview Overlay if clicked */}
      {activeStoryArtist && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-xs w-full bg-neutral-900 rounded-3xl overflow-hidden text-white p-6 text-center border border-white/20">
            <img
              src={activeStoryArtist.avatarUrl}
              alt={activeStoryArtist.displayName}
              className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-[#FF5A36] mb-3"
            />
            <h3 className="font-extrabold text-lg">{activeStoryArtist.displayName}</h3>
            <p className="text-xs text-[#D9F56A] font-bold mt-1">
              🎵 Listening & Jamming to latest riffs
            </p>
            <p className="text-xs text-white/60 mt-2">
              "{activeStoryArtist.bio}"
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setActiveStoryArtist(null);
                  onNavigateToStage(activeStoryArtist.id);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-full bg-[#FF5A36] text-white cursor-pointer"
              >
                View Stage
              </button>
              <button
                onClick={() => setActiveStoryArtist(null)}
                className="px-4 py-2 text-xs font-bold rounded-full bg-white/20 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-4">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => {
            const creator = artists[post.creatorId] || (currentUser.id === post.creatorId ? currentUser : {
              displayName: 'Musician',
              username: 'artist',
              avatarUrl: '',
            });
            const song = songs.find((s) => s.id === post.songId);
            const versions = songVersions.filter((v) => v.songId === post.songId);

            return (
              <div key={post.id} id={`post-${post.id}`} className="transition-all duration-300 rounded-3xl">
                <FeedPostCard
                  post={post}
                  creator={creator}
                  song={song}
                  versions={versions}
                  contributions={contributions}
                  allArtists={artists}
                  isSaved={savedPostIds?.includes(post.id)}
                  isPlaybackPaused={!!addPartTarget}
                  onInspectDNA={handleInspectDNA}
                  onOpenWorkspace={handleOpenWorkspace}
                  onAddPart={(s, v, c) => handleOpenAddPart(s, v, c)}
                  onContribute={(s, v) => handleOpenAddPart(s, v)}
                  onOpenComments={(p) => setActiveCommentPost(p)}
                  onShare={handleSharePost}
                  onToggleLike={onToggleLike}
                  onToggleBookmark={onToggleBookmark}
                  onNavigateToStage={onNavigateToStage}
                />
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8">
            <EmptyState
              title="No posts found"
              description={
                feedSearchQuery
                  ? `No musical posts matched "${feedSearchQuery}". Try clearing search.`
                  : 'Your feed is quiet. Share your first jam or explore new creators!'
              }
              actionLabel={feedSearchQuery ? 'Clear Search' : 'Create Post'}
              onAction={() => {
                if (feedSearchQuery) {
                  setFeedSearchQuery('');
                } else {
                  handleOpenCreate('post');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Collaboration Workspace Modal (Play Videos Together & Song DNA) */}
      {activeWorkspaceSong && (
        <CollaborationWorkspaceModal
          isOpen={!!activeWorkspaceSong}
          onClose={() => {
            setActiveWorkspaceSong(null);
            setActiveWorkspaceVersionId(undefined);
          }}
          song={activeWorkspaceSong}
          initialVersionId={activeWorkspaceVersionId}
          versions={songVersions.filter((v) => v.songId === activeWorkspaceSong.id)}
          contributions={contributions.filter((c) => c.songId === activeWorkspaceSong.id)}
          artists={artists}
          currentUser={currentUser}
          onOpenAddPart={(s, v) => handleOpenAddPart(s, v)}
          onPublishCollaboration={onPublishCollaboration}
        />
      )}

      {/* Add Part Modal (Simple Contribution Flow) */}
      {addPartTarget && (
        <AddPartModal
          isOpen={!!addPartTarget}
          onClose={() => setAddPartTarget(null)}
          currentUser={currentUser}
          song={addPartTarget.song}
          parentVersion={addPartTarget.parentVersion}
          activeContributions={(() => {
            const ids = addPartTarget.parentVersion.orderedContributionIds || [];
            const matched = contributions.filter((c) => ids.includes(c.id));
            if (matched.length > 0) return matched;
            if (addPartTarget.initialContribution) {
              return [addPartTarget.initialContribution];
            }
            return [];
          })()}
          artists={artists}
          onPublishCollaborationPart={onPublishCollaborationPart}
          onConfirmContribution={handleConfirmAddPart}
        />
      )}

      {/* Full Song DNA Lineage Modal */}
      {selectedSongDNA && !activeWorkspaceSong && (
        <SongDNALineageModal
          isOpen={!!selectedSongDNA}
          onClose={() => setSelectedSongDNA(null)}
          song={selectedSongDNA}
          versions={songVersions.filter((v) => v.songId === selectedSongDNA.id)}
          contributions={contributions.filter((c) => c.songId === selectedSongDNA.id)}
          artists={artists}
          posts={posts}
          onOpenWorkspace={(song, ver) => handleOpenWorkspace(song, ver)}
          onNavigateToPost={handleNavigateToPost}
          onCollabClick={(song, ver) => {
            handleOpenAddPart(song, ver);
          }}
        />
      )}

      {/* Comments Panel / Modal */}
      {activeCommentPost && (
        <PostCommentsModal
          isOpen={!!activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          post={activeCommentPost}
          creator={artists[activeCommentPost.creatorId] || currentUser}
          currentUser={currentUser}
          comments={comments}
          allArtists={artists}
          song={songs.find((s) => s.id === activeCommentPost.songId)}
          postVersion={songVersions.find((v) => v.id === activeCommentPost.versionId)}
          onAddComment={(postId, text) => {
            if (onAddComment) {
              return onAddComment(postId, text);
            }
            return { success: false, error: 'Commenting service unavailable.' };
          }}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        initialType={createInitialType}
        initialSongId={createInitialSongId}
        availableSongs={songs}
        songVersions={songVersions}
        contributions={contributions}
        onSubmitPost={onAddPost}
      />
    </div>
  );
};
