/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type {
  AICopilotRequest,
  AICopilotResponse,
  AISongDNAGuideRequest,
  AISongDNAGuideResponse,
  AIMatchmakerRequest,
  AIMatchmakerResponse,
} from './src/types/ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client utility
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // 1. AI Music Copilot Endpoint
  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const payload: AICopilotRequest = req.body;
      const {
        helpType,
        prompt = '',
        instrument = 'Guitar',
        genre = 'Indie',
        mood = 'Atmospheric',
        tempo = '100 BPM',
        keySignature = 'A Minor',
        songTitle,
        existingParts = [],
      } = payload;

      if (!ai) {
        // Fallback intelligent music generation if key not configured
        const fallback = generateCopilotFallback(payload);
        return res.json(fallback);
      }

      const existingPartsText = existingParts.length > 0
        ? existingParts.map((p, idx) => `Layer ${idx + 1}: ${p.instrument} (by ${p.creatorName || 'Artist'}${p.note ? ' - ' + p.note : ''})`).join('\n')
        : 'None yet (Solo track creation)';

      const systemPrompt = `You are the Sonora AI Music Copilot, an expert multi-instrumentalist producer, audio arranger, and songwriting mentor.
Your goal is to provide concise, actionable, creatively inspiring, and theory-grounded suggestions for independent musicians recording video stems and collaborative parts.
Sonora is a music-first social app where musicians collaborate asynchronously.

Always respond in valid JSON matching this schema:
{
  "title": "A short, memorable track title suggestion",
  "caption": "An engaging, authentic creator caption for Sonora circle feed with relevant emojis and hashtags",
  "tags": ["genre", "instrument", "mood", "sonora"],
  "suggestedInstrument": "Recommended instrument or role for next part",
  "chordProgression": "Specific chord progression with Roman numerals and actual chord names (e.g. Am7 - Fmaj7 - C - G)",
  "scaleOrKey": "Key/Scale advice and best scale to solo or harmonize with",
  "rhythmGrooveTip": "Specific rhythmic advice, pocket, strumming or beat feel",
  "arrangementTip": "Arrangement instruction on how to fit in the mix without clashing with existing layers",
  "mixToneTip": "Sonic/frequency suggestion (EQ, reverb, amp tone, compression)",
  "creativeIdea": "One unconventional creative spark to make this take stand out",
  "fullSummary": "2-3 sentence holistic encouraging producer summary"
}`;

      const userPrompt = `Request Type: ${helpType}
User Prompt: ${prompt || 'Help me arrange and add a new musical element'}
Context:
- Song Title: ${songTitle || 'Untitled Session'}
- Primary Instrument: ${instrument}
- Genre: ${genre}
- Mood/Vibe: ${mood}
- Key Signature: ${keySignature}
- Tempo: ${tempo}
- Existing Layers in Project:
${existingPartsText}

Generate high-quality, practical musical guidance for this take in strict JSON format.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text) as AICopilotResponse;
        parsed.isAiGenerated = true;
        return res.json(parsed);
      } catch (e) {
        return res.json({
          fullSummary: text,
          creativeIdea: 'Layer an acoustic counter-melody with subtle syncopation.',
          chordProgression: 'Am - F - C - G',
          scaleOrKey: keySignature,
          tags: ['sonora', String(genre).toLowerCase(), String(instrument).toLowerCase()],
          isAiGenerated: true,
        });
      }
    } catch (err: any) {
      console.warn('Gemini Copilot API error, serving fallback:', err?.message || err);
      return res.json(generateCopilotFallback(req.body));
    }
  });

  // 2. AI Song DNA Guide Endpoint
  app.post('/api/ai/dna-guide', async (req, res) => {
    try {
      const payload: AISongDNAGuideRequest = req.body;
      const { songTitle, originalCreator, versions = [] } = payload;

      if (!ai) {
        return res.json(generateDnaGuideFallback(payload));
      }

      const versionBreakdown = versions.map((v) => {
        const parts = v.contributions.map((c) => `${c.instrument} by ${c.creatorName}${c.note ? ` (${c.note})` : ''}`).join(', ');
        return `Version ${v.versionNumber} (${v.label}): [${parts || 'Original Stem'}]`;
      }).join('\n');

      const systemPrompt = `You are the Sonora AI Song DNA Guide. You specialize in musical genealogy, sonic spectrum analysis, and arrangement engineering for collaborative multi-track songs.
Analyze the song's evolutionary lineage across versions, evaluate the frequency spectrum balance (what low, mid, and high frequencies are occupied vs missing), and propose 3 distinct, highly complementary musical contributions that collaborators can record.

Always respond in valid JSON matching this schema:
{
  "lineageStory": "A vivid 2-3 sentence narrative describing the creative journey from the root spark to the current version",
  "currentVibe": "A 3-5 word aesthetic description (e.g. 'Warm Nostalgic Neo-Soul with Lofi Percussion')",
  "sonicBalance": {
    "occupiedFrequencies": ["Low Mids (Acoustic Guitar)", "High Mids (Lead Vocals)"],
    "missingFrequencies": ["Sub/Low End (Bassline)", "Air / High Sparkle (Shaker/Chimes)"],
    "analysis": "Short 2 sentence breakdown of how balanced the current sonic spectrum is."
  },
  "recommendedContributions": [
    {
      "instrument": "Bass",
      "roleTitle": "Warm Motown Bassline",
      "musicalRationale": "Locks in with the kick while leaving room for the vocal phrasing in the mid-range.",
      "suggestedKeyOrTempo": "D Minor, 92 BPM",
      "vibe": "P-Bass with flatwound strings and palm muting",
      "complexity": "Intermediate"
    },
    {
      "instrument": "Beats",
      "roleTitle": "Laidback Hip-Hop Groove",
      "musicalRationale": "Adds steady pocket and groove without overtaking the delicate acoustic guitar.",
      "suggestedKeyOrTempo": "92 BPM Swing",
      "vibe": "Brushed snare and soft vinyl crackle",
      "complexity": "Beginner"
    },
    {
      "instrument": "Keyboard",
      "roleTitle": "Neo-Soul Rhodes Pad",
      "musicalRationale": "Provides lush harmonic bed and gentle tension-release between verse chords.",
      "suggestedKeyOrTempo": "D Minor 9, G13 chords",
      "vibe": "Tremolo Rhodes with stereo chorus",
      "complexity": "Advanced"
    }
  ]
}`;

      const userPrompt = `Song Title: ${songTitle}
Original Spark Creator: ${originalCreator}
Lineage & Version History:
${versionBreakdown}

Perform a deep musical analysis of this Song DNA and suggest the next three ideal contributions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text) as AISongDNAGuideResponse;
        parsed.isAiGenerated = true;
        return res.json(parsed);
      } catch (e) {
        return res.json(generateDnaGuideFallback(payload));
      }
    } catch (err: any) {
      console.warn('Gemini DNA Guide error, serving fallback:', err?.message || err);
      return res.json(generateDnaGuideFallback(req.body));
    }
  });

  // 3. AI Collaboration Matchmaker Endpoint
  app.post('/api/ai/matchmaker', async (req, res) => {
    try {
      const payload: AIMatchmakerRequest = req.body;
      const { currentUser, candidates = [], targetUserId, focusGenre } = payload;

      if (!ai) {
        return res.json(generateMatchmakerFallback(payload));
      }

      // If evaluating a single target artist or the whole community
      const candidateList = targetUserId
        ? candidates.filter((c) => c.id === targetUserId)
        : candidates.filter((c) => c.id !== currentUser.id);

      const candidateSummary = candidateList.map((c) => ({
        id: c.id,
        name: c.displayName,
        username: c.username,
        instruments: c.instruments || [],
        genres: c.genres || [],
        bio: c.bio || '',
      }));

      const systemPrompt = `You are the Sonora AI Collaboration Matchmaker, an elite music producer and A&R talent scout.
You calculate musical chemistry and synergy between musicians based on:
1. Complementary instrumentation (e.g. Vocalist + Guitarist/Producer; Bassist + Drummer; Saxophonist + Pianist)
2. Genre intersection & stylistic crossover (e.g. R&B + Neo-Soul + Lo-fi)
3. Creative balance and potential for innovative collaborative songs.

CRITICAL INSTRUCTION: The "userId" in each returned match MUST match the exact "id" string from the Candidates to Match With list (e.g. "user_rhea", "user_arjun"). Do NOT invent IDs.

Always return a JSON response with:
{
  "overallSummary": "Brief overview of the matching vibe for the user",
  "matches": [
    {
      "userId": "exact candidate id from list",
      "synergyScore": 94,
      "headline": "Perfect Harmonic & Rhythm Match",
      "complementaryReasons": [
        "Your acoustic rhythm guitar complements their vocal range seamlessly",
        "Both artists share deep roots in Indie and Soul"
      ],
      "recommendedProjectConcept": "Record an intimate acoustic rework with two-part vocal harmonies",
      "sharedGenres": ["Indie", "R&B"],
      "matchedInstruments": {
        "userInstruments": ["Guitar"],
        "partnerInstruments": ["Vocals"]
      }
    }
  ]
}`;

      const userPrompt = `Current Musician:
- Name: ${currentUser.displayName} (@${currentUser.username})
- Primary Instruments: ${(currentUser.instruments || []).join(', ') || 'Multi-instrumentalist'}
- Primary Genres: ${(currentUser.genres || []).join(', ') || 'Eclectic'}
- Bio: ${currentUser.bio || 'Passionate creator on Sonora'}
${focusGenre && focusGenre !== 'All' ? `- Focus Genre: Prioritize creators whose sound bridges with ${focusGenre}` : ''}

Candidates to Match With:
${JSON.stringify(candidateSummary, null, 2)}

Analyze musical synergy and return ranked matches for each candidate.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text) as AIMatchmakerResponse;
        if (parsed.matches && Array.isArray(parsed.matches)) {
          parsed.matches = parsed.matches.map((m) => ({ ...m, isAiGenerated: true }));
        }
        return res.json(parsed);
      } catch (e) {
        return res.json(generateMatchmakerFallback(payload));
      }
    } catch (err: any) {
      console.warn('Gemini Matchmaker error, serving fallback:', err?.message || err);
      return res.json(generateMatchmakerFallback(req.body));
    }
  });

  // In-memory + persistent set for saved reels by user
  const savedPlaylistsByUser: Record<string, string[]> = {
    user_current: ['post_demo_split_screen'],
    user_bryanthemensah: ['post_rhea_1'],
  };

  // 4. Saved Playlist Endpoints
  app.get('/api/saved-playlist', (req, res) => {
    const userId = (req.query.userId as string) || 'user_current';
    const saved = savedPlaylistsByUser[userId] || [];
    return res.json({ success: true, userId, savedPostIds: saved });
  });

  app.post('/api/saved-playlist/toggle', (req, res) => {
    const { userId = 'user_current', postId } = req.body;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'postId is required' });
    }
    if (!savedPlaylistsByUser[userId]) {
      savedPlaylistsByUser[userId] = [];
    }
    const list = savedPlaylistsByUser[userId];
    const index = list.indexOf(postId);
    let isSaved = false;
    if (index >= 0) {
      list.splice(index, 1);
      isSaved = false;
    } else {
      list.unshift(postId);
      isSaved = true;
    }
    return res.json({
      success: true,
      isSaved,
      postId,
      savedPostIds: list,
      message: isSaved ? 'Saved to playlist' : 'Removed from playlist',
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!apiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // In development, hook into Vite middlewares
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sonora Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

// Fallback generators that ensure rich musical UI even if Gemini key is not configured locally
function generateCopilotFallback(payload: AICopilotRequest): AICopilotResponse {
  const instrument = payload.instrument || 'Guitar';
  const genre = payload.genre || 'Indie';
  const key = payload.keySignature || 'D Minor';
  const tempo = payload.tempo || '105 BPM';

  const chords = key.includes('Major')
    ? 'I - V - vi - IV (e.g. C - G - Am - F)'
    : 'i - VI - III - VII (e.g. Dm - Bb - F - C)';

  return {
    title: `${genre} Midnight Groove`,
    caption: `Late-night ${instrument} session in ${key}. Looking for someone to drop a complementary beat or warm vocal hook! 🎶✨ #SonoraCollab #${genre.toLowerCase()}`,
    tags: [genre.toLowerCase(), instrument.toLowerCase(), 'sonoracollab', 'jam'],
    suggestedInstrument: instrument === 'Guitar' ? 'Bass' : instrument === 'Vocals' ? 'Guitar' : 'Keys',
    chordProgression: chords,
    scaleOrKey: `${key} Pentatonic & Dorian Mode for soulful melodic riffs`,
    rhythmGrooveTip: `Lock into the backbeat on counts 2 and 4 at ${tempo}. Leave space between phrases for collaborators.`,
    arrangementTip: `Keep the low-mids clean so the master track stays open for a punchy kick and warm bassline.`,
    mixToneTip: `Use subtle analog tape saturation and a warm plate reverb with 1.8s decay.`,
    creativeIdea: `Try playing an octave higher during the chorus to create an uplifting counter-melody.`,
    fullSummary: `A rich ${genre} progression in ${key}. The track has strong rhythmic foundation and plenty of frequency space for a warm second layer!`,
    isAiGenerated: false,
  };
}

function generateDnaGuideFallback(payload: AISongDNAGuideRequest): AISongDNAGuideResponse {
  const versionsCount = payload.versions?.length || 1;
  return {
    lineageStory: `This song began as an original acoustic spark by ${payload.originalCreator || 'the creator'}. Over ${versionsCount} version${versionsCount > 1 ? 's' : ''}, collaborators layered intricate harmonies and rhythmic pockets, transforming a raw musical sketch into an expansive sonic piece.`,
    currentVibe: 'Warm Organic Acoustic-Soul with Intimate Resonance',
    sonicBalance: {
      occupiedFrequencies: ['Low-Mids (Guitar Body)', 'High-Mids (Lead Vocals)'],
      missingFrequencies: ['Sub-Bass (40-80 Hz Foundation)', 'Transient Percussion / Shaker Groove'],
      analysis: 'The middle frequencies are vibrant and expressive, but the arrangement currently lacks grounding low-end bass and dynamic high-frequency percussion.',
    },
    recommendedContributions: [
      {
        instrument: 'Bass',
        roleTitle: 'Warm Motown Walking Bass',
        musicalRationale: 'Fills the missing low frequencies without cluttering the vocal melody.',
        suggestedKeyOrTempo: 'Root notes with chromatic passing tones',
        vibe: 'Flatwound strings with vintage tube warmth',
        complexity: 'Intermediate',
      },
      {
        instrument: 'Beats',
        roleTitle: 'Subtle Neo-Soul Brush Groove',
        musicalRationale: 'Locks the timing together while preserving the intimate acoustic dynamic.',
        suggestedKeyOrTempo: 'Swing 16ths, 96 BPM',
        vibe: 'Brushed snare and muted hi-hat',
        complexity: 'Beginner',
      },
      {
        instrument: 'Keyboard',
        roleTitle: 'Atmospheric Rhodes Swells',
        musicalRationale: 'Adds stereo width and harmonic richness behind the guitar chords.',
        suggestedKeyOrTempo: 'Minor 7th & 9th inversions',
        vibe: 'Gentle stereo panning with vibrato',
        complexity: 'Intermediate',
      },
    ],
    isAiGenerated: false,
  };
}

function generateMatchmakerFallback(payload: AIMatchmakerRequest): AIMatchmakerResponse {
  const currentUser = payload.currentUser;
  const candidates = payload.candidates.filter((c) => c.id !== currentUser.id);

  const matches = candidates.slice(0, 5).map((candidate, idx) => {
    const userInst = currentUser.instruments?.[0] || 'Musician';
    const candInst = candidate.instruments?.[0] || 'Artist';
    const score = Math.max(78, 98 - idx * 4);

    return {
      userId: candidate.id,
      synergyScore: score,
      headline: `Exceptional ${userInst} + ${candInst} Synergy`,
      complementaryReasons: [
        `Their mastery of ${candInst} naturally interlocks with your ${userInst} arrangements.`,
        `Shared musical sensibilities in ${(candidate.genres || ['Indie', 'Soul']).slice(0, 2).join(' & ')}.`,
      ],
      recommendedProjectConcept: `Create a vibrant duet blending ${currentUser.genres?.[0] || 'Indie'} chords with ${candInst} flourishes.`,
      sharedGenres: (candidate.genres || []).filter((g) => (currentUser.genres || []).includes(g)).concat(['Collab']),
      matchedInstruments: {
        userInstruments: currentUser.instruments || [userInst],
        partnerInstruments: candidate.instruments || [candInst],
      },
      isAiGenerated: false,
    };
  });

  return {
    overallSummary: `Found ${matches.length} creators with complementary instrumentation and aligned sonic aesthetics.`,
    matches,
  };
}

startServer().catch((err) => {
  console.error('Failed to start Sonora server:', err);
  process.exit(1);
});
