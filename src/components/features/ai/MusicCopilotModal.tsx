/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — MusicCopilotModal
 * Icon-led, compact, and actionable AI Copilot.
 * Uses real Gemini-backed /api/ai/copilot service with short labels, clear actions,
 * and concise suggestions with an expand option.
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
  'Soul',
  'Lo-Fi',
  'Jazz',
  'Acoustic',
];

export const MusicCopilotModal: React.FC<MusicCopilotModalProps> = ({
  isOpen,
  onClose,
  initialInstrument = 'Guitar',
  initialGenre = 'Indie',
  songTitle,
  existingParts = [],
  contextTitle = 'AI Copilot',
  onApplySuggestions,
}) => {
  const [helpType, setHelpType] = useState<AICopilotRequest['helpType']>(
    existingParts.length > 0 ? 'what_to_play_next' : 'spark_idea'
  );
  const [selectedInstrument, setSelectedInstrument] = useState<MusicalInstrument>(initialInstrument);
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre>(initialGenre);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AICopilotResponse | null>(null);
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialInstrument) setSelectedInstrument(initialInstrument);
    if (initialGenre) setSelectedGenre(initialGenre);
    if (existingParts.length > 0) setHelpType('what_to_play_next');
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
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-lg rounded-3xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl flex flex-col space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center shadow-xs">
              <SparklesIcon size={16} color="#FFFFFF" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D9F56A]">
                  AI Copilot
                </span>
                <span className="text-[9px] bg-white/10 px-2 py-0.2 rounded-full text-white/70">
                  {result ? (result.isAiGenerated !== false ? 'Gemini 3.8 Flash' : 'Sonora Producer Engine') : 'Gemini'}
                </span>
              </div>
              <h3 className="text-sm font-black tracking-tight">{contextTitle}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Existing Parts (if any) */}
        {existingParts.length > 0 && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl text-xs overflow-x-auto">
            <span className="text-[10px] text-white/50 font-bold uppercase shrink-0">Active Layers:</span>
            {existingParts.map((p, idx) => (
              <span key={idx} className="bg-white/10 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                {p.instrument} {p.creatorName && `(@${p.creatorName})`}
              </span>
            ))}
          </div>
        )}

        {/* Icon-led Goal Selector */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1.5">
            Goal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'spark_idea', icon: '💡', label: 'Idea' },
              { id: 'what_to_play_next', icon: '🧩', label: 'Part' },
              { id: 'chords_and_melody', icon: '🎼', label: 'Chords' },
              { id: 'caption_and_tags', icon: '✍️', label: 'Caption' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHelpType(tab.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  helpType === tab.id
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Instrument & Genre Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
              Instrument
            </label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value as MusicalInstrument)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36] cursor-pointer"
            >
              {INSTRUMENT_OPTIONS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value as MusicGenre)}
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36] cursor-pointer"
            >
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick prompt input */}
        <div>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Specific vibe or question (optional)..."
            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5A36]"
          />
        </div>

        {/* Ask Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl font-black text-xs bg-[#FF5A36] hover:bg-[#F04D29] text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
        >
          <SparklesIcon size={14} color="#FFFFFF" />
          <span>{isLoading ? 'Thinking with Gemini...' : 'Get Suggestion'}</span>
        </button>

        {/* Actionable Gemini Suggestions */}
        {result && (
          <div className="bg-[#141416] rounded-2xl p-3.5 border border-[#FF5A36]/30 space-y-2.5 animate-in fade-in duration-200">
            {/* Top suggestion header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D9F56A] flex items-center gap-1">
                  <span>⚡</span>
                  <span>Copilot Suggestion</span>
                </span>
                {result.isAiGenerated !== false ? (
                  <span className="text-[9px] bg-[#D9F56A]/15 text-[#D9F56A] border border-[#D9F56A]/30 px-1.5 py-0.2 rounded-full font-bold">
                    Gemini 3.8 Flash
                  </span>
                ) : (
                  <span className="text-[9px] bg-white/10 text-white/70 border border-white/10 px-1.5 py-0.2 rounded-full font-bold">
                    Sonora Producer Engine
                  </span>
                )}
              </div>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => {
                    onApplySuggestions({
                      title: result.title,
                      caption: result.caption,
                      tags: result.tags,
                      instrument: (result.suggestedInstrument as any) || selectedInstrument,
                      notes: result.chordProgression || result.creativeIdea,
                    });
                    onClose();
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-[#D9F56A] text-[#1C1C1E] text-[11px] font-black hover:bg-white transition-all cursor-pointer shadow-2xs"
                >
                  ✓ Apply
                </button>
              )}
            </div>

            {/* Concise Primary Idea */}
            {result.creativeIdea && (
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-[#FF5A36] block mb-0.5">Idea:</span>
                <p className="text-xs text-white/95 leading-snug">{result.creativeIdea}</p>
              </div>
            )}

            {/* Compact Chord Progression */}
            {result.chordProgression && (
              <div className="flex items-center justify-between bg-[#242426] px-3 py-2 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-white/50 font-bold block">Chords:</span>
                  <span className="text-xs font-mono font-bold text-[#FF5A36]">{result.chordProgression}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.chordProgression!, 'chords')}
                  className="text-[10px] text-[#D9F56A] hover:underline cursor-pointer"
                >
                  {copiedKey === 'chords' ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {/* Compact Caption */}
            {result.caption && (
              <div className="bg-[#242426] p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-white/50">Caption:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.caption!, 'caption')}
                    className="text-[10px] text-[#D9F56A] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'caption' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-white/90 leading-snug">{result.caption}</p>
              </div>
            )}

            {/* Expand / Collapse Details Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="text-[10px] font-bold text-white/50 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{showFullDetails ? '▾ Hide details' : '▸ Expand details'}</span>
              </button>

              {showFullDetails && (
                <div className="mt-2 space-y-2 pt-2 border-t border-white/10 text-xs text-white/80 animate-in fade-in duration-150">
                  {result.fullSummary && <p className="leading-relaxed">{result.fullSummary}</p>}
                  {result.rhythmGrooveTip && (
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] font-bold text-white/50 block">Groove Tip:</span>
                      <p>{result.rhythmGrooveTip}</p>
                    </div>
                  )}
                  {result.arrangementTip && (
                    <div className="bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] font-bold text-white/50 block">Arrangement Tip:</span>
                      <p>{result.arrangementTip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10 shrink-0">
          <SecondaryButton onClick={onClose} size="sm">
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
