/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MusicalInstrument, MusicGenre, UserProfile } from './models';

export interface AICopilotRequest {
  helpType: 'spark_idea' | 'what_to_play_next' | 'chords_and_melody' | 'arrangement_mix' | 'caption_and_tags';
  prompt?: string;
  instrument?: MusicalInstrument | string;
  genre?: MusicGenre | string;
  mood?: string;
  tempo?: number | string;
  keySignature?: string;
  songTitle?: string;
  existingParts?: Array<{ instrument: string; creatorName?: string; note?: string }>;
}

export interface AICopilotResponse {
  title?: string;
  caption?: string;
  tags?: string[];
  suggestedInstrument?: string;
  chordProgression?: string;
  scaleOrKey?: string;
  rhythmGrooveTip?: string;
  arrangementTip?: string;
  mixToneTip?: string;
  creativeIdea?: string;
  fullSummary: string;
}

export interface AISongDNAGuideRequest {
  songId: string;
  songTitle: string;
  originalCreator: string;
  versions: Array<{
    versionNumber: number;
    label: string;
    contributions: Array<{
      instrument: string;
      creatorName: string;
      note?: string;
    }>;
  }>;
}

export interface RecommendedContributionProposal {
  instrument: MusicalInstrument;
  roleTitle: string;
  musicalRationale: string;
  suggestedKeyOrTempo?: string;
  vibe: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface AISongDNAGuideResponse {
  lineageStory: string;
  currentVibe: string;
  sonicBalance: {
    occupiedFrequencies: string[];
    missingFrequencies: string[];
    analysis: string;
  };
  recommendedContributions: RecommendedContributionProposal[];
}

export interface AIMatchmakerRequest {
  currentUser: UserProfile;
  candidates: UserProfile[];
  targetUserId?: string;
  focusGenre?: string;
}

export interface MusicianMatchResult {
  userId: string;
  synergyScore: number; // 0 - 100
  headline: string;
  complementaryReasons: string[];
  recommendedProjectConcept: string;
  sharedGenres: string[];
  matchedInstruments: {
    userInstruments: string[];
    partnerInstruments: string[];
  };
  isAiGenerated?: boolean;
}

export interface AIMatchmakerResponse {
  matches: MusicianMatchResult[];
  overallSummary?: string;
}
