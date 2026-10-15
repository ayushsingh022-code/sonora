/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AICopilotRequest,
  AICopilotResponse,
  AISongDNAGuideRequest,
  AISongDNAGuideResponse,
  AIMatchmakerRequest,
  AIMatchmakerResponse,
} from '../types/ai';

/**
 * Fetch AI Music Copilot guidance from the backend server
 */
export async function fetchMusicCopilot(request: AICopilotRequest): Promise<AICopilotResponse> {
  try {
    const res = await fetch('/api/ai/copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Copilot request failed: ${res.statusText}`);
    }

    const data: AICopilotResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Network error calling /api/ai/copilot, falling back to local producer engine:', error);
    return getLocalCopilotFallback(request);
  }
}

/**
 * Fetch AI Song DNA Lineage Guide and Next Contribution proposals
 */
export async function fetchSongDNAGuide(request: AISongDNAGuideRequest): Promise<AISongDNAGuideResponse> {
  try {
    const res = await fetch('/api/ai/dna-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`DNA Guide request failed: ${res.statusText}`);
    }

    const data: AISongDNAGuideResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Network error calling /api/ai/dna-guide, falling back to local DNA engine:', error);
    return getLocalDnaGuideFallback(request);
  }
}

/**
 * Fetch AI Collaboration Matchmaker results
 */
export async function fetchCollaborationMatchmaker(request: AIMatchmakerRequest): Promise<AIMatchmakerResponse> {
  try {
    const res = await fetch('/api/ai/matchmaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Matchmaker request failed: ${res.statusText}`);
    }

    const data: AIMatchmakerResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Network error calling /api/ai/matchmaker, falling back to local matchmaking engine:', error);
    return getLocalMatchmakerFallback(request);
  }
}

// Client-side graceful fallback helpers to prevent UI blockages
function getLocalCopilotFallback(request: AICopilotRequest): AICopilotResponse {
  const inst = request.instrument || 'Guitar';
  const genre = request.genre || 'Indie';
  const mood = request.mood || 'Vibrant';
  const key = request.keySignature || 'A Minor';

  return {
    title: `${mood} ${genre} Session`,
    caption: `Recorded a new ${inst} take in ${key}! Exploring warm dynamics. What musical layer would you add next? Drop your part in Sonora! 🎶🔥 #SonoraMusic #${genre.toLowerCase()}`,
    tags: [genre.toLowerCase(), inst.toLowerCase(), 'collaboration', 'sonora'],
    suggestedInstrument: inst === 'Guitar' ? 'Bass' : inst === 'Vocals' ? 'Guitar' : 'Beats',
    chordProgression: 'Am7 - Em7 - Fmaj7 - G (i - v - VI - VII)',
    scaleOrKey: `${key} Pentatonic & Dorian Mode`,
    rhythmGrooveTip: `Emphasize the syncopated off-beats on the 2nd and 4th beats to leave sonic room for vocal harmonies.`,
    arrangementTip: `Keep the midrange transparent and avoid competing with lead melodies.`,
    mixToneTip: `Roll off low rumble below 80Hz and add a slight air boost at 12kHz.`,
    creativeIdea: `Layer an octave vocal hook or a warm nylon string melody in the second half.`,
    fullSummary: `Solid ${genre} take. Great pocket and clear harmonic direction for subsequent collaborative additions.`,
  };
}

function getLocalDnaGuideFallback(request: AISongDNAGuideRequest): AISongDNAGuideResponse {
  const count = request.versions?.length || 1;
  return {
    lineageStory: `Started by @${request.originalCreator} as a creative spark, "${request.songTitle}" has developed over ${count} iteration${count > 1 ? 's' : ''}. Each contributor added an organic layer, turning an initial seed into an expansive collaborative tapestry.`,
    currentVibe: 'Organic Soul-Acoustic Fusion',
    sonicBalance: {
      occupiedFrequencies: ['Low-Mids (Rhythm Acoustic)', 'Upper-Mids (Lead Vocals)'],
      missingFrequencies: ['Sub-Bass Foundation (40-90Hz)', 'Percussive Pocket / Groovy Shaker'],
      analysis: 'The melodic center is well-defined, but adding low-end weight or percussion will unlock fuller sonic dimension.',
    },
    recommendedContributions: [
      {
        instrument: 'Bass',
        roleTitle: 'Warm Motown Walking Bass',
        musicalRationale: 'Anchors the root chords while giving the acoustic strumming a bouncy foundation.',
        suggestedKeyOrTempo: 'Root notes with subtle chromatic slides',
        vibe: 'Vintage P-Bass warmth with soft thumb picking',
        complexity: 'Intermediate',
      },
      {
        instrument: 'Beats',
        roleTitle: 'Lo-Fi Brush Pocket',
        musicalRationale: 'Binds the tracks with steady rhythm without stepping over vocal dynamics.',
        suggestedKeyOrTempo: 'Laid-back swing tempo',
        vibe: 'Warm analog snare with subtle vinyl crackle',
        complexity: 'Beginner',
      },
      {
        instrument: 'Keyboard',
        roleTitle: 'Atmospheric Rhodes Pad',
        musicalRationale: 'Wide stereo harmonic bed filling the transition spaces between phrases.',
        suggestedKeyOrTempo: 'Minor 7th & 9th extensions',
        vibe: 'Gentle stereo panning with lush chorus',
        complexity: 'Intermediate',
      },
    ],
  };
}

import { calculateCommunityMatches } from '../utils/synergyEngine';

function getLocalMatchmakerFallback(request: AIMatchmakerRequest): AIMatchmakerResponse {
  const user = request.currentUser;
  const candidates = request.candidates.filter((c) => c.id !== user.id);
  const matches = calculateCommunityMatches(user, candidates, request.focusGenre);

  return {
    overallSummary: `Identified ${matches.length} creators with complementary instrumentation and aligned sonic aesthetics.`,
    matches,
  };
}
