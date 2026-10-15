/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — Phase 2: Artist Profiles, Follow & Add Friend
 * Music-first social and collaboration platform.
 */

import React, { useState, useEffect } from 'react';
import {
  AppDestination,
  Post,
  UserProfile,
  PostType,
  FollowRelationship,
  FriendRequest,
  Friendship,
  Song,
  SongVersion,
  Contribution,
  MediaReference,
  Comment,
  CollaborationEvent,
  Conversation,
  EventStatus,
} from './types/models';
import { JamSessionModal, JamSessionSubmitPayload } from './components/features/link/JamSessionModal';
import { LiveJamRoomModal } from './components/features/link/LiveJamRoomModal';
import {
  ARTISTS,
  PRIMARY_DEMO_KEYS,
  DEMO_POSTS,
  DEMO_SONGS,
  DEMO_SONG_VERSIONS,
  DEMO_CONTRIBUTIONS,
  DEMO_COMMENTS,
  DEMO_CONVERSATIONS,
  DEMO_COLLAB_REQUESTS,
  DEMO_SCHEDULED_EVENTS,
  DEMO_FOLLOWS,
  DEMO_FRIENDSHIPS,
  DEMO_FRIEND_REQUESTS,
} from './constants/demoData';

import { AppShell } from './components/layout/AppShell';
import { CircleScreen } from './components/features/circle/CircleScreen';
import { ExploreScreen } from './components/features/explore/ExploreScreen';
import { LinkScreen } from './components/features/link/LinkScreen';
import { StageScreen } from './components/features/stage/StageScreen';
import { CreatePostModal, CreatePostSubmitPayload } from './components/features/circle/CreatePostModal';
import { AddPartSubmitPayload } from './components/features/circle/AddPartModal';
import { PublishCollaborationPayload } from './components/features/circle/CollaborationWorkspaceModal';
import {
  isFollowing,
  areFriends,
  getPairKey,
} from './utils/socialRelationships';
import {
  createSongDnaRoot,
  contributeToSongDna,
} from './utils/songDnaEngine';

// Safe localStorage persistence helpers (Requirement 7)
const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`Could not read ${key} from storage:`, e);
  }
  return fallback;
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppDestination>('circle');

  // Multi-persona demo switcher state (Section 4)
  const [currentPersonaKey, setCurrentPersonaKey] = useState<string>('bryanthemensah');
  const [stageArtistKey, setStageArtistKey] = useState<string>('bryanthemensah');

  // Artists registry (contains the 4 core demo musicians + collaborators)
  const [artists, setArtists] = useState<Record<string, UserProfile>>(ARTISTS);

  // Social Relationships state (Sections 5, 6, 7)
  const [followList, setFollowList] = useState<FollowRelationship[]>(DEMO_FOLLOWS);
  const [friendships, setFriendships] = useState<Friendship[]>(DEMO_FRIENDSHIPS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(DEMO_FRIEND_REQUESTS);

  // Content state with persistence across navigation and page refreshes
  const [posts, setPosts] = useState<Post[]>(() => loadStorage('sonora_posts_v3', DEMO_POSTS));
  const [songs, setSongs] = useState<Song[]>(() => loadStorage('sonora_songs_v3', DEMO_SONGS));
  const [songVersions, setSongVersions] = useState<SongVersion[]>(() =>
    loadStorage('sonora_song_versions_v3', DEMO_SONG_VERSIONS)
  );
  const [contributions, setContributions] = useState<Contribution[]>(() =>
    loadStorage('sonora_contributions_v3', DEMO_CONTRIBUTIONS)
  );
  const [comments, setComments] = useState<Comment[]>(() =>
    loadStorage('sonora_comments_v4', DEMO_COMMENTS)
  );
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadStorage('sonora_convos_v5', DEMO_CONVERSATIONS)
  );
  const [collabRequests, setCollabRequests] = useState(DEMO_COLLAB_REQUESTS);
  const [scheduledEvents, setScheduledEvents] = useState<CollaborationEvent[]>(() =>
    loadStorage('sonora_events_v5', DEMO_SCHEDULED_EVENTS)
  );

  // Cross-screen navigation targets (Explore -> Circle Collaboration Workspace)
  const [circleInitialWorkspaceSong, setCircleInitialWorkspaceSong] = useState<Song | null>(null);
  const [circleInitialWorkspaceVersionId, setCircleInitialWorkspaceVersionId] = useState<string | null>(null);
  const [circleInitialAddPartSong, setCircleInitialAddPartSong] = useState<{ song: Song; version?: SongVersion } | null>(null);

  // Quick Jam Modal state (accessible from Stage or Link)
  const [stageTargetJamUser, setStageTargetJamUser] = useState<UserProfile | null>(null);
  const [activeLiveJamEvent, setActiveLiveJamEvent] = useState<CollaborationEvent | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sonora_posts_v3', JSON.stringify(posts));
    } catch (e) {}
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_songs_v3', JSON.stringify(songs));
    } catch (e) {}
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_song_versions_v3', JSON.stringify(songVersions));
    } catch (e) {}
  }, [songVersions]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_contributions_v3', JSON.stringify(contributions));
    } catch (e) {}
  }, [contributions]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_comments_v4', JSON.stringify(comments));
    } catch (e) {}
  }, [comments]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_events_v5', JSON.stringify(scheduledEvents));
    } catch (e) {}
  }, [scheduledEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('sonora_convos_v5', JSON.stringify(conversations));
    } catch (e) {}
  }, [conversations]);

  // Global Create Modal state
  const [isGlobalCreateOpen, setIsGlobalCreateOpen] = useState(false);
  const [globalCreateType, setGlobalCreateType] = useState<PostType>('post');

  // The active user object derived from currentPersonaKey
  const currentUser = artists[currentPersonaKey] || artists.bryanthemensah;

  // Active artist profile to display on Stage
  const currentStageArtist = artists[stageArtistKey] || currentUser;

  // Unread chats count for notification badges
  const unreadChatsCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // -------------------------------------------------------------
  // Persona Switching Handler (Section 4)
  // -------------------------------------------------------------
  const handleSwitchUser = (newPersonaKey: string) => {
    const wasViewingOwnProfile = stageArtistKey === currentPersonaKey;
    setCurrentPersonaKey(newPersonaKey);

    // If user was on Stage looking at their own profile, switch Stage to the new persona's profile
    if (wasViewingOwnProfile) {
      setStageArtistKey(newPersonaKey);
    }
  };

  // -------------------------------------------------------------
  // Follow Handler: One-Way Relationship (Section 5)
  // -------------------------------------------------------------
  const handleToggleFollow = (targetUserId: string) => {
    if (!targetUserId || targetUserId === currentUser.id) return; // Prevent self-follow

    const currentlyFollowing = isFollowing(followList, currentUser.id, targetUserId);

    if (currentlyFollowing) {
      // Unfollow: remove relationship
      setFollowList((prev) =>
        prev.filter(
          (f) => !(f.followerId === currentUser.id && f.followedUserId === targetUserId)
        )
      );

      // Decrement target's followersCount and current user's followingCount
      setArtists((prev) => {
        const next = { ...prev };
        for (const k in next) {
          if (next[k].id === targetUserId) {
            next[k] = {
              ...next[k],
              stats: {
                ...next[k].stats,
                followersCount: Math.max(0, next[k].stats.followersCount - 1),
              },
            };
          }
          if (next[k].id === currentUser.id) {
            next[k] = {
              ...next[k],
              stats: {
                ...next[k].stats,
                followingCount: Math.max(0, next[k].stats.followingCount - 1),
              },
            };
          }
        }
        return next;
      });
    } else {
      // Follow: add relationship (prevent duplicates)
      const newFollow: FollowRelationship = {
        id: `follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        followerId: currentUser.id,
        followedUserId: targetUserId,
        createdAt: new Date().toISOString(),
      };
      setFollowList((prev) => [...prev, newFollow]);

      // Increment target's followersCount and current user's followingCount
      setArtists((prev) => {
        const next = { ...prev };
        for (const k in next) {
          if (next[k].id === targetUserId) {
            next[k] = {
              ...next[k],
              stats: {
                ...next[k].stats,
                followersCount: next[k].stats.followersCount + 1,
              },
            };
          }
          if (next[k].id === currentUser.id) {
            next[k] = {
              ...next[k],
              stats: {
                ...next[k].stats,
                followingCount: next[k].stats.followingCount + 1,
              },
            };
          }
        }
        return next;
      });
    }
  };

  // -------------------------------------------------------------
  // Add Friend Handlers: Request Lifecycle (Section 6)
  // -------------------------------------------------------------
  const handleSendFriendRequest = (targetUserId: string) => {
    if (!targetUserId || targetUserId === currentUser.id) return; // Prevent self-request
    if (areFriends(friendships, currentUser.id, targetUserId)) return; // Already friends

    // Prevent duplicate pending requests in either direction
    const hasPending = friendRequests.some(
      (r) =>
        r.status === 'pending' &&
        ((r.senderId === currentUser.id && r.recipientId === targetUserId) ||
          (r.senderId === targetUserId && r.recipientId === currentUser.id))
    );
    if (hasPending) return;

    const newRequest: FriendRequest = {
      id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.id,
      recipientId: targetUserId,
      status: 'pending',
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };
    setFriendRequests((prev) => [newRequest, ...prev]);
  };

  const handleCancelFriendRequest = (requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' as const } : r))
    );
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const request = friendRequests.find((r) => r.id === requestId);
    if (!request || request.status !== 'pending') return;

    // Verify recipient is current user to prevent accidental cross-acceptance
    if (request.recipientId !== currentUser.id) return;

    // 1. Mark request accepted
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' as const } : r))
    );

    // 2. Create mutual friendship record
    const newFriendship: Friendship = {
      id: `friendship_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      participantAId: request.senderId,
      participantBId: request.recipientId,
      createdAt: new Date().toISOString(),
    };
    setFriendships((prev) => [...prev, newFriendship]);

    // 3. Increment mutual friendsCount for both users
    setArtists((prev) => {
      const next = { ...prev };
      for (const k in next) {
        if (next[k].id === request.senderId || next[k].id === request.recipientId) {
          next[k] = {
            ...next[k],
            stats: {
              ...next[k].stats,
              friendsCount: next[k].stats.friendsCount + 1,
            },
          };
        }
      }
      return next;
    });
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' as const } : r))
    );
  };

  const handleRemoveFriendship = (targetUserId: string) => {
    const pairKey = getPairKey(currentUser.id, targetUserId);

    // Remove friendship
    setFriendships((prev) =>
      prev.filter((f) => getPairKey(f.participantAId, f.participantBId) !== pairKey)
    );

    // Decrement friendsCount for both users
    setArtists((prev) => {
      const next = { ...prev };
      for (const k in next) {
        if (next[k].id === currentUser.id || next[k].id === targetUserId) {
          next[k] = {
            ...next[k],
            stats: {
              ...next[k].stats,
              friendsCount: Math.max(0, next[k].stats.friendsCount - 1),
            },
          };
        }
      }
      return next;
    });
  };

  // -------------------------------------------------------------
  // Profile Edit Handler (Section 3)
  // -------------------------------------------------------------
  const handleEditProfile = (updated: Partial<UserProfile>) => {
    setArtists((prev) => {
      const targetKey = stageArtistKey in prev ? stageArtistKey : currentPersonaKey;
      return {
        ...prev,
        [targetKey]: {
          ...prev[targetKey],
          ...updated,
        },
      };
    });
  };

  // -------------------------------------------------------------
  // Navigation & Post Handlers
  // -------------------------------------------------------------
  const handleNavigateToStage = (artistIdOrHandle?: string) => {
    if (artistIdOrHandle) {
      const key = Object.keys(artists).find(
        (k) =>
          artists[k].id === artistIdOrHandle ||
          artists[k].username.toLowerCase() === artistIdOrHandle.toLowerCase().replace(/^@/, '')
      );
      if (key) {
        setStageArtistKey(key);
      }
    } else {
      // Default to current user's profile
      setStageArtistKey(currentPersonaKey);
    }
    setCurrentTab('stage');
  };

  const handleTabChange = (tab: AppDestination) => {
    if (tab === 'stage') {
      // When clicking the Stage tab in nav, show current user's profile
      setStageArtistKey(currentPersonaKey);
    }
    setCurrentTab(tab);
  };

  const handleAddPost = (payload: CreatePostSubmitPayload) => {
    const postId = `post_${Date.now()}`;
    const timestamp = 'Just now';

    let songId = payload.post.songId;
    let versionId = payload.post.versionId;

    if (payload.songDnaMode === 'create_root' && payload.rootSongData) {
      const { song, version, contribution } = createSongDnaRoot({
        title: payload.rootSongData.title,
        creatorId: currentUser.id,
        postId,
        partType: payload.rootSongData.partType,
        media: payload.post.media?.[0] || {
          type: payload.post.postType === 'video' ? 'video' : 'audio',
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        },
        versionLabel: payload.rootSongData.versionLabel,
      });

      songId = song.id;
      versionId = version.id;

      setSongs((prev) => [song, ...prev]);
      setSongVersions((prev) => [...prev, version]);
      setContributions((prev) => [...prev, contribution]);

      // Increment creator's stats
      setArtists((prev) => {
        const user = prev[currentPersonaKey];
        if (!user) return prev;
        return {
          ...prev,
          [currentPersonaKey]: {
            ...user,
            stats: {
              ...user.stats,
              songDnaLineagesCount: user.stats.songDnaLineagesCount + 1,
              collabsCount: user.stats.collabsCount + 1,
            },
          },
        };
      });
    } else if (payload.songDnaMode === 'contribute' && payload.contributeSongData) {
      const targetSong = songs.find((s) => s.id === payload.contributeSongData?.songId);
      const targetVersion = songVersions.find((v) => v.id === payload.contributeSongData?.parentVersionId);

      if (targetSong && targetVersion) {
        const { updatedSong, newVersion, newContribution } = contributeToSongDna({
          song: targetSong,
          parentVersion: targetVersion,
          contributorId: currentUser.id,
          partType: payload.contributeSongData.partType,
          media: payload.post.media?.[0] || {
            type: payload.post.postType === 'video' ? 'video' : 'audio',
            url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
          },
          versionLabel: payload.contributeSongData.versionLabel,
          changelog: payload.contributeSongData.changelog,
          replacedContributionId: payload.contributeSongData.replacedContributionId,
        });

        songId = updatedSong.id;
        versionId = newVersion.id;

        setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
        setSongVersions((prev) => [...prev, newVersion]);
        setContributions((prev) => [...prev, newContribution]);

        // Increment collaborator's stats
        setArtists((prev) => {
          const user = prev[currentPersonaKey];
          if (!user) return prev;
          return {
            ...prev,
            [currentPersonaKey]: {
              ...user,
              stats: {
                ...user.stats,
                collabsCount: user.stats.collabsCount + 1,
              },
            },
          };
        });
      }
    }

    const newPost: Post = {
      id: postId,
      creatorId: currentUser.id,
      postType: payload.post.postType || 'post',
      caption: payload.post.caption || '',
      tags: payload.post.tags || ['music', 'songdna'],
      media: payload.post.media || [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        },
      ],
      createdAt: timestamp,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      isLikedByCurrentUser: true,
      songId,
      versionId,
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const currentlyLiked = post.isLikedByCurrentUser ?? false;
          return {
            ...post,
            isLikedByCurrentUser: !currentlyLiked,
            likesCount: currentlyLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, text: string): { success: boolean; error?: string } => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { success: false, error: 'Comment text cannot be empty.' };
    }

    const newComment: Comment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      authorId: currentUser.id,
      text: trimmed,
      createdAt: 'Just now',
    };

    setComments((prev) => [...prev, newComment]);

    // Increment commentsCount on target post
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: (p.commentsCount || 0) + 1,
          };
        }
        return p;
      })
    );

    return { success: true };
  };

  const handleAddPartContribution = (
    payload: AddPartSubmitPayload
  ): { newVersion: SongVersion; updatedSong: Song } => {
    let targetSong = songs.find((s) => s.id === payload.songId);

    // Fallback: If not directly found in state, look up by post's songId or initialize
    if (!targetSong) {
      const relatedPost = posts.find((p) => p.songId === payload.songId || p.id === payload.songId);
      if (relatedPost) {
        targetSong = {
          id: payload.songId,
          title: relatedPost.caption?.slice(0, 24).trim() || 'Collaborative Jam',
          originalCreatorId: relatedPost.creatorId,
          originalPostId: relatedPost.id,
          lineageIdentifier: `dna_${Date.now()}`,
          totalLineageAdditions: 1,
          rootCreatedAt: new Date().toISOString(),
        };
        setSongs((prev) => [targetSong!, ...prev]);
      }
    }

    if (!targetSong) {
      throw new Error(`Target song (${payload.songId}) was not found in the library.`);
    }

    // Resolve parent version
    let targetVersion = songVersions.find((v) => v.id === payload.parentVersionId);

    // If parentVersion was not an exact ID match, search for the latest version of this song
    if (!targetVersion) {
      const songVers = songVersions.filter((v) => v.songId === targetSong.id);
      if (songVers.length > 0) {
        targetVersion = [...songVers].sort((a, b) => b.versionNumber - a.versionNumber)[0];
      }
    }

    // If no version exists at all for this song, establish a root version first
    if (!targetVersion) {
      const timestamp = new Date().toISOString();
      const rootVerId = `ver_${targetSong.id}_root`;
      const rootContribId = `contrib_${targetSong.id}_stem0`;

      const rootContrib: Contribution = {
        id: rootContribId,
        songId: targetSong.id,
        versionId: rootVerId,
        contributorId: targetSong.originalCreatorId,
        partType: 'Vocals',
        audioReference: {
          type: 'audio',
          url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
        },
        videoReference: {
          type: 'video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4',
        },
        orderIndex: 0,
        isOriginalStem: true,
        createdAt: timestamp,
      };

      targetVersion = {
        id: rootVerId,
        songId: targetSong.id,
        parentVersionId: null,
        versionNumber: 1.0,
        versionLabel: 'Original Mix Idea',
        orderedContributionIds: [rootContribId],
        createdAt: timestamp,
        createdByUserId: targetSong.originalCreatorId,
      };

      setSongVersions((prev) => [...prev, targetVersion!]);
      setContributions((prev) => [...prev, rootContrib]);
    }

    const { updatedSong, newVersion, newContribution } = contributeToSongDna({
      song: targetSong,
      parentVersion: targetVersion,
      contributorId: currentUser.id,
      partType: payload.partType,
      media: payload.videoMedia,
      versionLabel: payload.partLabel || `${currentUser.displayName || currentUser.username} — ${payload.partType}`,
      changelog: payload.note || `Added new ${payload.partType} part to v${targetVersion.versionNumber.toFixed(1)} mix.`,
    });

    setSongs((prev) => {
      const exists = prev.some((s) => s.id === updatedSong.id);
      return exists ? prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)) : [updatedSong, ...prev];
    });
    setSongVersions((prev) => [...prev, newVersion]);
    setContributions((prev) => [...prev, newContribution]);

    // Increment current user's collabsCount in stats
    setArtists((prev) => {
      const user = prev[currentPersonaKey];
      if (!user) return prev;
      return {
        ...prev,
        [currentPersonaKey]: {
          ...user,
          stats: {
            ...user.stats,
            collabsCount: user.stats.collabsCount + 1,
          },
        },
      };
    });

    return { newVersion, updatedSong };
  };

  const handlePublishCollaboration = (
    payload: PublishCollaborationPayload
  ): { success: boolean; error?: string; post?: Post } => {
    try {
      const targetSong = songs.find((s) => s.id === payload.songId);
      if (!targetSong) {
        return { success: false, error: 'Song not found in library.' };
      }

      const targetVersion = songVersions.find((v) => v.id === payload.versionId);
      if (!targetVersion) {
        return { success: false, error: 'Song version not found in lineage.' };
      }

      const activeContribs = (targetVersion.orderedContributionIds || [])
        .map((id) => contributions.find((c) => c.id === id))
        .filter((c): c is Contribution => c !== undefined);

      // Collect media for ALL visible contributions in their exact lineage order
      const postMedia: MediaReference[] = activeContribs
        .map((c) => c.videoReference || (c.audioReference?.type === 'video' ? c.audioReference : undefined) || c.audioReference)
        .filter((m): m is MediaReference => Boolean(m && m.url));

      // Fallback if no media references found
      if (postMedia.length === 0) {
        postMedia.push({
          type: 'video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-a-guitar-42512-large.mp4',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        });
      }

      const originalCreator = artists[targetSong.originalCreatorId] || {
        displayName: 'Original Creator',
        username: 'creator',
      };

      // Check if user already published this exact version collaboration (Requirement 5: prevent accidental duplicate posts)
      const existingPostIndex = posts.findIndex(
        (p) =>
          p.creatorId === currentUser.id &&
          p.songId === targetSong.id &&
          p.versionId === targetVersion.id &&
          p.postType === 'collab'
      );

      let savedPost: Post;

      if (existingPostIndex >= 0) {
        const updatedPost: Post = {
          ...posts[existingPostIndex],
          caption: payload.caption || posts[existingPostIndex].caption,
          media: postMedia,
          tags: payload.tags || posts[existingPostIndex].tags,
        };
        setPosts((prev) => prev.map((p, idx) => (idx === existingPostIndex ? updatedPost : p)));
        savedPost = updatedPost;
      } else {
        // Create an explicit new collaboration post while preserving the original post (Requirement 6)
        const newPost: Post = {
          id: `post_collab_${Date.now()}`,
          creatorId: currentUser.id,
          postType: 'collab',
          caption:
            payload.caption?.trim() ||
            `Collaborative Jam on "${targetSong.title}" with @${originalCreator.username} 🎶\n#SongDNA #Collab #v${targetVersion.versionNumber.toFixed(1)}`,
          tags: payload.tags || ['collab', 'songdna', `${targetVersion.orderedContributionIds.length}parts`],
          media: postMedia,
          createdAt: 'Just now',
          likesCount: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLikedByCurrentUser: true,
          songId: targetSong.id,
          versionId: targetVersion.id,
        };
        setPosts((prev) => [newPost, ...prev]);
        savedPost = newPost;
      }

      return { success: true, post: savedPost };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish collaboration.';
      return { success: false, error: msg };
    }
  };

  const handleSendMessage = (conversationId: string, text: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            updatedAt: 'Just now',
            lastMessage: {
              id: `msg_${Date.now()}`,
              conversationId,
              senderId: currentUser.id,
              text,
              createdAt: 'Just now',
              isRead: true,
            },
          };
        }
        return conv;
      })
    );
  };

  const handleAcceptCollab = (requestId: string) => {
    setCollabRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: 'accepted' } : req))
    );
  };

  const handleDeclineCollab = (requestId: string) => {
    setCollabRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: 'declined' } : req))
    );
  };

  const handleScheduleJamSession = (payload: JamSessionSubmitPayload): CollaborationEvent => {
    const isNow = payload.sessionType === 'now';
    const newEvent: CollaborationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: payload.title,
      participants: [currentUser.id, payload.targetUserId],
      scheduledTime: isNow ? 'Now (Live)' : `${payload.date || 'Tomorrow'}, ${payload.startTime || '6:00 PM'}`,
      durationMinutes: payload.durationMinutes,
      instrument: payload.instrument,
      genre: payload.genre,
      eventStatus: isNow ? 'in-progress' : 'scheduled',
      note: payload.note,
      sessionType: payload.sessionType,
      hostUserId: currentUser.id,
    };
    setScheduledEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const handleUpdateJamSessionStatus = (eventId: string, newStatus: EventStatus) => {
    setScheduledEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, eventStatus: newStatus } : e))
    );
  };

  const handleStartConversation = (targetUserId: string): Conversation => {
    const existing = conversations.find(
      (c) => !c.isGroup && c.participantIds.includes(currentUser.id) && c.participantIds.includes(targetUserId)
    );
    if (existing) return existing;

    const newConvo: Conversation = {
      id: `conv_${currentUser.id}_${targetUserId}_${Date.now()}`,
      participantIds: [currentUser.id, targetUserId],
      unreadCount: 0,
      isGroup: false,
      updatedAt: 'Just now',
      lastMessage: {
        id: `msg_${Date.now()}`,
        conversationId: `conv_${currentUser.id}_${targetUserId}_${Date.now()}`,
        senderId: currentUser.id,
        text: 'Started a new direct message conversation.',
        createdAt: 'Just now',
        isRead: true,
      },
    };
    setConversations((prev) => [newConvo, ...prev]);
    return newConvo;
  };

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={handleTabChange}
      currentUser={currentUser}
      unreadCount={unreadChatsCount}
      allArtists={artists}
      primaryDemoKeys={PRIMARY_DEMO_KEYS}
      onSwitchUser={handleSwitchUser}
      onCreateClick={() => {
        setGlobalCreateType('post');
        setIsGlobalCreateOpen(true);
      }}
    >
      {/* 1. Circle Destination */}
      {currentTab === 'circle' && (
        <CircleScreen
          currentUser={currentUser}
          artists={artists}
          posts={posts}
          songs={songs}
          songVersions={songVersions}
          contributions={contributions}
          comments={comments}
          onAddPost={handleAddPost}
          onAddPartContribution={handleAddPartContribution}
          onPublishCollaboration={handlePublishCollaboration}
          onNavigateToStage={handleNavigateToStage}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          initialWorkspaceSong={circleInitialWorkspaceSong}
          initialWorkspaceVersionId={circleInitialWorkspaceVersionId}
          initialAddPartSong={circleInitialAddPartSong}
          onClearInitialWorkspace={() => {
            setCircleInitialWorkspaceSong(null);
            setCircleInitialWorkspaceVersionId(null);
            setCircleInitialAddPartSong(null);
          }}
        />
      )}

      {/* 2. Explore Destination */}
      {currentTab === 'explore' && (
        <ExploreScreen
          currentUser={currentUser}
          artists={artists}
          posts={posts}
          songs={songs}
          songVersions={songVersions}
          contributions={contributions}
          followList={followList}
          onToggleFollow={handleToggleFollow}
          onSelectArtist={(handle) => {
            handleNavigateToStage(handle);
          }}
          onOpenQuickCollab={() => {
            setCurrentTab('link');
          }}
          onOpenWorkspace={(song, ver) => {
            setCircleInitialWorkspaceSong(song);
            setCircleInitialWorkspaceVersionId(ver?.id || null);
            setCurrentTab('circle');
          }}
          onAddPart={(song, ver) => {
            setCircleInitialAddPartSong({ song, version: ver });
            setCurrentTab('circle');
          }}
          onRequestJamSession={(targetArtist) => {
            setStageTargetJamUser(targetArtist);
          }}
          onStartConversation={(targetUserId) => {
            handleStartConversation(targetUserId);
            setCurrentTab('link');
          }}
        />
      )}

      {/* 3. Link Destination */}
      {currentTab === 'link' && (
        <LinkScreen
          currentUser={currentUser}
          artists={artists}
          conversations={conversations}
          collabRequests={collabRequests}
          scheduledEvents={scheduledEvents}
          friendRequests={friendRequests}
          friendships={friendships}
          onAcceptCollab={handleAcceptCollab}
          onDeclineCollab={handleDeclineCollab}
          onSendMessage={handleSendMessage}
          onSendFriendRequest={handleSendFriendRequest}
          onCancelFriendRequest={handleCancelFriendRequest}
          onAcceptFriendRequest={handleAcceptFriendRequest}
          onDeclineFriendRequest={handleDeclineFriendRequest}
          onRemoveFriendship={handleRemoveFriendship}
          onNavigateToStage={handleNavigateToStage}
          onScheduleJamSession={handleScheduleJamSession}
          onUpdateJamSessionStatus={handleUpdateJamSessionStatus}
          onStartConversation={handleStartConversation}
        />
      )}

      {/* 4. Stage Destination */}
      {currentTab === 'stage' && (
        <StageScreen
          artist={currentStageArtist}
          currentUser={currentUser}
          allArtists={artists}
          primaryDemoKeys={PRIMARY_DEMO_KEYS}
          posts={posts}
          followList={followList}
          friendships={friendships}
          friendRequests={friendRequests}
          onToggleFollow={handleToggleFollow}
          onSendFriendRequest={handleSendFriendRequest}
          onCancelFriendRequest={handleCancelFriendRequest}
          onAcceptFriendRequest={handleAcceptFriendRequest}
          onDeclineFriendRequest={handleDeclineFriendRequest}
          onRemoveFriendship={handleRemoveFriendship}
          onEditProfile={handleEditProfile}
          onSwitchUser={handleSwitchUser}
          onRequestJamSession={(targetArtist) => {
            setStageTargetJamUser(targetArtist);
          }}
          onStartConversation={(targetUserId) => {
            handleStartConversation(targetUserId);
            setCurrentTab('link');
          }}
          onBack={() => {
            if (stageArtistKey !== currentPersonaKey) {
              setStageArtistKey(currentPersonaKey);
              setCurrentTab('circle');
            }
          }}
        />
      )}

      {/* Jam Session Request Modal (when triggered from Stage or global) */}
      {stageTargetJamUser && (
        <JamSessionModal
          isOpen={!!stageTargetJamUser}
          onClose={() => setStageTargetJamUser(null)}
          currentUser={currentUser}
          initialTargetUser={stageTargetJamUser}
          availableMusicians={Object.values(artists).filter((a) => a.id !== currentUser.id)}
          onConfirmSchedule={(payload) => {
            const ev = handleScheduleJamSession(payload);
            setStageTargetJamUser(null);
            if (payload.sessionType === 'now') {
              setActiveLiveJamEvent(ev);
            }
          }}
        />
      )}

      {/* Live Jam Room Modal (when launched into live jam) */}
      {activeLiveJamEvent && (
        <LiveJamRoomModal
          isOpen={!!activeLiveJamEvent}
          onClose={() => setActiveLiveJamEvent(null)}
          event={activeLiveJamEvent}
          currentUser={currentUser}
          participants={activeLiveJamEvent.participants
            .map((id) => artists[id] || (id === currentUser.id ? currentUser : null))
            .filter((p): p is UserProfile => p !== null)}
        />
      )}

      {/* Global Post/Jam/Video Modal */}
      <CreatePostModal
        isOpen={isGlobalCreateOpen}
        onClose={() => setIsGlobalCreateOpen(false)}
        currentUser={currentUser}
        initialType={globalCreateType}
        availableSongs={songs}
        songVersions={songVersions}
        contributions={contributions}
        onSubmitPost={handleAddPost}
      />
    </AppShell>
  );
}
