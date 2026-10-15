/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Synergy & Compatibility Engine
 * Calculates musical chemistry, instrumentation complementarity,
 * and genre intersection between musicians.
 * 
 * Resolves creator identities safely against real Sonora records.
 */

import { UserProfile, MusicalInstrument, MusicGenre } from '../types/models';
import { MusicianMatchResult } from '../types/ai';

/**
 * Safely resolves an artist by id, username, or display name from the artists dictionary
 */
export function resolveArtist(
  artists: Record<string, UserProfile>,
  idOrHandle: string
): UserProfile | undefined {
  if (!idOrHandle) return undefined;

  // 1. Direct dictionary key match (e.g. 'rhea.vocals', 'bryanthemensah')
  if (artists[idOrHandle]) {
    return artists[idOrHandle];
  }

  const allArtists = Object.values(artists);

  // 2. Match by UserProfile.id (e.g. 'user_rhea')
  const byId = allArtists.find((a) => a.id === idOrHandle);
  if (byId) return byId;

  // 3. Match by UserProfile.username case-insensitive
  const targetLower = idOrHandle.toLowerCase();
  const byUsername = allArtists.find((a) => a.username?.toLowerCase() === targetLower);
  if (byUsername) return byUsername;

  // 4. Match by UserProfile.displayName case-insensitive
  const byDisplayName = allArtists.find((a) => a.displayName?.toLowerCase() === targetLower);
  if (byDisplayName) return byDisplayName;

  return undefined;
}

/**
 * Evaluates whether two instruments form a natural musical pairing
 */
function getInstrumentSynergy(instA: string, instB: string): { score: number; reason: string } {
  const a = instA.toLowerCase();
  const b = instB.toLowerCase();

  // Vocalist + Harmony / Rhythm
  if ((a.includes('vocal') || a.includes('sing')) && (b.includes('guitar') || b.includes('piano') || b.includes('key'))) {
    return { score: 28, reason: 'Topline vocal melody meshes naturally with harmonic acoustic/keyboard comping.' };
  }
  if ((b.includes('vocal') || b.includes('sing')) && (a.includes('guitar') || a.includes('piano') || a.includes('key'))) {
    return { score: 28, reason: 'Warm harmonic chords provide the ideal canvas for lead vocal phrasing.' };
  }

  // Rhythm Section: Bass + Drums/Beats
  if ((a.includes('bass') && (b.includes('beat') || b.includes('drum'))) || (b.includes('bass') && (a.includes('beat') || a.includes('drum')))) {
    return { score: 30, reason: 'Classic rhythm section chemistry: bassline pocket anchors tight drum groove.' };
  }

  // Guitar + Bass
  if ((a.includes('guitar') && b.includes('bass')) || (b.includes('guitar') && a.includes('bass'))) {
    return { score: 24, reason: 'Rhythm guitar riffs lock into deep bass foundations with distinct frequency clearance.' };
  }

  // Beats/Production + Melodic lead
  if ((a.includes('beat') || a.includes('prod')) && (b.includes('guitar') || b.includes('key') || b.includes('sax') || b.includes('violin'))) {
    return { score: 26, reason: 'Modern beat production and sample chops provide a vibrant framework for live melodic stems.' };
  }
  if ((b.includes('beat') || b.includes('prod')) && (a.includes('guitar') || a.includes('key') || a.includes('sax') || a.includes('violin'))) {
    return { score: 26, reason: 'Live instrumental phrasing adds organic character to dynamic beat production.' };
  }

  // Keys + Guitar
  if ((a.includes('key') || a.includes('piano')) && a !== b && (b.includes('guitar') || b.includes('synth'))) {
    return { score: 22, reason: 'Lush chord voicings and melodic counterpoint create deep stereo width.' };
  }

  // Default complimentary multi-instrumentalist pairing
  return { score: 18, reason: 'Complementary multi-instrumental abilities open up versatile collaborative arrangements.' };
}

/**
 * Calculates deterministic compatibility between two creators based on their actual profiles
 */
export function calculateArtistSynergy(
  currentUser: UserProfile,
  partner: UserProfile,
  focusGenre?: string
): MusicianMatchResult {
  const userInst = currentUser.instruments?.[0] || 'Musician';
  const partnerInst = partner.instruments?.[0] || 'Artist';

  const userGenres = currentUser.genres || [];
  const partnerGenres = partner.genres || [];

  // Calculate shared genres
  const sharedGenres = partnerGenres.filter((g) =>
    userGenres.some((ug) => ug.toLowerCase() === g.toLowerCase())
  );

  // Focus genre affinity
  const focusMatches = focusGenre && focusGenre !== 'All'
    ? partnerGenres.some((g) => g.toLowerCase() === focusGenre.toLowerCase())
    : false;

  // Instrument synergy
  const instSynergy = getInstrumentSynergy(userInst, partnerInst);

  // Base score 72 + instrument bonus + genre bonuses
  let score = 72 + instSynergy.score;
  if (sharedGenres.length > 0) score += Math.min(12, sharedGenres.length * 6);
  if (focusMatches) score += 6;
  if (partner.isOpenForCollab) score += 2;

  // Clamp score between 76 and 98
  const finalScore = Math.min(98, Math.max(76, score));

  // Build headline
  const headline = `${userInst} + ${partnerInst} Acoustic Chemistry`;

  // Build complementary reasons
  const complementaryReasons: string[] = [
    instSynergy.reason,
    sharedGenres.length > 0
      ? `Shared musical sensibilities in ${sharedGenres.slice(0, 2).join(' & ')}.`
      : `Creative crossover bridging ${userGenres[0] || 'Indie'} arrangements with ${partnerGenres[0] || 'Soul'} influences.`,
  ];

  if (partner.bio) {
    complementaryReasons.push(
      `Aligned collaborative focus: "${partner.bio.slice(0, 70).trim()}${partner.bio.length > 70 ? '...' : ''}"`
    );
  }

  const primaryGenre = focusMatches && focusGenre ? focusGenre : (sharedGenres[0] || userGenres[0] || 'Indie');
  const recommendedProjectConcept = `Collaborate on a fresh ${primaryGenre} session fusing ${userInst} and ${partnerInst}.`;

  return {
    userId: partner.id,
    synergyScore: finalScore,
    headline,
    complementaryReasons,
    recommendedProjectConcept,
    sharedGenres: sharedGenres.length > 0 ? sharedGenres : [partnerGenres[0] || 'Collab'],
    matchedInstruments: {
      userInstruments: currentUser.instruments || [userInst],
      partnerInstruments: partner.instruments || [partnerInst],
    },
    isAiGenerated: false,
  };
}

/**
 * Calculates and ranks deterministic matches across all community candidates
 */
export function calculateCommunityMatches(
  currentUser: UserProfile,
  candidates: UserProfile[],
  focusGenre?: string
): MusicianMatchResult[] {
  // Exclude current user and deduplicate candidates by id
  const seenIds = new Set<string>([currentUser.id]);
  const validCandidates: UserProfile[] = [];

  for (const c of candidates) {
    if (!c || seenIds.has(c.id) || c.username === currentUser.username) continue;
    seenIds.add(c.id);
    validCandidates.push(c);
  }

  const results = validCandidates.map((candidate) =>
    calculateArtistSynergy(currentUser, candidate, focusGenre)
  );

  // If focusGenre is active, prioritize candidates whose genres contain focusGenre
  if (focusGenre && focusGenre !== 'All') {
    const fLower = focusGenre.toLowerCase();
    results.sort((a, b) => {
      const aHas = a.sharedGenres.some((g) => g.toLowerCase() === fLower);
      const bHas = b.sharedGenres.some((g) => g.toLowerCase() === fLower);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return b.synergyScore - a.synergyScore;
    });
  } else {
    results.sort((a, b) => b.synergyScore - a.synergyScore);
  }

  return results;
}
