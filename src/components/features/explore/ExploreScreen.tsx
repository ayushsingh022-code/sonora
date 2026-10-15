/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  Post,
  Song,
  SongVersion,
  Contribution,
  FollowRelationship,
} from '../../../types/models';
import { PageHeader } from '../../common/PageHeader';
import { SearchField, FilterChip } from '../../common/SearchAndFilters';
import { Avatar } from '../../common/Avatar';
import { EmptyState } from '../../common/FeedbackStates';
import { SongDnaWaveIcon, HeartFilledIcon, SparklesIcon } from '../../common/SonoraIcons';
import { isFollowing as checkIsFollowing } from '../../../utils/socialRelationships';
import { formatStatCount } from '../circle/FeedPostCard';
import { CollaborationMatchmakerSection } from '../ai/CollaborationMatchmakerSection';

interface ExploreScreenProps {
  currentUser?: UserProfile;
  artists?: Record<string, UserProfile>;
  posts?: Post[];
  songs?: Song[];
  songVersions?: SongVersion[];
  contributions?: Contribution[];
  followList?: FollowRelationship[];
  onToggleFollow?: (targetUserId: string) => void;
  onSelectArtist?: (artistHandle: string) => void;
  onOpenQuickCollab?: () => void;
  onOpenWorkspace?: (song: Song, version?: SongVersion) => void;
  onInspectDNA?: (song: Song) => void;
  onAddPart?: (song: Song, version?: SongVersion) => void;
  onRequestJamSession?: (artist: UserProfile) => void;
  onStartConversation?: (targetUserId: string) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  currentUser,
  artists = {},
  posts = [],
  songs = [],
  songVersions = [],
  contributions = [],
  followList = [],
  onToggleFollow,
  onSelectArtist,
  onOpenQuickCollab,
  onOpenWorkspace,
  onInspectDNA,
  onAddPart,
  onRequestJamSession,
  onStartConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const filterChips = ['All', 'AI Matchmaker ✨', 'Collabs 🧬', 'Vocals', 'Guitar', 'Beats', 'Bass', 'Keys'];

  const genres = [
    {
      name: 'Pop',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
        </svg>
      ),
      bg: 'bg-[#FFEBE5]',
      text: 'text-[#FF5A36]',
    },
    {
      name: 'Indie',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
        </svg>
      ),
      bg: 'bg-[#D9F56A]',
      text: 'text-[#20201E]',
    },
    {
      name: 'Rock',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" />
        </svg>
      ),
      bg: 'bg-[#E9DFFF]',
      text: 'text-[#5B418E]',
    },
    {
      name: 'Hip Hop',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
      bg: 'bg-[#FFE4F1]',
      text: 'text-[#FF2D8B]',
    },
    {
      name: 'Afro-fusion',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      bg: 'bg-[#FEF08A]',
      text: 'text-[#854D0E]',
    },
  ];

  const artistsList = useMemo(() => Object.values(artists), [artists]);

  // Filter creators based on search query
  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return artistsList;
    const q = searchQuery.toLowerCase();
    return artistsList.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        a.instruments?.some((inst) => inst.toLowerCase().includes(q)) ||
        a.genres?.some((g) => g.toLowerCase().includes(q)) ||
        a.bio?.toLowerCase().includes(q)
    );
  }, [artistsList, searchQuery]);

  // Filter posts based on search, category filter chip, and genre
  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return posts.filter((post) => {
      const creator = artists[post.creatorId] || (currentUser?.id === post.creatorId ? currentUser : undefined);
      const song = songs.find((s) => s.id === post.songId);

      // 1. Text Search matching caption, tags, creator name/username, or song title
      const matchesSearch =
        !q ||
        post.caption.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q)) ||
        (creator && (creator.displayName.toLowerCase().includes(q) || creator.username.toLowerCase().includes(q))) ||
        (song && song.title.toLowerCase().includes(q));

      // 2. Category / Filter Chip
      let matchesFilter = true;
      if (activeFilter === 'Collabs 🧬') {
        matchesFilter = post.postType === 'collab' || !!post.songId;
      } else if (activeFilter === 'Vocals') {
        matchesFilter =
          post.tags.some((t) => t.toLowerCase().includes('vocal')) ||
          creator?.instruments?.includes('Vocals') === true;
      } else if (activeFilter === 'Guitar') {
        matchesFilter =
          post.tags.some((t) => t.toLowerCase().includes('guitar')) ||
          creator?.instruments?.includes('Guitar') === true;
      } else if (activeFilter === 'Beats') {
        matchesFilter =
          post.tags.some((t) => t.toLowerCase().includes('beat') || t.toLowerCase().includes('drum')) ||
          creator?.instruments?.includes('Beats') === true;
      } else if (activeFilter === 'Bass') {
        matchesFilter =
          post.tags.some((t) => t.toLowerCase().includes('bass')) ||
          creator?.instruments?.includes('Bass') === true;
      } else if (activeFilter === 'Keys') {
        matchesFilter =
          post.tags.some((t) => t.toLowerCase().includes('key') || t.toLowerCase().includes('piano')) ||
          creator?.instruments?.includes('Keys') === true ||
          creator?.instruments?.includes('Keyboard') === true;
      }

      // 3. Genre Filter
      let matchesGenre = true;
      if (selectedGenre) {
        const targetG = selectedGenre.toLowerCase();
        matchesGenre =
          post.tags.some((t) => t.toLowerCase().includes(targetG)) ||
          creator?.genres?.some((g) => g.toLowerCase() === targetG) === true;
      }

      return matchesSearch && matchesFilter && matchesGenre;
    });
  }, [posts, artists, currentUser, songs, searchQuery, activeFilter, selectedGenre]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setSelectedGenre(null);
  };

  return (
    <div className="pb-24">
      {/* Explore Header */}
      <PageHeader title="Explore" />

      {/* Search Input Bar */}
      <div className="px-4 mb-3">
        <SearchField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search creators, songs, tags, instruments..."
          showFilterButton={true}
          onFilterClick={() => setActiveFilter(activeFilter === 'All' ? 'Collabs 🧬' : 'All')}
        />
      </div>

      {/* Horizontal Filter Chips */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth px-4 mb-5">
        <div className="flex items-center gap-2 min-w-max">
          {filterChips.map((chip) => (
            <FilterChip
              key={chip}
              label={chip}
              isSelected={activeFilter === chip}
              onClick={() => {
                setActiveFilter(chip);
                setSelectedGenre(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Section: For You / Discovery Banners */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-[#20201E] tracking-tight">For you</h2>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-[#B9B2A9] hover:text-[#20201E] cursor-pointer"
          >
            Reset ›
          </button>
        </div>

        {/* Featured AI Matchmaker Banner */}
        <div
          onClick={() => {
            setActiveFilter('AI Matchmaker ✨');
            setSelectedGenre(null);
          }}
          className="mb-3 relative rounded-3xl overflow-hidden p-4 text-white cursor-pointer group shadow-sm hover:shadow-md transition-all border border-[#FF5A36]/30 bg-gradient-to-r from-[#1C1C1E] via-[#242426] to-[#1C1C1E]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                <div className="w-full h-full bg-[#1C1C1E] rounded-[14px] flex items-center justify-center">
                  <SparklesIcon size={18} color="#FF5A36" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D9F56A]">
                    AI Matchmaker
                  </span>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                    Musical Synergy
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  Find collaborators with complementary instruments & sound
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-[#FF5A36] shrink-0 group-hover:translate-x-1 transition-transform">
              Launch →
            </span>
          </div>
        </div>

        {/* 2 Banner Discovery Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Open for Collabs */}
          <div
            onClick={() => {
              setActiveFilter('Collabs 🧬');
              setSelectedGenre(null);
            }}
            className="relative h-44 rounded-3xl overflow-hidden p-3.5 flex flex-col justify-end text-white cursor-pointer group shadow-2xs hover:shadow-md transition-all border border-black/5"
          >
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80"
              alt="Open for Collabs"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1 text-[#D9F56A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
                </svg>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Open for Collabs
                </span>
              </div>
              <p className="text-xs text-white/85 font-medium">Find musicians to jam with</p>
            </div>
          </div>

          {/* Card 2: Song DNA Stems */}
          <div
            onClick={() => {
              setActiveFilter('Collabs 🧬');
              setSelectedGenre(null);
            }}
            className="relative h-44 rounded-3xl overflow-hidden p-3.5 flex flex-col justify-end text-white cursor-pointer group shadow-2xs hover:shadow-md transition-all border border-black/5"
          >
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
              alt="Song DNA Stems"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1 text-[#FF5A36]">
                <SongDnaWaveIcon size={16} color="#FF5A36" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Song DNA Stems
                </span>
              </div>
              <p className="text-xs text-white/85 font-medium">Multi-part lineages & roots</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: AI Matchmaker Interactive Results */}
      {activeFilter === 'AI Matchmaker ✨' && currentUser && (
        <section className="px-4 mb-6">
          <CollaborationMatchmakerSection
            currentUser={currentUser}
            artists={artists}
            followList={followList}
            onToggleFollow={onToggleFollow}
            onNavigateToStage={(handle) => onSelectArtist && onSelectArtist(handle)}
            onStartConversation={onStartConversation}
            onRequestJamSession={onRequestJamSession}
          />
        </section>
      )}

      {/* Section: Featured Creators Spotlight */}
      {filteredCreators.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-[#20201E] tracking-tight">
              Featured Creators
            </h2>
            <span className="text-xs font-bold text-[#B9B2A9]">
              {filteredCreators.length} musicians
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {filteredCreators.map((artist) => {
              const isFollowed = currentUser
                ? checkIsFollowing(followList, currentUser.id, artist.id)
                : false;

              return (
                <div
                  key={artist.id}
                  className="w-48 shrink-0 bg-white rounded-3xl p-3.5 border border-[#EFE9DF] shadow-2xs flex flex-col items-center text-center group hover:shadow-sm transition-all"
                >
                  <div
                    onClick={() => onSelectArtist && onSelectArtist(artist.username)}
                    className="relative cursor-pointer mb-2"
                  >
                    <Avatar
                      src={artist.avatarUrl}
                      alt={artist.displayName}
                      size="lg"
                      hasStoryRing={artist.isOpenForCollab}
                    />
                    {artist.isOpenForCollab && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#D9F56A] text-[#20201E] font-black px-1.5 rounded-full border border-white">
                        Collab
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectArtist && onSelectArtist(artist.username)}
                    className="text-xs font-extrabold text-[#20201E] truncate max-w-full hover:underline cursor-pointer"
                  >
                    {artist.displayName}
                  </h3>
                  <p className="text-[11px] text-[#B9B2A9] truncate max-w-full">
                    @{artist.username}
                  </p>

                  <div className="flex flex-wrap justify-center gap-1 my-2">
                    {artist.instruments?.slice(0, 2).map((inst) => (
                      <span
                        key={inst}
                        className="text-[9px] font-bold bg-[#FAF7F2] text-[#20201E] px-1.5 py-0.5 rounded-md"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>

                  <div className="w-full flex items-center justify-between text-[10px] text-[#B9B2A9] mb-2 px-1">
                    <span>{formatStatCount(artist.stats.followersCount)} followers</span>
                    <span>{artist.stats.collabsCount} collabs</span>
                  </div>

                  <div className="w-full flex gap-1.5">
                    {onToggleFollow && currentUser && artist.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => onToggleFollow(artist.id)}
                        className={`flex-1 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          isFollowed
                            ? 'bg-[#EFE9DF] text-[#20201E] hover:bg-[#E5DDCF]'
                            : 'bg-[#FF5A36] text-white hover:bg-[#F04D29] shadow-2xs'
                        }`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectArtist && onSelectArtist(artist.username)}
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#20201E] transition-colors cursor-pointer"
                      title="View Stage Profile"
                    >
                      Stage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Genres */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-[#20201E] tracking-tight">Genres</h2>
          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre(null)}
              className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
            >
              Clear genre
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre.name;
            return (
              <button
                key={genre.name}
                onClick={() => setSelectedGenre(isSelected ? null : genre.name)}
                className={`${genre.bg} ${genre.text} rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected ? 'ring-2 ring-[#20201E]' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center">
                  {genre.icon}
                </div>
                <span className="text-[11px] font-black tracking-tight truncate w-full text-center">
                  {genre.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section: Music Posts & Collaborations Grid */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#20201E] tracking-tight">
              Music & Collaborations
            </h2>
            <span className="text-xs font-bold text-[#B9B2A9]">
              ({filteredPosts.length})
            </span>
          </div>
          {(searchQuery || activeFilter !== 'All' || selectedGenre) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPosts.map((post) => {
              const creator = artists[post.creatorId] || (currentUser?.id === post.creatorId ? currentUser : {
                displayName: 'Musician',
                username: 'artist',
                avatarUrl: '',
              });
              const mediaItem = post.media[0];
              const isCollab = post.postType === 'collab' || !!post.songId;
              const song = songs.find((s) => s.id === post.songId);

              return (
                <div
                  key={post.id}
                  onClick={() => setPreviewPost(post)}
                  className="relative aspect-4/5 rounded-3xl overflow-hidden bg-neutral-900 shadow-2xs group cursor-pointer border border-black/5"
                >
                  {mediaItem?.type === 'video' ? (
                    <video
                      src={mediaItem.url}
                      poster={mediaItem.thumbnailUrl}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : mediaItem ? (
                    <img
                      src={mediaItem.url}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-white/40">
                      🎵
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Badges: Post Type & Collab Indicator */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                    {isCollab ? (
                      <span className="text-[9px] bg-[#D9F56A] text-[#20201E] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span>🧬</span>
                        <span>Collab</span>
                      </span>
                    ) : (
                      <span className="text-[9px] bg-black/60 backdrop-blur-xs text-white font-bold px-2 py-0.5 rounded-full">
                        Original
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-white text-[10px] font-bold bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      <HeartFilledIcon size={12} color="#FF2D8B" />
                      <span>{formatStatCount(post.likesCount)}</span>
                    </div>
                  </div>

                  {/* Bottom Creator & Caption Info */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Avatar
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        size="xs"
                      />
                      <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                        {creator.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 font-medium line-clamp-2 leading-tight">
                      {post.caption}
                    </p>
                    {song && (
                      <p className="text-[9px] text-[#D9F56A] font-bold truncate mt-0.5">
                        🎵 {song.title}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No musical posts found"
            description="Try clearing your search terms or filters to discover more tracks and creators."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        )}
      </section>

      {/* Post Quick Preview & Collaboration Modal */}
      {previewPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewPost(null);
          }}
        >
          {(() => {
            const creator = artists[previewPost.creatorId] || (currentUser?.id === previewPost.creatorId ? currentUser : {
              displayName: 'Musician',
              username: 'artist',
              avatarUrl: '',
            });
            const song = songs.find((s) => s.id === previewPost.songId);
            const postVer = songVersions.find((v) => v.id === previewPost.versionId);
            const mediaItem = previewPost.media[0];

            return (
              <div className="bg-[#1C1C1E] text-white w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{creator.displayName}</span>
                        <span className="text-[11px] text-white/50">@{creator.username}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{previewPost.createdAt}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewPost(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Media Preview Box */}
                <div className="relative aspect-4/5 bg-black flex items-center justify-center overflow-hidden">
                  {mediaItem?.type === 'video' ? (
                    <video
                      src={mediaItem.url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : mediaItem ? (
                    <img
                      src={mediaItem.url}
                      alt={previewPost.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white/40">No media available</div>
                  )}
                </div>

                {/* Details & Actions */}
                <div className="p-4 space-y-3 shrink-0 bg-[#141416]">
                  <div>
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      {previewPost.caption}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {previewPost.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-[#D9F56A]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Song DNA or Actions Bar */}
                  {song && (
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white">
                          <SongDnaWaveIcon size={14} color="#FFFFFF" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{song.title}</p>
                          <p className="text-[10px] text-white/60">
                            v{(postVer?.versionNumber ?? 1.0).toFixed(1)} · {song.totalLineageAdditions} stems
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenWorkspace && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPost(null);
                              onOpenWorkspace(song, postVer);
                            }}
                            className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D9F56A] text-[#20201E] hover:bg-[#C9E758] transition-colors cursor-pointer"
                          >
                            Play Together
                          </button>
                        )}
                        {onAddPart && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPost(null);
                              onAddPart(song, postVer);
                            }}
                            className="px-2.5 py-1 rounded-full text-xs font-black bg-[#FF5A36] text-white hover:bg-[#F04D29] transition-colors cursor-pointer"
                          >
                            Add Part
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPost(null);
                        onSelectArtist && onSelectArtist(creator.username);
                      }}
                      className="text-xs font-bold text-white/70 hover:text-white cursor-pointer"
                    >
                      Visit {creator.displayName}'s Stage ↗
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPost(null)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
