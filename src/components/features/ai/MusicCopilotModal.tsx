/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MusicalInstrument, MusicGenre } from '../../../types/models';
import { AICopilotRequest, AICopilotResponse } from '../../../types/ai';
import { fetchMusicCopilot } from '../../../services/aiService';
import { SparklesIcon } from '../../common/SonoraIcons';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';

interface MusicCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInstrument?: MusicalInstrument;
  initialGenre?: MusicGenre;
  songTitle?: string;
  existingParts?: Array<{ instrument: string; creatorName?: string; note?: string }>;
  contextTitle?: string;
  onApplySuggestions?: (result: {
    title?: string;
    caption?: string;
    tags?: string[];
    instrument?: MusicalInstrument;
    notes?: string;
  }) => void;
}

const INSTRUMENT_OPTIONS: MusicalInstrument[] = [
  'Guitar',
  'Vocals',
  'Bass',
  'Drums',
  'Keyboard',
  'Synth',
  'Saxophone',
  'Violin',
  'Beats',
];

const GENRE_OPTIONS: MusicGenre[] = [
  'Indie',
  'R&B',
  'Hip-Hop',
  'Rock',
  'Electronic',
  'Soul',
  'Jazz',
  'Acoustic',
  'Folk',
  'Lo-Fi',
];

const MOOD_OPTIONS = ['Soulful', 'Intimate', 'High Energy', 'Dreamy', 'Melancholic', 'Groovy', 'Cinematic'];
const KEY_OPTIONS = ['A Minor', 'C Major', 'D Minor', 'G Major', 'E Minor', 'F Major', 'B Minor'];

export const MusicCopilotModal: React.FC<MusicCopilotModalProps> = ({
  isOpen,
  onClose,
  initialInstrument = 'Guitar',
  initialGenre = 'Indie',
  songTitle,
  existingParts = [],
  contextTitle = 'AI Music Copilot',
  onApplySuggestions,
}) => {
  const [helpType, setHelpType] = useState<AICopilotRequest['helpType']>(
    existingParts.length > 0 ? 'what_to_play_next' : 'spark_idea'
  );
  const [selectedInstrument, setSelectedInstrument] = useState<MusicalInstrument>(initialInstrument);
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre>(initialGenre);
  const [selectedMood, setSelectedMood] = useState<string>('Soulful');
  const [selectedKey, setSelectedKey] = useState<string>('A Minor');
  const [tempoInput, setTempoInput] = useState<string>('96 BPM');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AICopilotResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialInstrument) setSelectedInstrument(initialInstrument);
    if (initialGenre) setSelectedGenre(initialGenre);
    if (existingParts.length > 0) {
      setHelpType('what_to_play_next');
    }
  }, [initialInstrument, initialGenre, existingParts.length]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    const payload: AICopilotRequest = {
      helpType,
      prompt: customPrompt.trim(),
      instrument: selectedInstrument,
      genre: selectedGenre,
      mood: selectedMood,
      keySignature: selectedKey,
      tempo: tempoInput,
      songTitle,
      existingParts,
    };

    const response = await fetchMusicCopilot(payload);
    setResult(response);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] via-[#FF2D8B] to-[#D9F56A] flex items-center justify-center shadow-lg p-0.5">
              <div className="w-full h-full bg-[#1C1C1E] rounded-[14px] flex items-center justify-center">
                <SparklesIcon size={20} color="#FF5A36" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D9F56A]">
                  Sonora AI Music Copilot
                </span>
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                  Powered by Gemini 3.8 Flash
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">{contextTitle}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Existing Parts Context Banner (if inside a collaboration) */}
        {existingParts.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 my-3">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Current Session Stems</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
              <span className="text-white/80">{existingParts.length} layers active</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {existingParts.map((part, i) => (
                <span
                  key={i}
                  className="text-xs bg-[#2C2C2E] px-2.5 py-1 rounded-xl text-white font-medium border border-white/5 flex items-center gap-1.5"
                >
                  <span className="text-[#FF5A36] font-bold">L{i + 1}</span>
                  <span>{part.instrument}</span>
                  {part.creatorName && <span className="text-white/40">(@{part.creatorName})</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Help Type Tabs */}
        <div className="my-3">
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-2">
            What do you want help with?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'spark_idea', label: '💡 Spark Idea', desc: 'Theme & starting chords' },
              { id: 'what_to_play_next', label: '🧩 What to Contribute', desc: 'Complementary stem role' },
              { id: 'chords_and_melody', label: '🎼 Chords & Scale', desc: 'Theory & voicings' },
              { id: 'arrangement_mix', label: '🎛️ Arrangement & Tone', desc: 'Frequency space & mix' },
              { id: 'caption_and_tags', label: '✍️ Caption & Tags', desc: 'Post copy & hashtags' },
            ].map((tab) => {
              const active = helpType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHelpType(tab.id as any)}
                  className={`text-left p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-tr from-[#FF5A36]/20 to-[#FF2D8B]/20 border-[#FF5A36] text-white shadow-xs'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{tab.label}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">{tab.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
          {/* Instrument */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">Your Instrument / Role</label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value as MusicalInstrument)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
            >
              {INSTRUMENT_OPTIONS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Genre */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value as MusicGenre)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
            >
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Key Signature */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">Key / Root</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
            >
              {KEY_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">Vibe & Mood</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
            >
              {MOOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom prompt input */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-white/60 block mb-1">
            Specific instructions or creative question (optional)
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. 'I want a counter-melody for chorus' or 'Looking for a funky bass groove'"
            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5A36]"
          />
        </div>

        {/* Generate Button */}
        <div className="shrink-0 mb-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
              isLoading
                ? 'bg-[#FF5A36]/50 text-white cursor-wait'
                : 'bg-gradient-to-r from-[#FF5A36] via-[#FF2D8B] to-[#FF5A36] text-white hover:brightness-110 active:scale-[0.99]'
            }`}
          >
            <SparklesIcon size={18} color="#FFFFFF" />
            <span>{isLoading ? 'Generating Musical Insights...' : 'Ask AI Copilot'}</span>
          </button>
        </div>

        {/* AI Results Presentation */}
        {result && (
          <div className="bg-[#141416] rounded-2xl p-4 border border-[#FF5A36]/30 animate-in fade-in duration-300 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D9F56A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D9F56A] animate-pulse" />
                Copilot Producer Output
              </span>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => {
                    onApplySuggestions({
                      title: result.title,
                      caption: result.caption,
                      tags: result.tags,
                      instrument: (result.suggestedInstrument as any) || selectedInstrument,
                      notes: result.chordProgression || result.rhythmGrooveTip,
                    });
                    onClose();
                  }}
                  className="px-3 py-1 rounded-xl bg-[#D9F56A] text-[#1C1C1E] text-xs font-black hover:bg-white transition-all cursor-pointer shadow-xs"
                >
                  ✓ Apply to Post
                </button>
              )}
            </div>

            {/* Holistic Summary */}
            {result.fullSummary && (
              <div className="p-3 bg-white/5 rounded-xl text-xs text-white/90 leading-relaxed border-l-2 border-[#FF5A36]">
                {result.fullSummary}
              </div>
            )}

            {/* Chords & Scales */}
            {result.chordProgression && (
              <div className="bg-[#242426] p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white/60">Chord Progression</span>
                  <button
                    onClick={() => copyToClipboard(result.chordProgression!, 'chords')}
                    className="text-[10px] text-[#D9F56A] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'chords' ? 'Copied!' : 'Copy chords'}
                  </button>
                </div>
                <div className="text-sm font-mono font-bold text-[#FF5A36] tracking-wide">
                  {result.chordProgression}
                </div>
                {result.scaleOrKey && (
                  <div className="text-[11px] text-white/60 mt-1 font-mono">
                    Scale: {result.scaleOrKey}
                  </div>
                )}
              </div>
            )}

            {/* Groove / Rhythmic Tip */}
            {result.rhythmGrooveTip && (
              <div className="bg-[#242426] p-3 rounded-xl border border-white/5">
                <span className="text-[11px] font-bold text-white/60 block mb-1">Groove & Pocket</span>
                <p className="text-xs text-white/90 leading-relaxed">{result.rhythmGrooveTip}</p>
              </div>
            )}

            {/* Arrangement & Mix Tip */}
            {result.arrangementTip && (
              <div className="bg-[#242426] p-3 rounded-xl border border-white/5">
                <span className="text-[11px] font-bold text-white/60 block mb-1">Arrangement & Sonic Space</span>
                <p className="text-xs text-white/90 leading-relaxed">{result.arrangementTip}</p>
                {result.mixToneTip && (
                  <p className="text-[11px] text-white/60 mt-1.5 italic">
                    Tone Tip: {result.mixToneTip}
                  </p>
                )}
              </div>
            )}

            {/* Creative Spark */}
            {result.creativeIdea && (
              <div className="bg-gradient-to-r from-[#FF5A36]/10 to-transparent p-3 rounded-xl border border-[#FF5A36]/20">
                <span className="text-[11px] font-bold text-[#FF5A36] block mb-1">Creative Spark</span>
                <p className="text-xs text-white/90 leading-relaxed font-medium">{result.creativeIdea}</p>
              </div>
            )}

            {/* Social Caption & Tags */}
            {result.caption && (
              <div className="bg-[#242426] p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white/60">Suggested Caption</span>
                  <button
                    onClick={() => copyToClipboard(result.caption!, 'caption')}
                    className="text-[10px] text-[#D9F56A] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'caption' ? 'Copied!' : 'Copy caption'}
                  </button>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">{result.caption}</p>
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end shrink-0">
          <SecondaryButton onClick={onClose} size="sm">
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
