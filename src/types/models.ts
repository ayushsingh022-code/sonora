/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Data Architecture Models
 * Phase 1 foundational type definitions preserving relationship rules and Song DNA lineage.
 */

export type MusicalInstrument =
  | 'Vocals'
  | 'Guitar'
  | 'Bass'
  | 'Drums'
  | 'Keyboard'
  | 'Piano'
  | 'Beats'
  | 'Synth'
  | 'Saxophone'
  | 'Violin'
  | 'Production'
  | 'Songwriting'
  | string;

export type MusicGenre =
  | 'Pop'
  | 'Indie'
  | 'Rock'
  | 'Hip Hop'
  | 'R&B'
  | 'Electronic'
  | 'Afro-fusion'
  | 'Jazz'
  | 'Acoustic'
  | string;

export interface UserStats {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  collabsCount: number;
  songDnaLineagesCount: number;
}

export interface UserProfile {
  id: string;
  username: string; // e.g. "bryanthemensah", "rhea.vocals"
  displayName: string;
  avatarUrl: string;
  coverUrl?: string;
  bio: string;
  location?: string;
  instruments: MusicalInstrument[];
  genres: MusicGenre[];
  interests: string[];
  isProfilePublic: boolean;
  isOpenForCollab: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    soundcloud?: string;
    youtube?: string;
    spotify?: string;
  };
  stats: UserStats;
}

/**
 * Business Rule 1: Follow and Add Friend are independent relationships.
 * A user can follow another without being friends, and friend requests have a lifecycle.
 */
export interface FollowRelationship {
  id: string;
  followerId: string;
  followedUserId: string;
  createdAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Mutual Friendship model (unordered pair between participantA and participantB)
 */
export interface Friendship {
  id: string;
  participantAId: string;
  participantBId: string;
  createdAt: string;
}

export type PostType = 'video' | 'jam' | 'post' | 'collab';

export interface MediaReference {
  type: 'video' | 'audio' | 'image';
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  waveformPeaks?: number[];
}

export interface Post {
  id: string;
  creatorId: string;
  postType: PostType;
  caption: string;
  tags: string[];
  media: MediaReference[];
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByCurrentUser?: boolean;
  isBookmarkedByCurrentUser?: boolean;
  songId?: string;
  versionId?: string;
  isDemoPost?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

/**
 * Song DNA Business Rules:
 * - Rule 2: Song DNA must support branching and version history.
 * - Rule 3: Each published contribution creates a new version while preserving earlier versions and attribution.
 * - Rule 4: An individual version can show a maximum of six visible contributions, including the original creator.
 * - Rule 5: The original creator's additions count aggregates contributions across the entire Song DNA lineage, including descendants and branches.
 * - Rule 6: Replacing a contribution creates a new version rather than silently overwriting historical data.
 */
export const MAX_VISIBLE_CONTRIBUTIONS = 6;

export interface Song {
  id: string;
  title: string;
  originalCreatorId: string;
  originalPostId: string;
  lineageIdentifier: string; // Root lineage UID
  totalLineageAdditions: number; // Aggregate across all descendants and branches
  rootCreatedAt: string;
}

export interface SongVersion {
  id: string;
  songId: string;
  parentVersionId: string | null; // null for original root version
  versionNumber: number; // e.g. 1.0, 1.1, 2.0
  versionLabel?: string; // e.g. "Late night riff + Acoustic Drums"
  orderedContributionIds: string[]; // Max 6 visible parts
  createdAt: string;
  createdByUserId: string;
  changelogDescription?: string;
}

export interface Contribution {
  id: string;
  songId: string;
  versionId: string;
  contributorId: string;
  partType: MusicalInstrument; // e.g. 'Vocals', 'Guitar', 'Beats'
  videoReference?: MediaReference;
  audioReference: MediaReference;
  parentContributionId?: string | null;
  orderIndex: number; // 0 to 5 in the version mix
  isOriginalStem: boolean;
  createdAt: string;
}

export type CollabRequestStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface CollaborationRequest {
  id: string;
  senderId: string;
  recipientId: string;
  songId?: string;
  proposedPart: MusicalInstrument;
  status: CollabRequestStatus;
  message: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaAttachment?: MediaReference;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  avatarUrl?: string;
  updatedAt: string;
}

export type EventStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface CollaborationEvent {
  id: string;
  title: string;
  participants: string[];
  scheduledTime: string;
  durationMinutes: number;
  instrument?: MusicalInstrument;
  genre?: MusicGenre;
  eventStatus: EventStatus;
  note?: string;
  sessionType?: 'now' | 'scheduled';
  hostUserId?: string;
}

export type AppDestination = 'circle' | 'explore' | 'link' | 'stage';

export * from './ai';
