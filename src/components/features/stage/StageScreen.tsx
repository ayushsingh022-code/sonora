/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — StageScreen Redesign
 * Matches Screenshot 2's dark cinematic artist presentation,
 * immersive hero, social icons, Collab/Tracks/Tour tabs, and music cards.
 * Preserves all Phase 1 & 2 functionality (Follow, Add Friend, Edit Profile, Switcher).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  Post,
  FollowRelationship,
  FriendRequest,
  Friendship,
} from '../../../types/models';
import { ShareIcon, HeartFilledIcon, SparklesIcon } from '../../common/SonoraIcons';
import { EditProfileModal } from './EditProfileModal';
import { DemoUserSwitcher } from '../../common/DemoUserSwitcher';
import { ArtistSynergyReportModal } from '../ai/ArtistSynergyReportModal';
import {
  isFollowing as checkIsFollowing,
  areFriends as checkAreFriends,
  getAddFriendUIState,
} from '../../../utils/socialRelationships';

interface StageScreenProps {
  artist: UserProfile;
  currentUser: UserProfile;
  allArtists: Record<string, UserProfile>;
  primaryDemoKeys: readonly string[];
  posts: Post[];
  followList: FollowRelationship[];
  friendships: Friendship[];
  friendRequests: FriendRequest[];
  onToggleFollow: (targetUserId: string) => void;
  onSendFriendRequest: (targetUserId: string) => void;
  onCancelFriendRequest: (requestId: string) => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onDeclineFriendRequest: (requestId: string) => void;
  onRemoveFriendship: (targetUserId: string) => void;
  onEditProfile: (updated: Partial<UserProfile>) => void;
  onSwitchUser: (userKey: string) => void;
  onBack?: () => void;
  onRequestJamSession?: (artist: UserProfile) => void;
  onStartConversation?: (targetUserId: string) => void;
}

export const StageScreen: React.FC<StageScreenProps> = ({
  artist,
  currentUser,
  allArtists,
  primaryDemoKeys,
  posts,
  followList,
  friendships,
  friendRequests,
  onToggleFollow,
  onSendFriendRequest,
  onCancelFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriendship,
  onEditProfile,
  onSwitchUser,
  onBack,
  onRequestJamSession,
  onStartConversation,
}) => {
  const isSelf = artist.id === currentUser.id;

  // Tabs matching Screenshot 2: 'collab' | 'tracks' | 'tour'
  const [activeTab, setActiveTab] = useState<'collab' | 'tracks' | 'tour'>('tracks');

  // Modals & toast state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnfriendConfirmOpen, setIsUnfriendConfirmOpen] = useState(false);
  const [isSynergyModalOpen, setIsSynergyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio Playback state & Web Audio synth fallback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthStopRef = useRef<(() => void) | null>(null);

  const startSynthGroove = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let isStopped = false;

      // Warm neo-soul / lo-fi chord sequence
      const chords = [
        [277.18, 349.23, 415.3, 523.25], // Dbmaj7
        [311.13, 369.99, 466.16, 554.37], // Ebm7
        [349.23, 415.3, 523.25, 622.25], // Fm7
        [233.08, 277.18, 349.23, 466.16], // Bbm7
      ];

      let chordIndex = 0;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const playChord = () => {
        if (isStopped) return;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        currentChord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);

          noteGain.gain.setValueAtTime(0, ctx.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.7);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(ctx.currentTime + i * 0.04);
          osc.stop(ctx.currentTime + 1.9);
        });
      };

      playChord();
      const interval = setInterval(playChord, 1800);

      synthStopRef.current = () => {
        isStopped = true;
        clearInterval(interval);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 200);
      };
    } catch {
      // AudioContext not supported or restricted; continue gracefully
    }
  };

  const stopSynthGroove = () => {
    if (synthStopRef.current) {
      synthStopRef.current();
      synthStopRef.current = null;
    }
  };

  // Clean audio playback toggle with resilient fallback
  const togglePlayTrack = (trackId: string, audioUrl?: string) => {
    if (playingTrackId === trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynthGroove();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynthGroove();

      const url = audioUrl || 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3';
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.onended = () => {
        stopSynthGroove();
        setPlayingTrackId(null);
      };
      audio.onerror = () => {
        // External file error: rely on synth groove
        startSynthGroove();
        setPlayingTrackId(trackId);
      };
      audio.play().catch(() => {
        // Autoplay may be restricted; fallback to synth
        startSynthGroove();
        setPlayingTrackId(trackId);
      });
      audioRef.current = audio;
      startSynthGroove();
      setPlayingTrackId(trackId);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynthGroove();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Follow & Friendship states
  const isCurrentlyFollowing = checkIsFollowing(followList, currentUser.id, artist.id);
  const isFriend = checkAreFriends(friendships, currentUser.id, artist.id);
  const friendUI = getAddFriendUIState(currentUser.id, artist.id, friendships, friendRequests);

  // Privacy boundary: Private accounts require mutual friendship to view full music and stems
  const canViewRestrictedContent = artist.isProfilePublic || isSelf || isFriend;

  // Posts by this artist
  const artistPosts = posts.filter((p) => p.creatorId === artist.id);
  const existingUsernames = Object.values(allArtists).map((a) => a.username);

  // Dynamic Demo Tracks tailored to current artist while matching Screenshot 2 layout
  const getArtistTracks = (art: UserProfile) => {
    if (art.id === 'user_bryanthemensah' || art.username === 'bryanthemensah') {
      return [
        {
          id: 'track_somethin',
          title: "Somethin'",
          artistName: art.displayName,
          duration: '2:34',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        },
        {
          id: 'track_highslows',
          title: 'Highs & Lows',
          artistName: art.displayName,
          duration: '3:12',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        },
      ];
    } else if (art.username === 'rhea.vocals' || art.id === 'user_rhea') {
      return [
        {
          id: 'track_latenight',
          title: 'Late Night Riff',
          artistName: art.displayName,
          duration: '2:55',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
        },
        {
          id: 'track_velvet',
          title: 'Velvet Sunset',
          artistName: art.displayName,
          duration: '3:30',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        },
      ];
    } else if (art.username === 'arjun.gtr' || art.id === 'user_arjun') {
      return [
        {
          id: 'track_midnightfret',
          title: 'Midnight Fretboard',
          artistName: art.displayName,
          duration: '3:08',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
        },
        {
          id: 'track_echoesbombay',
          title: 'Echoes of Bombay',
          artistName: art.displayName,
          duration: '2:45',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        },
      ];
    } else if (art.username === 'marcus.bass' || art.id === 'user_marcus') {
      return [
        {
          id: 'track_pockettheory',
          title: 'Pocket Theory',
          artistName: art.displayName,
          duration: '3:18',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        },
        {
          id: 'track_lowend',
          title: 'Low End Groove',
          artistName: art.displayName,
          duration: '2:40',
          audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
          artworkUrl:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        },
      ];
    }
    return [
      {
        id: `track_feat_${art.id}`,
        title: "Somethin'",
        artistName: art.displayName,
        duration: '2:34',
        audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
        artworkUrl:
          art.coverUrl ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: `track_sub_${art.id}`,
        title: 'Highs & Lows',
        artistName: art.displayName,
        duration: '3:12',
        audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
        artworkUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      },
    ];
  };

  const demoTracks = getArtistTracks(artist);

  // Social Links mapping: strictly render where URLs exist (matching Bryan's 5 icons in Screenshot 2)
  const socialLinks = artist.socialLinks || (artist.id === 'user_bryanthemensah' || artist.username === 'bryanthemensah' ? {
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    soundcloud: 'https://soundcloud.com',
    youtube: 'https://youtube.com',
    spotify: 'https://spotify.com',
  } : undefined);

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen pb-32 selection:bg-[#FF5A36]/30 selection:text-[#FF5A36]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E22] border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#D9F56A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* A. ARTIST HERO SECTION (Cinematic Edge-to-Edge with Gradient) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full h-[400px] sm:h-[450px] overflow-hidden bg-neutral-950">
        {/* Cover Photo */}
        <img
          src={artist.coverUrl || artist.avatarUrl}
          alt={artist.displayName}
          className="w-full h-full object-cover object-top sm:object-center"
        />

        {/* Top Vignette for controls contrast */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />

        {/* Cinematic Gradient Fade (fades into pitch black #0A0A0C at bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/80 via-40% to-transparent pointer-events-none z-10" />

        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          {/* Back Circular Button with clean SVG Chevron */}
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer shadow-md"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Right Actions: Persona Switcher, Share, Favorite */}
          <div className="flex items-center gap-2">
            <DemoUserSwitcher
              currentUserId={currentUser.id}
              artists={allArtists}
              primaryKeys={primaryDemoKeys}
              onSelectUser={onSwitchUser}
              theme="dark"
            />

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: artist.displayName, text: artist.bio });
                } else {
                  showToast('Profile link copied to clipboard!');
                }
              }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer shadow-md"
              aria-label="Share Artist"
            >
              <ShareIcon size={17} color="#FFFFFF" />
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleFollow(artist.id);
                showToast(
                  isCurrentlyFollowing
                    ? `Removed ${artist.displayName} from favorites`
                    : `Added ${artist.displayName} to favorites!`
                );
              }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer shadow-md"
              aria-label="Favorite Artist"
            >
              <HeartFilledIcon
                size={17}
                color={isCurrentlyFollowing ? '#FF2D8B' : '#FFFFFF'}
              />
            </button>
          </div>
        </div>

        {/* Hero Bottom Typography & Social Links (Matching Screenshot 2) */}
        <div className="absolute bottom-3 left-4 right-4 z-20 text-center">
          {/* Artist Name */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase drop-shadow-md">
            {artist.displayName}
          </h1>

          {/* Short Bio */}
          <p className="text-xs sm:text-sm font-semibold text-white/85 mt-1 max-w-sm mx-auto leading-snug">
            {artist.bio}
          </p>

          {/* Social Media Icons (Rendered where URLs exist, matching Screenshot 2) */}
          {socialLinks && (
            <div className="flex items-center justify-center gap-4 mt-3 text-white">
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#FF5A36] transition-colors p-1"
                  aria-label="Twitter / X"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}

              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#FF2D8B] transition-colors p-1"
                  aria-label="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}

              {socialLinks.soundcloud && (
                <a
                  href={socialLinks.soundcloud}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#FF5A36] transition-colors p-1"
                  aria-label="SoundCloud"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.175 12.225c-.049 0-.098.049-.098.098v4.99c0 .049.049.098.098.098s.098-.049.098-.098v-4.99c0-.049-.049-.098-.098-.098zm1.961-1.961c-.049 0-.098.049-.098.098v7.05c0 .049.049.098.098.098s.098-.049.098-.098v-7.05c0-.049-.049-.098-.098-.098zm1.961-1.961c-.049 0-.098.049-.098.098v8.913c0 .049.049.098.098.098s.098-.049.098-.098V8.399c0-.049-.049-.098-.098-.098zm12.355 1.57c-.49 0-.931.147-1.323.392-.392-1.961-2.108-3.432-4.167-3.432-.441 0-.882.098-1.275.245v7.256c0 .588.49 1.078 1.078 1.078h5.687c1.765 0 3.187-1.422 3.187-3.187 0-1.765-1.422-3.187-3.187-3.187z" />
                  </svg>
                </a>
              )}

              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-500 transition-colors p-1"
                  aria-label="YouTube"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}

              {socialLinks.spotify && (
                <a
                  href={socialLinks.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-green-500 transition-colors p-1"
                  aria-label="Spotify"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.792-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.51 9.721 1.113.294.18.386.562.207.857zm1.225-2.724c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.849-.107-.976-.52-.127-.414.107-.849.52-.976 3.632-1.102 8.147-.568 11.236 1.332.366.226.481.707.257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.016-.129-1.165-.624-.149-.495.13-1.017.624-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.327z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Social Relationship & Profile Actions (Preserving all Phase 2 rules) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
            {isSelf ? (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-sm"
              >
                Edit Profile
              </button>
            ) : (
              <>
                {/* Independent Follow Action */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleFollow(artist.id);
                    showToast(
                      isCurrentlyFollowing
                        ? `Unfollowed ${artist.displayName}`
                        : `Now following ${artist.displayName}!`
                    );
                  }}
                  className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer shadow-sm ${
                    isCurrentlyFollowing
                      ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                      : 'bg-[#FF5A36] text-white hover:bg-[#F04D29]'
                  }`}
                >
                  {isCurrentlyFollowing ? '✓ Following' : '+ Follow'}
                </button>

                {/* Independent Add Friend Action */}
                {friendUI.state === 'not_connected' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendFriendRequest(artist.id);
                      showToast(`Friend request sent to ${artist.displayName}!`);
                    }}
                    className="px-4 py-1.5 rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                  >
                    + Add Friend
                  </button>
                )}

                {friendUI.state === 'outgoing_pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (friendUI.activeRequestId) {
                        onCancelFriendRequest(friendUI.activeRequestId);
                        showToast('Friend request cancelled.');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full font-bold text-xs bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-400 border border-white/20 transition-all cursor-pointer"
                  >
                    Request Sent (Cancel)
                  </button>
                )}

                {friendUI.state === 'incoming_pending' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (friendUI.activeRequestId) {
                          onAcceptFriendRequest(friendUI.activeRequestId);
                          showToast(`You and ${artist.displayName} are now friends!`);
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (friendUI.activeRequestId) {
                          onDeclineFriendRequest(friendUI.activeRequestId);
                          showToast('Friend request declined.');
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {friendUI.state === 'friends' && (
                  <button
                    type="button"
                    onClick={() => setIsUnfriendConfirmOpen(true)}
                    className="px-4 py-1.5 rounded-full font-bold text-xs bg-[#D9F56A]/20 text-[#D9F56A] hover:bg-red-500/20 hover:text-red-400 border border-[#D9F56A]/40 transition-all cursor-pointer"
                  >
                    ✓ Friends
                  </button>
                )}

                {/* Direct Jam Session Request Action */}
                {onRequestJamSession && (
                  <button
                    type="button"
                    onClick={() => onRequestJamSession(artist)}
                    className="px-3.5 py-1.5 rounded-full font-black text-xs bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span>⚡</span>
                    <span>Jam Session</span>
                  </button>
                )}

                {/* AI Synergy Report Action */}
                <button
                  type="button"
                  onClick={() => setIsSynergyModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full font-black text-xs bg-gradient-to-r from-[#FF5A36]/20 to-[#FF2D8B]/20 border border-[#FF5A36]/40 hover:border-[#FF5A36] text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="View AI Collaboration Synergy & Compatibility Report"
                >
                  <SparklesIcon size={12} color="#FF5A36" />
                  <span>AI Synergy</span>
                </button>
              </>
            )}

            {!artist.isProfilePublic && (
              <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2.5 py-1 rounded-full border border-white/10">
                🔒 Private
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* B. ARTIST CONTENT NAVIGATION TABS (Collab, Tracks, Tour)     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 pt-4 pb-3 px-4">
        {/* Collab Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('collab')}
          className={`text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === 'collab'
              ? 'px-5 py-2 rounded-full bg-[#FAF7F2] text-[#20201E] shadow-md'
              : 'text-white/60 hover:text-white px-2 py-2'
          }`}
        >
          Collab
        </button>

        {/* Tracks Tab (Active in Screenshot 2) */}
        <button
          type="button"
          onClick={() => setActiveTab('tracks')}
          className={`text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === 'tracks'
              ? 'px-5 py-2 rounded-full bg-[#FAF7F2] text-[#20201E] shadow-md'
              : 'text-white/60 hover:text-white px-2 py-2'
          }`}
        >
          Tracks
        </button>

        {/* Tour Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('tour')}
          className={`text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === 'tour'
              ? 'px-5 py-2 rounded-full bg-[#FAF7F2] text-[#20201E] shadow-md'
              : 'text-white/60 hover:text-white px-2 py-2'
          }`}
        >
          Tour
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRIVACY BOUNDARY (Section 9)                                  */}
      {/* ------------------------------------------------------------- */}
      {!canViewRestrictedContent ? (
        <div className="mx-4 my-6 p-8 bg-[#141416] rounded-3xl border border-white/10 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto mb-3 text-2xl">
            🔒
          </div>
          <h3 className="text-base font-black text-white">This Artist's Stage is Private</h3>
          <p className="text-xs text-white/70 mt-1 mb-4 max-w-sm mx-auto leading-relaxed">
            Only confirmed mutual Friends can view {artist.displayName}'s published tracks, stems, and collaboration workspace. Following alone does not unlock private content.
          </p>
          {friendUI.state === 'not_connected' && (
            <button
              type="button"
              onClick={() => {
                onSendFriendRequest(artist.id);
                showToast(`Friend request sent to ${artist.displayName}!`);
              }}
              className="px-5 py-2 rounded-full bg-[#FF5A36] text-white font-bold text-xs hover:bg-[#F04D29] transition-all cursor-pointer"
            >
              Send Friend Request to View
            </button>
          )}
          {friendUI.state === 'outgoing_pending' && (
            <span className="inline-block text-xs font-bold text-[#FF5A36] bg-[#FF5A36]/20 px-3.5 py-1.5 rounded-full border border-[#FF5A36]/30">
              Friend Request Pending Approval
            </span>
          )}
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* C. MUSIC CARDS — TRACKS TAB (Matching Screenshot 2 exactly!)   */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'tracks' && (
            <div className="px-4 space-y-4 max-w-md mx-auto">
              {/* CARD 1: "Somethin'" (Featured Large Dark Card) */}
              <div className="bg-[#141417] border border-white/10 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
                {/* Header: Title + Artist Name on left, "Share ↗" pill on right */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white">
                      {demoTracks[0].title}
                    </h3>
                    <p className="text-xs text-[#B9B2A9] font-medium mt-0.5">
                      {demoTracks[0].artistName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: demoTracks[0].title,
                          text: `Listen to ${demoTracks[0].title} by ${demoTracks[0].artistName} on Sonora`,
                        });
                      } else {
                        showToast('Track link copied!');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    aria-label="Share Track"
                  >
                    <span>Share</span>
                    <span className="text-[11px]">↗</span>
                  </button>
                </div>

                {/* Media Artwork Area (Bryan with warm studio lighting) */}
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-neutral-900 shadow-md">
                  <img
                    src={demoTracks[0].artworkUrl}
                    alt={demoTracks[0].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle inner shadow / gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Bottom Audio Player Bar */}
                <div className="flex items-center gap-3 pt-3">
                  {/* Circular White Play/Pause Button */}
                  <button
                    type="button"
                    onClick={() => togglePlayTrack(demoTracks[0].id, demoTracks[0].audioUrl)}
                    className="w-11 h-11 rounded-full bg-white text-[#0A0A0C] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                    aria-label={playingTrackId === demoTracks[0].id ? 'Pause' : 'Play'}
                  >
                    {playingTrackId === demoTracks[0].id ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                        <path d="M8 5V19L19 12L8 5Z" />
                      </svg>
                    )}
                  </button>

                  {/* Visual Waveform Bars */}
                  <div className="flex-1 flex items-center gap-1 h-7 px-1 overflow-hidden">
                    {[
                      35, 50, 75, 90, 60, 45, 80, 95, 70, 85, 55, 40, 70, 90, 85, 60, 45, 80,
                      95, 75, 50, 35, 65, 85, 50, 35, 20, 15,
                    ].map((h, i) => {
                      const isPlaying = playingTrackId === demoTracks[0].id;
                      return (
                        <span
                          key={i}
                          className={`w-[2.5px] rounded-full transition-all duration-300 ${
                            isPlaying ? 'bg-white animate-pulse' : 'bg-white/40'
                          }`}
                          style={{
                            height: `${isPlaying ? Math.max(25, h * (i % 2 === 0 ? 1 : 0.8)) : h * 0.45}%`,
                            animationDelay: `${i * 40}ms`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Duration Text */}
                  <span className="text-xs font-mono font-medium text-white/70 shrink-0">
                    {demoTracks[0].duration}
                  </span>

                  {/* Overflow Dots Menu */}
                  <button
                    type="button"
                    onClick={() => showToast('Track options: Add to Playlist, View Stems')}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label="Track options"
                  >
                    •••
                  </button>
                </div>
              </div>

              {/* CARD 2: "Highs & Lows" (Compact Horizontal Card) */}
              <div className="bg-[#141417] border border-white/10 rounded-3xl p-3.5 flex items-center justify-between shadow-xl relative overflow-hidden">
                {/* Left Info */}
                <div className="min-w-0 pr-3">
                  <h4 className="text-sm font-bold text-white truncate">
                    {demoTracks[1].title}
                  </h4>
                  <p className="text-xs text-[#B9B2A9] font-medium mt-0.5 truncate">
                    {demoTracks[1].artistName}
                  </p>
                </div>

                {/* Right Photo Thumbnail with embedded play button, duration & dots */}
                <div className="relative w-36 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-between px-2.5 bg-neutral-900 border border-white/10">
                  <img
                    src={demoTracks[1].artworkUrl}
                    alt={demoTracks[1].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs pointer-events-none" />

                  {/* Play Button Overlay */}
                  <button
                    type="button"
                    onClick={() => togglePlayTrack(demoTracks[1].id, demoTracks[1].audioUrl)}
                    className="relative z-10 w-8 h-8 rounded-full bg-white text-[#0A0A0C] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    aria-label={playingTrackId === demoTracks[1].id ? 'Pause' : 'Play'}
                  >
                    {playingTrackId === demoTracks[1].id ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                        <path d="M8 5V19L19 12L8 5Z" />
                      </svg>
                    )}
                  </button>

                  {/* Duration */}
                  <span className="relative z-10 text-[11px] font-mono font-bold text-white">
                    {demoTracks[1].duration}
                  </span>

                  {/* Overflow Dots */}
                  <button
                    type="button"
                    onClick={() => showToast('Track options: View Stems')}
                    className="relative z-10 text-white/80 hover:text-white p-1 text-xs"
                    aria-label="Options"
                  >
                    •••
                  </button>
                </div>
              </div>

              {/* Stats Bar (Followers, Friends, Collabs, Stems) */}
              <div className="bg-[#141417] border border-white/10 rounded-2xl p-3 flex items-center justify-around text-center text-xs mt-4">
                <div>
                  <span className="text-sm font-black text-white">
                    {artist.stats.followersCount.toLocaleString()}
                  </span>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Followers</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div>
                  <span className="text-sm font-black text-white">
                    {artist.stats.followingCount.toLocaleString()}
                  </span>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Following</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div>
                  <span className="text-sm font-black text-[#FF5A36]">
                    {artist.stats.friendsCount}
                  </span>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Friends</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div>
                  <span className="text-sm font-black text-[#D9F56A]">
                    {artist.stats.collabsCount}
                  </span>
                  <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Collabs</p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* D. COLLAB TAB (Collaboration Needs, Stems, Posts)             */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'collab' && (
            <div className="px-4 space-y-4 max-w-md mx-auto">
              <div className="bg-[#141417] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Collaboration Workspace
                  </h3>
                  <span className="text-[10px] bg-[#D9F56A] text-[#0A0A0C] px-2 py-0.5 rounded-full font-black">
                    Open for Stems
                  </span>
                </div>

                <p className="text-xs text-white/80 leading-relaxed">
                  Bryan is looking for live brass arrangements (Sax, Trumpet) and heavy neo-soul Rhodes progressions for upcoming tracks. Stems must be clean 24-bit 48kHz WAV.
                </p>

                {/* Instruments */}
                <div>
                  <span className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Musical Roles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.instruments.map((inst) => (
                      <span
                        key={inst}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D9F56A] text-[#0A0A0C]"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <span className="text-[11px] font-bold text-[#8E8E93] block mb-1">
                    Genres:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E9DFFF] text-[#5B418E]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Opening Collaboration Draft...')}
                    className="flex-1 py-2 text-xs font-bold rounded-full bg-[#FF5A36] text-white hover:bg-[#F04D29] transition-all cursor-pointer shadow-sm text-center"
                  >
                    Propose Collaboration
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Downloading demo stems pack...')}
                    className="px-4 py-2 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer text-center"
                  >
                    Stems
                  </button>
                </div>
              </div>

              {/* Published Posts by Artist */}
              {artistPosts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/60">
                    Published Performance Posts ({artistPosts.length})
                  </h4>
                  {artistPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-[#141417] border border-white/10 rounded-2xl p-3.5 space-y-2"
                    >
                      <p className="text-xs font-bold text-white">{post.caption}</p>
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span>❤️ {post.likesCount} · 💬 {post.commentsCount}</span>
                        <span className="text-[#FF5A36] font-bold">Song DNA Stem</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* E. TOUR TAB (Tour Dates & Live Showcases)                    */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'tour' && (
            <div className="px-4 space-y-3 max-w-md mx-auto">
              {[
                {
                  city: 'London Live Showcase',
                  venue: 'The Jazz Cafe, Camden',
                  date: 'Nov 14, 2026',
                  status: 'On Sale',
                },
                {
                  city: 'Accra Afro-Fusion Night',
                  venue: 'Alliance Française',
                  date: 'Dec 05, 2026',
                  status: 'Few Left',
                },
                {
                  city: 'New York Indie Sessions',
                  venue: "Baby's All Right, Brooklyn",
                  date: 'Jan 22, 2027',
                  status: 'RSVP Open',
                },
              ].map((tour, idx) => (
                <div
                  key={idx}
                  className="bg-[#141417] border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-xl"
                >
                  <div>
                    <h4 className="text-sm font-black text-white">{tour.city}</h4>
                    <p className="text-xs text-[#B9B2A9] mt-0.5">{tour.venue}</p>
                    <span className="text-[11px] font-mono text-[#D9F56A] mt-1 block">
                      📅 {tour.date}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`Opening tickets for ${tour.city}...`)}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#FF5A36] text-white hover:bg-[#F04D29] transition-all cursor-pointer shadow-sm"
                  >
                    Tickets
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS: Unfriend Confirm & Edit Profile                       */}
      {/* ------------------------------------------------------------- */}
      {isUnfriendConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#18181C] text-white w-full max-w-sm rounded-3xl p-5 border border-white/15 shadow-2xl text-center">
            <h3 className="text-base font-black">Remove Friendship?</h3>
            <p className="text-xs text-white/70 mt-2 mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">{artist.displayName}</span> as a friend? Follow relationships will remain unaffected.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsUnfriendConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Keep Friend
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFriendship(artist.id);
                  setIsUnfriendConfirmOpen(false);
                  showToast(`Removed friendship with ${artist.displayName}`);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={artist}
          existingUsernames={existingUsernames}
          onSave={(updated) => {
            onEditProfile(updated);
            showToast('Profile updated successfully!');
          }}
        />
      )}

      {/* AI Collaboration Synergy Report Modal */}
      {isSynergyModalOpen && (
        <ArtistSynergyReportModal
          isOpen={isSynergyModalOpen}
          onClose={() => setIsSynergyModalOpen(false)}
          currentUser={currentUser}
          targetArtist={artist}
          onRequestJamSession={onRequestJamSession}
          onStartConversation={(targetId) => {
            setIsSynergyModalOpen(false);
            if (onStartConversation) onStartConversation(targetId);
          }}
        />
      )}
    </div>
  );
};
