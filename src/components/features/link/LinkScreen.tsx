/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  Conversation,
  CollaborationRequest,
  CollaborationEvent,
  Message,
  FriendRequest,
  Friendship,
  EventStatus,
} from '../../../types/models';
import { PageHeader } from '../../common/PageHeader';
import { SearchField } from '../../common/SearchAndFilters';
import { Avatar } from '../../common/Avatar';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';
import { EmptyState } from '../../common/FeedbackStates';
import { areFriends, getPairKey } from '../../../utils/socialRelationships';
import { JamSessionModal, JamSessionSubmitPayload } from './JamSessionModal';
import { LiveJamRoomModal } from './LiveJamRoomModal';

export type LinkTab = 'messages' | 'friends' | 'requests' | 'jams';

interface LinkScreenProps {
  currentUser: UserProfile;
  artists: Record<string, UserProfile>;
  conversations: Conversation[];
  collabRequests: CollaborationRequest[];
  scheduledEvents: CollaborationEvent[];
  friendRequests?: FriendRequest[];
  friendships?: Friendship[];
  onAcceptCollab: (requestId: string) => void;
  onDeclineCollab: (requestId: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onSendFriendRequest?: (targetUserId: string) => void;
  onCancelFriendRequest?: (requestId: string) => void;
  onAcceptFriendRequest?: (requestId: string) => void;
  onDeclineFriendRequest?: (requestId: string) => void;
  onRemoveFriendship?: (targetUserId: string) => void;
  onNavigateToStage?: (artistIdOrHandle: string) => void;
  onScheduleJamSession?: (payload: JamSessionSubmitPayload) => void;
  onUpdateJamSessionStatus?: (eventId: string, newStatus: EventStatus) => void;
  onStartConversation?: (targetUserId: string) => Conversation;
}

export const LinkScreen: React.FC<LinkScreenProps> = ({
  currentUser,
  artists,
  conversations,
  collabRequests,
  scheduledEvents,
  friendRequests = [],
  friendships = [],
  onAcceptCollab,
  onDeclineCollab,
  onSendMessage,
  onSendFriendRequest,
  onCancelFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriendship,
  onNavigateToStage,
  onScheduleJamSession,
  onUpdateJamSessionStatus,
  onStartConversation,
}) => {
  const [activeTab, setActiveTab] = useState<LinkTab>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});

  // Jam Session Modals State
  const [isJamModalOpen, setIsJamModalOpen] = useState(false);
  const [jamTargetUser, setJamTargetUser] = useState<UserProfile | undefined>(undefined);
  const [activeLiveJamEvent, setActiveLiveJamEvent] = useState<CollaborationEvent | null>(null);

  // New Chat Selection Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const artistsList = useMemo(() => Object.values(artists), [artists]);

  // Accepted Friends List for currentUser
  const friendsList = useMemo(() => {
    return artistsList.filter((a) => a.id !== currentUser.id && areFriends(friendships, currentUser.id, a.id));
  }, [artistsList, currentUser.id, friendships]);

  // Incoming pending friend requests
  const incomingFriendRequests = useMemo(() => {
    return friendRequests.filter((r) => r.recipientId === currentUser.id && r.status === 'pending');
  }, [friendRequests, currentUser.id]);

  // Outgoing pending friend requests
  const outgoingFriendRequests = useMemo(() => {
    return friendRequests.filter((r) => r.senderId === currentUser.id && r.status === 'pending');
  }, [friendRequests, currentUser.id]);

  // Pending collaboration proposals
  const pendingCollabs = useMemo(() => {
    return collabRequests.filter((r) => r.status === 'pending');
  }, [collabRequests]);

  const totalPendingRequests = incomingFriendRequests.length + pendingCollabs.length;

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const otherParticipantId = conv.participantIds.find((id) => id !== currentUser.id);
      const artist = otherParticipantId ? artists[otherParticipantId] : null;
      const name = conv.isGroup ? conv.groupName || '' : artist?.displayName || artist?.username || '';
      return (
        name.toLowerCase().includes(q) ||
        conv.lastMessage.text.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, currentUser.id, artists]);

  // Filter Friends
  const filteredFriends = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return friendsList;
    return friendsList.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        f.instruments.some((i) => i.toLowerCase().includes(q))
    );
  }, [friendsList, searchQuery]);

  // Handle message sending
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversation) return;

    const text = newMessageText.trim();
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      text,
      createdAt: 'Just now',
      isRead: true,
    };

    // Update local history for this active conversation
    setLocalMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg],
    }));

    onSendMessage(activeConversation.id, text);
    setNewMessageText('');
  };

  // Open or start a 1-to-1 conversation with a target user
  const handleOpenConversationWithUser = (targetUserId: string) => {
    // Check if conversation already exists
    let existing = conversations.find(
      (c) => !c.isGroup && c.participantIds.includes(currentUser.id) && c.participantIds.includes(targetUserId)
    );

    if (!existing && onStartConversation) {
      existing = onStartConversation(targetUserId);
    }

    if (existing) {
      setActiveConversation(existing);
      setActiveTab('messages');
      setIsNewChatModalOpen(false);
    } else {
      // Fallback synthetic conversation
      const partner = artists[targetUserId];
      const fallbackConv: Conversation = {
        id: `conv_${currentUser.id}_${targetUserId}`,
        participantIds: [currentUser.id, targetUserId],
        unreadCount: 0,
        isGroup: false,
        updatedAt: 'Just now',
        lastMessage: {
          id: `msg_${Date.now()}`,
          conversationId: `conv_${currentUser.id}_${targetUserId}`,
          senderId: currentUser.id,
          text: 'Started a new conversation',
          createdAt: 'Just now',
          isRead: true,
        },
      };
      setActiveConversation(fallbackConv);
      setActiveTab('messages');
      setIsNewChatModalOpen(false);
    }
  };

  // Handle opening Jam Session modal from anywhere in Link
  const handleOpenJamModal = (targetUser?: UserProfile) => {
    setJamTargetUser(targetUser);
    setIsJamModalOpen(true);
  };

  // Handle confirming jam schedule
  const handleConfirmJamSchedule = (payload: JamSessionSubmitPayload) => {
    if (onScheduleJamSession) {
      onScheduleJamSession(payload);
    }

    if (payload.sessionType === 'now') {
      // Launch into live jam room immediately!
      const partner = artists[payload.targetUserId];
      const liveEvent: CollaborationEvent = {
        id: `event_live_${Date.now()}`,
        title: payload.title,
        participants: [currentUser.id, payload.targetUserId],
        scheduledTime: 'Now (Live)',
        durationMinutes: payload.durationMinutes,
        instrument: payload.instrument,
        genre: payload.genre,
        eventStatus: 'in-progress',
        note: payload.note,
        sessionType: 'now',
        hostUserId: currentUser.id,
      };
      setActiveLiveJamEvent(liveEvent);
      showToast('Live Jam Room launched! ⚡');
    } else {
      showToast(`Jam Session scheduled for ${payload.date} at ${payload.startTime}! 📅`);
      setActiveTab('jams');
    }
  };

  return (
    <div className="pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#20201E] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-white/20 animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Link Header */}
      <PageHeader
        title="Link"
        rightActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenJamModal()}
              className="px-3 py-1.5 rounded-full bg-[#D9F56A] text-[#20201E] flex items-center gap-1 font-black text-xs hover:bg-[#C9E758] transition-all cursor-pointer shadow-2xs"
              aria-label="Jam Session"
            >
              <span>⚡</span>
              <span>Jam</span>
            </button>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="w-8 h-8 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-bold text-lg hover:bg-[#F04D29] transition-all cursor-pointer shadow-xs"
              aria-label="New Message"
            >
              +
            </button>
          </div>
        }
      />

      {/* Navigation Tabs: Messages, Friends, Requests, Jam Sessions */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-1 p-1 bg-[#F2ECE2] rounded-full">
          {/* Tab 1: Messages */}
          <button
            onClick={() => {
              setActiveTab('messages');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-[#20201E]/70 hover:text-[#20201E]'
            }`}
          >
            Messages
          </button>

          {/* Tab 2: Friends */}
          <button
            onClick={() => {
              setActiveTab('friends');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'friends'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-[#20201E]/70 hover:text-[#20201E]'
            }`}
          >
            <span>Friends</span>
            {friendsList.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'friends' ? 'bg-white text-[#FF5A36]' : 'bg-[#EFE9DF] text-[#20201E]'
              }`}>
                {friendsList.length}
              </span>
            )}
          </button>

          {/* Tab 3: Requests */}
          <button
            onClick={() => {
              setActiveTab('requests');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'requests'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-[#20201E]/70 hover:text-[#20201E]'
            }`}
          >
            <span>Requests</span>
            {totalPendingRequests > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-[#D9F56A] text-[#20201E] rounded-full font-black">
                {totalPendingRequests}
              </span>
            )}
          </button>

          {/* Tab 4: Jam Sessions */}
          <button
            onClick={() => {
              setActiveTab('jams');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'jams'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-[#20201E]/70 hover:text-[#20201E]'
            }`}
          >
            <span>Jams</span>
            {scheduledEvents.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'jams' ? 'bg-white text-[#FF5A36]' : 'bg-[#EFE9DF] text-[#20201E]'
              }`}>
                {scheduledEvents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar for Messages or Friends */}
      {(activeTab === 'messages' || activeTab === 'friends') && (
        <div className="px-4 mb-3">
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={activeTab === 'messages' ? 'Search messages or creators...' : 'Search friends by name or instrument...'}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: MESSAGES TAB                                  */}
      {/* ======================================================== */}
      {activeTab === 'messages' && (
        <div className="px-4 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const otherParticipantId = conv.participantIds.find((id) => id !== currentUser.id);
              const artist = otherParticipantId ? artists[otherParticipantId] : null;
              const displayName = conv.isGroup
                ? conv.groupName || 'Collective'
                : artist?.displayName || artist?.username || 'Musician';
              const avatar = conv.isGroup
                ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                : artist?.avatarUrl;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/80 transition-all cursor-pointer group border border-transparent hover:border-[#EFE9DF]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={avatar}
                      alt={displayName}
                      size="md"
                      hasCollabBadge={conv.unreadCount > 0}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#20201E] tracking-tight truncate">
                          {displayName}
                        </span>
                        {conv.isGroup && (
                          <span className="text-[10px] bg-[#E9DFFF] text-[#5B418E] px-1.5 py-0.2 rounded font-bold">
                            Band
                          </span>
                        )}
                        {!conv.isGroup && artist && (
                          <span className="text-[11px] text-[#8E8E93]">@{artist.username}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8E8E93] truncate max-w-[220px] mt-0.5">
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-[#B9B2A9]">
                      {conv.updatedAt}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D8B]" />
                    )}
                    <span className="text-[#B9B2A9] group-hover:text-[#20201E] transition-colors">
                      ›
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title={searchQuery ? 'No matching conversations' : 'No messages yet'}
              description={
                searchQuery
                  ? `No conversations matched "${searchQuery}".`
                  : 'Connect with fellow musicians, reply to stems, or start a new direct conversation.'
              }
              actionLabel="Start a Conversation"
              onAction={() => setIsNewChatModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: FRIENDS TAB                                   */}
      {/* ======================================================== */}
      {activeTab === 'friends' && (
        <div className="px-4 space-y-2.5">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white p-3.5 rounded-3xl border border-[#EFE9DF] shadow-2xs flex items-center justify-between"
              >
                <div
                  onClick={() => onNavigateToStage && onNavigateToStage(friend.id)}
                  className="flex items-center gap-3 cursor-pointer group min-w-0"
                >
                  <Avatar src={friend.avatarUrl} alt={friend.displayName} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#20201E] group-hover:text-[#FF5A36] transition-colors truncate">
                        {friend.displayName}
                      </span>
                      <span className="text-[11px] text-[#8E8E93]">@{friend.username}</span>
                    </div>
                    <p className="text-[11px] text-[#8E8E93] truncate">
                      {friend.instruments.slice(0, 2).join(' · ')} {friend.genres.length > 0 && `· ${friend.genres[0]}`}
                    </p>
                  </div>
                </div>

                {/* Friend Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConversationWithUser(friend.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF7F2] hover:bg-[#F2ECE2] text-[#20201E] border border-[#EFE9DF] transition-colors cursor-pointer"
                    title="Send Message"
                  >
                    💬 Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenJamModal(friend)}
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer"
                    title="Request Jam"
                  >
                    ⚡ Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRemoveFriendship) {
                        onRemoveFriendship(friend.id);
                        showToast(`Removed ${friend.displayName} from friends.`);
                      }
                    }}
                    className="w-7 h-7 rounded-full text-[#8E8E93] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer text-xs"
                    title="Unfriend"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={searchQuery ? 'No friends matched' : 'No friends yet'}
              description={
                searchQuery
                  ? `No friends found for "${searchQuery}".`
                  : 'Add friends from their Stage profile or accept pending requests to connect and collaborate.'
              }
              actionLabel="Discover Musicians"
              onAction={() => setIsNewChatModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: REQUESTS TAB                                  */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="px-4 space-y-5">
          {/* Subsection: Incoming Friend Requests */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#20201E]">
                Incoming Friend Requests ({incomingFriendRequests.length})
              </h3>
              <span className="text-[10px] text-[#8E8E93]">Requires your confirmation</span>
            </div>

            {incomingFriendRequests.length > 0 ? (
              incomingFriendRequests.map((freq) => {
                const sender = artists[freq.senderId] || currentUser;
                return (
                  <div
                    key={freq.id}
                    className="bg-white p-3.5 rounded-3xl border border-[#EFE9DF] shadow-2xs flex items-center justify-between"
                  >
                    <div
                      onClick={() => onNavigateToStage && onNavigateToStage(sender.id)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <Avatar src={sender.avatarUrl} alt={sender.displayName} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#20201E] group-hover:text-[#FF5A36] transition-colors truncate">
                            {sender.displayName}
                          </span>
                          <span className="text-[10px] text-[#8E8E93]">@{sender.username}</span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93] truncate">
                          {sender.instruments.slice(0, 2).join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onAcceptFriendRequest) {
                            onAcceptFriendRequest(freq.id);
                            showToast(`You and ${sender.displayName} are now friends! 🤝`);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onDeclineFriendRequest) {
                            onDeclineFriendRequest(freq.id);
                            showToast('Friend request declined.');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-full text-xs font-bold text-[#8E8E93] hover:text-[#20201E] transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8E8E93] bg-white p-3.5 rounded-2xl border border-[#EFE9DF] text-center">
                No incoming friend requests at the moment.
              </p>
            )}
          </div>

          {/* Subsection: Outgoing Pending Friend Requests */}
          {outgoingFriendRequests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#20201E]">
                  Sent Friend Requests ({outgoingFriendRequests.length})
                </h3>
                <span className="text-[10px] text-[#8E8E93]">Waiting for recipient approval</span>
              </div>

              {outgoingFriendRequests.map((freq) => {
                const recipient = artists[freq.recipientId] || {
                  displayName: 'Musician',
                  username: 'artist',
                  avatarUrl: '',
                  instruments: [],
                };
                return (
                  <div
                    key={freq.id}
                    className="bg-white p-3.5 rounded-3xl border border-[#EFE9DF] shadow-2xs flex items-center justify-between"
                  >
                    <div
                      onClick={() => onNavigateToStage && onNavigateToStage(freq.recipientId)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <Avatar src={recipient.avatarUrl} alt={recipient.displayName} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#20201E] group-hover:text-[#FF5A36] transition-colors truncate">
                            {recipient.displayName}
                          </span>
                          <span className="text-[10px] text-[#8E8E93]">@{recipient.username}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#FF5A36] bg-[#FFEBE5] px-2 py-0.2 rounded-full inline-block mt-0.5">
                          Pending
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onCancelFriendRequest) {
                          onCancelFriendRequest(freq.id);
                          showToast('Friend request cancelled.');
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#8E8E93] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subsection: Collaboration Proposals */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#20201E]">
              Collaboration Proposals
            </h3>
            {collabRequests.length > 0 ? (
              collabRequests.map((req) => {
                const sender = artists[req.senderId] || currentUser;
                return (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-3xl border border-[#EFE9DF] shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={sender.avatarUrl} alt={sender.displayName} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#20201E]">{sender.displayName}</span>
                            <span className="text-[10px] font-extrabold bg-[#FFEBE5] text-[#FF5A36] px-2 py-0.5 rounded-full">
                              Proposed: {req.proposedPart}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#8E8E93]">{req.createdAt}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          req.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : req.status === 'declined'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-orange-100 text-[#FF5A36]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#20201E]/80 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EFE9DF]">
                      "{req.message}"
                    </p>

                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <SecondaryButton size="sm" onClick={() => onDeclineCollab(req.id)}>
                          Decline
                        </SecondaryButton>
                        <PrimaryButton size="sm" onClick={() => onAcceptCollab(req.id)}>
                          Accept & Sync DNA
                        </PrimaryButton>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No collaboration requests"
                description="Share open stems in Circle or suggest a Quick Collab."
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: JAM SESSIONS TAB                              */}
      {/* ======================================================== */}
      {activeTab === 'jams' && (
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-[#20201E] uppercase tracking-wider">
              Jam Schedule ({scheduledEvents.length})
            </span>
            <button
              onClick={() => handleOpenJamModal()}
              className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
            >
              + Schedule Jam
            </button>
          </div>

          {scheduledEvents.length > 0 ? (
            scheduledEvents.map((evt) => {
              const participantProfiles = evt.participants
                .map((id) => artists[id] || (id === currentUser.id ? currentUser : null))
                .filter((p): p is UserProfile => p !== null);

              const isHost = evt.hostUserId === currentUser.id;
              const isInProgress = evt.eventStatus === 'in-progress' || evt.sessionType === 'now';

              return (
                <div
                  key={evt.id}
                  className="bg-white p-4 rounded-3xl border border-[#EFE9DF] shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-[#20201E]">{evt.title}</h4>
                        {isInProgress ? (
                          <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            LIVE NOW
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#D9F56A] text-[#20201E] px-2 py-0.5 rounded-full font-bold">
                            {evt.genre || 'Indie'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        📅 {evt.scheduledTime} · {evt.durationMinutes} mins {evt.instrument && `· ${evt.instrument}`}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        evt.eventStatus === 'cancelled'
                          ? 'bg-gray-100 text-gray-500'
                          : evt.eventStatus === 'completed'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {evt.eventStatus}
                    </span>
                  </div>

                  {evt.note && (
                    <p className="text-xs text-[#20201E]/80 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EFE9DF]">
                      "{evt.note}"
                    </p>
                  )}

                  {/* Collaborators & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#EFE9DF]/60">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        {participantProfiles.map((p) => (
                          <Avatar key={p.id} src={p.avatarUrl} alt={p.displayName} size="xs" />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-[#8E8E93] ml-1">
                        {participantProfiles.map((p) => p.displayName).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {evt.eventStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setActiveLiveJamEvent(evt)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer shadow-2xs"
                        >
                          {isInProgress ? '⚡ Join Live' : '▶ Start Jam'}
                        </button>
                      )}
                      {isHost && evt.eventStatus !== 'cancelled' && onUpdateJamSessionStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateJamSessionStatus(evt.id, 'cancelled');
                            showToast('Jam Session cancelled.');
                          }}
                          className="px-2.5 py-1.5 rounded-full text-xs font-bold text-[#8E8E93] hover:text-red-500 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No scheduled jam sessions"
              description="Coordinate live rehearsals or schedule Song DNA stem recording with fellow musicians."
              actionLabel="Request Jam Session"
              onAction={() => handleOpenJamModal()}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* INTERACTIVE CONVERSATION DETAIL MODAL                    */}
      {/* ======================================================== */}
      {activeConversation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-[82vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden border border-[#EFE9DF] shadow-2xl">
            {/* Conversation Header */}
            {(() => {
              const otherParticipantId = activeConversation.participantIds.find((id) => id !== currentUser.id);
              const partner = otherParticipantId ? artists[otherParticipantId] : null;

              return (
                <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#EFE9DF] bg-[#FAF7F2] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={
                        activeConversation.isGroup
                          ? undefined
                          : partner?.avatarUrl
                      }
                      alt="Chat"
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#20201E] truncate">
                          {activeConversation.isGroup
                            ? activeConversation.groupName
                            : partner?.displayName || 'Musician'}
                        </h3>
                        {partner && (
                          <span className="text-[11px] text-[#8E8E93]">@{partner.username}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#D9F56A] font-black bg-[#20201E] px-2 py-0.2 rounded-full inline-block">
                        Active in Collab
                      </span>
                    </div>
                  </div>

                  {/* Actions: Visit Stage, Request Jam, Close */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {partner && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToStage) {
                              setActiveConversation(null);
                              onNavigateToStage(partner.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#20201E] border border-[#EFE9DF] hover:bg-[#F2ECE2] transition-colors cursor-pointer"
                        >
                          Stage ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenJamModal(partner)}
                          className="px-2.5 py-1 rounded-full text-xs font-black bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer"
                        >
                          ⚡ Jam
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="w-8 h-8 rounded-full bg-[#EBE5DA] flex items-center justify-center text-[#20201E] hover:bg-[#DFD8CC] transition-colors cursor-pointer ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Message History Body (Chronological) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
              {/* Prior messages */}
              <div className="flex justify-start">
                <div className="max-w-[78%] bg-white p-3 rounded-2xl rounded-tl-xs shadow-2xs border border-[#EFE9DF]">
                  <p className="text-xs text-[#20201E] leading-relaxed">
                    {activeConversation.lastMessage.text}
                  </p>
                  <span className="text-[9px] text-[#B9B2A9] mt-1 block">
                    {activeConversation.lastMessage.createdAt}
                  </span>
                </div>
              </div>

              {/* Sent messages from this session */}
              {(localMessages[activeConversation.id] || []).map((msg) => (
                <div key={msg.id} className="flex justify-end animate-in fade-in duration-100">
                  <div className="max-w-[78%] bg-[#FF5A36] text-white p-3 rounded-2xl rounded-tr-xs shadow-2xs">
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] text-white/70 mt-1 block text-right">
                      {msg.createdAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#EFE9DF] flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type a message or audio idea..."
                className="flex-1 bg-[#FAF7F2] border border-[#EFE9DF] rounded-full px-4 py-2 text-xs text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              />
              <PrimaryButton size="sm" type="submit" disabled={!newMessageText.trim()}>
                Send
              </PrimaryButton>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* START NEW CHAT / CONVERSATION MODAL                      */}
      {/* ======================================================== */}
      {isNewChatModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewChatModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 border border-[#EFE9DF] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] shrink-0">
              <div>
                <h3 className="text-base font-black text-[#20201E]">Start a Conversation</h3>
                <p className="text-xs text-[#8E8E93]">Choose a friend or musician to message</p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#20201E] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-3 shrink-0">
              <input
                type="text"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Search musicians..."
                className="w-full bg-[#FAF7F2] text-xs p-2.5 rounded-xl border border-[#EFE9DF] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]"
              />
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
              {artistsList
                .filter(
                  (a) =>
                    a.id !== currentUser.id &&
                    (a.displayName.toLowerCase().includes(newChatSearch.toLowerCase()) ||
                      a.username.toLowerCase().includes(newChatSearch.toLowerCase()))
                )
                .map((musician) => {
                  const isFriend = areFriends(friendships, currentUser.id, musician.id);
                  return (
                    <div
                      key={musician.id}
                      onClick={() => handleOpenConversationWithUser(musician.id)}
                      className="p-2.5 rounded-2xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar src={musician.avatarUrl} alt={musician.displayName} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#20201E] group-hover:text-[#FF5A36]">
                              {musician.displayName}
                            </span>
                            {isFriend && (
                              <span className="text-[9px] bg-[#D9F56A] text-[#20201E] font-black px-1.5 py-0.2 rounded-full">
                                Friend
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8E8E93]">
                            @{musician.username} · {musician.instruments.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#FF5A36] group-hover:translate-x-0.5 transition-transform">
                        Message ›
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REQUEST JAM SESSION MODAL                                */}
      {/* ======================================================== */}
      <JamSessionModal
        isOpen={isJamModalOpen}
        onClose={() => {
          setIsJamModalOpen(false);
          setJamTargetUser(undefined);
        }}
        currentUser={currentUser}
        initialTargetUser={jamTargetUser}
        availableMusicians={artistsList.filter((a) => a.id !== currentUser.id)}
        onConfirmSchedule={handleConfirmJamSchedule}
      />

      {/* ======================================================== */}
      {/* LIVE JAM ROOM MODAL (Real-Time Interactive Jam)         */}
      {/* ======================================================== */}
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
    </div>
  );
};
