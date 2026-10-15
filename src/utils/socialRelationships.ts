/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Social Relationships Service & Helpers
 * Enforces business rules:
 * - Follow and Add Friend are strictly independent.
 * - Friendships are mutual and unordered.
 * - Outgoing and incoming request lifecycles (pending, accepted, declined, cancelled).
 * - Prevention of self-actions, duplicate records, or accidental overrides.
 */

import { FollowRelationship, FriendRequest, Friendship } from '../types/models';

/**
 * Returns a normalized unordered key for a pair of user IDs
 */
export function getPairKey(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join(':::');
}

/**
 * Checks if userA follows userB (one-way relationship)
 */
export function isFollowing(
  followList: FollowRelationship[],
  followerId: string,
  followedUserId: string
): boolean {
  if (!followerId || !followedUserId || followerId === followedUserId) return false;
  return followList.some(
    (f) => f.followerId === followerId && f.followedUserId === followedUserId
  );
}

/**
 * Checks if two users are mutual friends
 */
export function areFriends(
  friendships: Friendship[],
  userAId: string,
  userBId: string
): boolean {
  if (!userAId || !userBId || userAId === userBId) return false;
  const targetKey = getPairKey(userAId, userBId);
  return friendships.some(
    (f) => getPairKey(f.participantAId, f.participantBId) === targetKey
  );
}

/**
 * Finds the mutual friendship record between two users
 */
export function getFriendship(
  friendships: Friendship[],
  userAId: string,
  userBId: string
): Friendship | undefined {
  const targetKey = getPairKey(userAId, userBId);
  return friendships.find(
    (f) => getPairKey(f.participantAId, f.participantBId) === targetKey
  );
}

/**
 * Finds an active outgoing friend request from sender to recipient
 */
export function getOutgoingRequest(
  requests: FriendRequest[],
  senderId: string,
  recipientId: string
): FriendRequest | undefined {
  return requests.find(
    (r) => r.senderId === senderId && r.recipientId === recipientId && r.status === 'pending'
  );
}

/**
 * Finds an active incoming friend request to recipient from sender
 */
export function getIncomingRequest(
  requests: FriendRequest[],
  recipientId: string,
  senderId: string
): FriendRequest | undefined {
  return requests.find(
    (r) => r.recipientId === recipientId && r.senderId === senderId && r.status === 'pending'
  );
}

export type AddFriendUIState =
  | 'self'
  | 'friends'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'not_connected';

/**
 * Computes the exact Add Friend button state relative to the current user
 */
export function getAddFriendUIState(
  currentUserId: string,
  targetUserId: string,
  friendships: Friendship[],
  requests: FriendRequest[]
): {
  state: AddFriendUIState;
  activeRequestId?: string;
} {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { state: 'self' };
  }

  if (areFriends(friendships, currentUserId, targetUserId)) {
    return { state: 'friends' };
  }

  const outgoing = getOutgoingRequest(requests, currentUserId, targetUserId);
  if (outgoing) {
    return { state: 'outgoing_pending', activeRequestId: outgoing.id };
  }

  const incoming = getIncomingRequest(requests, currentUserId, targetUserId);
  if (incoming) {
    return { state: 'incoming_pending', activeRequestId: incoming.id };
  }

  return { state: 'not_connected' };
}
