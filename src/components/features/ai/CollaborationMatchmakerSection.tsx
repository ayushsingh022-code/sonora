/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, FollowRelationship } from '../../../types/models';
import { MusicianMatchResult, AIMatchmakerRequest, AIMatchmakerResponse } from '../../../types/ai';
import { fetchCollaborationMatchmaker } from '../../../services/aiService';
import { SparklesIcon } from '../../common/SonoraIcons';
import { Avatar } from '../../common/Avatar';
import { isFollowing as checkIsFollowing } from '../../../utils/socialRelationships';
import { resolveArtist, calculateCommunityMatches } from '../../../utils/synergyEngine';

interface CollaborationMatchmakerSectionProps {
  currentUser: UserProfile;
  artists: Record<string, UserProfile>;
  followList?: FollowRelationship[];
  onToggleFollow?: (targetUserId: string) => void;
  onNavigateToStage?: (artistIdOrHandle: string) => void;
  onStartConversation?: (targetUserId: string) => void;
  onRequestJamSession?: (artist: UserProfile) => void;
}

export const CollaborationMatchmakerSection: React.FC<CollaborationMatchmakerSectionProps> = ({
  currentUser,
  artists,
  followList = [],
  onToggleFollow,
  onNavigateToStage,
  onStartConversation,
  onRequestJamSession,
}) => {
  // Real candidate pool: all community creators except current user, deduplicated by id
  const candidateList = useMemo(() => {
    const all = Object.values(artists || {});
    const unique = all.filter((a, idx, arr) => arr.findIndex((x) => x.id === a.id) === idx);
    return unique.filter((a) => a.id !== currentUser.id && a.username !== currentUser.username);
  }, [artists, currentUser.id, currentUser.username]);

  const [matchData, setMatchData] = useState<AIMatchmakerResponse | null>(() => {
    const all = Object.values(artists || {});
    const unique = all.filter((a, idx, arr) => arr.findIndex((x) => x.id === a.id) === idx);
    const initialCandidates = unique.filter((a) => a.id !== currentUser.id && a.username !== currentUser.username);
    if (initialCandidates.length === 0) return null;
    return {
      overallSummary: `Curated ${initialCandidates.length} collaborators based on instrumentation harmony and aesthetic resonance.`,
      matches: calculateCommunityMatches(currentUser, initialCandidates),
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilterGenre, setActiveFilterGenre] = useState<string>('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMatches = async (focusGenre?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const genreParam = focusGenre && focusGenre !== 'All' ? focusGenre : undefined;

      const req: AIMatchmakerRequest = {
        currentUser,
        candidates: candidateList,
        focusGenre: genreParam,
      };

      const res = await fetchCollaborationMatchmaker(req);

      // Verify that the response contains at least one resolvable real creator
      const hasResolvable = res.matches?.some((m) => !!resolveArtist(artists, m.userId));

      if (hasResolvable) {
        setMatchData(res);
      } else {
        // Fallback to deterministic compatibility scoring over the real candidates
        const fallbackMatches = calculateCommunityMatches(currentUser, candidateList, genreParam);
        setMatchData({
          overallSummary: `Curated ${fallbackMatches.length} collaborators based on instrumentation harmony and aesthetic resonance.`,
          matches: fallbackMatches,
        });
      }
    } catch (err: unknown) {
      console.warn('Error loading matchmaker, falling back to deterministic compatibility engine:', err);
      setErrorMessage('Could not connect to Gemini service. Showing Sonora compatibility recommendations.');
      const fallbackMatches = calculateCommunityMatches(
        currentUser,
        candidateList,
        focusGenre && focusGenre !== 'All' ? focusGenre : undefined
      );
      setMatchData({
        overallSummary: `Matched ${fallbackMatches.length} creators by complementary stems and genre chemistry.`,
        matches: fallbackMatches,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [currentUser.id, candidateList.length]);

  // Resolve matches to real creator records, ensuring zero hallucinated profiles and no duplicates
  const displayedMatches = useMemo(() => {
    if (!matchData?.matches) return [];

    const seenIds = new Set<string>([currentUser.id]);
    const valid: Array<{ match: MusicianMatchResult; artist: UserProfile }> = [];

    for (const m of matchData.matches) {
      const artist = resolveArtist(artists, m.userId);
      if (!artist || seenIds.has(artist.id)) continue;
      seenIds.add(artist.id);
      valid.push({ match: m, artist });
    }

    // If Gemini matches did not cover candidates, backfill with deterministic scoring on remaining candidates
    if (valid.length === 0 && candidateList.length > 0) {
      const backfill = calculateCommunityMatches(currentUser, candidateList, activeFilterGenre);
      for (const fm of backfill) {
        const artist = resolveArtist(artists, fm.userId);
        if (artist && !seenIds.has(artist.id)) {
          seenIds.add(artist.id);
          valid.push({ match: fm, artist });
        }
      }
    }

    // Filter by genre if user selected a specific focus genre
    if (activeFilterGenre !== 'All') {
      const targetG = activeFilterGenre.toLowerCase();
      return valid.filter(
        ({ artist, match }) =>
          (artist.genres || []).some((g) => g.toLowerCase() === targetG) ||
          (match.sharedGenres || []).some((g) => g.toLowerCase() === targetG)
      );
    }

    return valid;
  }, [matchData, artists, currentUser.id, candidateList, activeFilterGenre]);

  const uniqueGenres = ['All', 'Indie', 'Soul', 'R&B', 'Rock', 'Jazz', 'Electronic'];

  return (
    <div className="bg-[#1C1C1E] text-white rounded-3xl p-5 border border-white/10 shadow-xl my-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] via-[#FF2D8B] to-[#D9F56A] flex items-center justify-center p-0.5 shadow-md">
            <div className="w-full h-full bg-[#1C1C1E] rounded-[14px] flex items-center justify-center">
              <SparklesIcon size={18} color="#FF5A36" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D9F56A]">
                AI Matchmaker
              </span>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                Gemini 3.8 Flash
              </span>
            </div>
            <h3 className="text-base font-black tracking-tight text-white">
              Complementary Musical Collaborators
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadMatches(activeFilterGenre)}
          disabled={isLoading}
          className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50 flex items-center gap-1.5"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>↻ Recalculate Matches</span>
          )}
        </button>
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider mr-1 shrink-0">
          Genre Focus:
        </span>
        {uniqueGenres.map((g) => {
          const active = activeFilterGenre === g;
          return (
            <button
              key={g}
              onClick={() => {
                setActiveFilterGenre(g);
                loadMatches(g);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#FF5A36] text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Error / Fallback Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-200/70 hover:text-amber-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Background Refreshing Indicator */}
      {isLoading && displayedMatches.length > 0 && (
        <div className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white/70 animate-in fade-in duration-150">
          <div className="w-3.5 h-3.5 border-2 border-[#FF5A36] border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Refreshing compatibility insights with Gemini 3.8 Flash...</span>
        </div>
      )}

      {/* Full Loading State (only if no cards are ready yet) */}
      {isLoading && displayedMatches.length === 0 && (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-[#FF5A36] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-white/70 font-medium">
            Evaluating musical synergies, instruments, and style intersections...
          </p>
          <span className="text-[10px] text-white/40 mt-1">Analyzing community roster against your sound</span>
        </div>
      )}

      {/* Match Cards List */}
      {displayedMatches.length > 0 ? (
        <div className="space-y-3">
          {displayedMatches.map(({ match, artist }) => {
              const isFollowing = checkIsFollowing(followList, currentUser.id, artist.id);

              return (
                <div
                  key={artist.id}
                  className="bg-[#242426] rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all space-y-3"
                >
                  {/* Top Bar: Artist info + Synergy Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                      onClick={() => onNavigateToStage && onNavigateToStage(artist.username || artist.id)}
                    >
                      <Avatar src={artist.avatarUrl} alt={artist.displayName} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white group-hover:text-[#FF5A36] transition-colors truncate">
                            {artist.displayName}
                          </h4>
                          <span className="text-xs text-white/50 truncate">@{artist.username}</span>
                        </div>
                        <p className="text-[11px] text-white/70 line-clamp-1">{artist.bio}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#FF5A36]/20 to-[#FF2D8B]/20 border border-[#FF5A36]/40">
                        <span className="text-xs font-black text-[#D9F56A]">{match.synergyScore}%</span>
                        <span className="text-[10px] font-bold text-white/70 uppercase">Match</span>
                      </div>
                      <span className="text-[9px] text-white/40 mt-0.5">Musical Synergy</span>
                    </div>
                  </div>

                  {/* Headline & Complementary Reasons */}
                  <div className="bg-black/25 rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-bold text-[#FF5A36]">{match.headline}</div>
                      {/* Clearly distinguish Gemini AI from Sonora Affinity Engine */}
                      {match.isAiGenerated !== false ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#D9F56A] bg-[#D9F56A]/10 border border-[#D9F56A]/20 px-2 py-0.5 rounded-full">
                          <SparklesIcon size={10} color="#D9F56A" />
                          <span>Gemini 3.8 Flash</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
                          <span>Sonora Compatibility Engine</span>
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1">
                      {match.complementaryReasons.map((reason, idx) => (
                        <li key={idx} className="text-[11px] text-white/80 flex items-start gap-1.5">
                          <span className="text-[#D9F56A] font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>

                    {match.recommendedProjectConcept && (
                      <div className="pt-1.5 border-t border-white/5 text-[11px] text-[#D9F56A] font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">Project Concept:</span>
                        <span className="text-white/90 font-normal">{match.recommendedProjectConcept}</span>
                      </div>
                    )}
                  </div>

                  {/* Instrument & Genre Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-1 items-center">
                      {(artist.instruments || []).map((inst) => (
                        <span
                          key={inst}
                          className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-white/70 font-medium"
                        >
                          {inst}
                        </span>
                      ))}
                      {(match.sharedGenres || []).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] bg-[#FF5A36]/15 border border-[#FF5A36]/30 px-2 py-0.5 rounded-md text-[#FF5A36] font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {onRequestJamSession && (
                        <button
                          type="button"
                          onClick={() => onRequestJamSession(artist)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xs"
                          title={`Request jam session with ${artist.displayName}`}
                        >
                          Jam Session ⚡
                        </button>
                      )}

                      {onStartConversation && (
                        <button
                          type="button"
                          onClick={() => onStartConversation(artist.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                          title={`Message ${artist.displayName}`}
                        >
                          Message
                        </button>
                      )}

                      {onToggleFollow && (
                        <button
                          type="button"
                          onClick={() => onToggleFollow(artist.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-white/10 text-white/60 hover:text-white'
                              : 'bg-white text-[#1C1C1E] hover:bg-[#D9F56A]'
                          }`}
                          title={isFollowing ? 'Unfollow' : 'Follow'}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}

                      {onNavigateToStage && (
                        <button
                          type="button"
                          onClick={() => onNavigateToStage(artist.username || artist.id)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
                          title="View Stage Profile & Add Friend"
                        >
                          Stage ↗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-8 px-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-sm font-bold text-white/80">No creators found for "{activeFilterGenre}"</p>
            <p className="text-xs text-white/50 mt-1 mb-3">
              Try selecting 'All' genres or recalculating matches to see the full community roster.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilterGenre('All');
                loadMatches('All');
              }}
              className="px-4 py-1.5 rounded-xl bg-[#FF5A36] text-white text-xs font-bold hover:bg-[#F04D29] transition-all cursor-pointer"
            >
              Show All Creators
            </button>
          </div>
        )
      )}
    </div>
  );
};
