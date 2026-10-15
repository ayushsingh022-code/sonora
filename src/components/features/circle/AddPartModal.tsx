/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — AddPartModal (Phase 3B: Simple Add Part Entry Point)
 * Simple, streamlined contribution flow:
 * 1. Select a video (MP4, WebM) or quick preset
 * 2. Preview video playback
 * 3. Choose musical part / instrument
 * 4. Confirm Contribution (branches into child SongVersion & opens workspace)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MusicalInstrument,
  UserProfile,
  Song,
  SongVersion,
  Contribution,
  MediaReference,
  MAX_VISIBLE_CONTRIBUTIONS,
} from '../../../types/models';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';
import { Avatar } from '../../common/Avatar';
import { SparklesIcon } from '../../common/SonoraIcons';
import { MusicCopilotModal } from '../ai/MusicCopilotModal';

export interface AddPartSubmitPayload {
  songId: string;
  parentVersionId: string;
  partType: MusicalInstrument;
  videoMedia: MediaReference;
  partLabel?: string;
  note?: string;
}

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  song: Song;
  parentVersion: SongVersion;
  activeContributions: Contribution[];
  artists: Record<string, UserProfile>;
  onConfirmContribution: (payload: AddPartSubmitPayload) => { success: boolean; error?: string };
}

// Quick performance presets for fast testing if user doesn't have a local video file
const PART_PRESETS: {
  name: string;
  instrument: MusicalInstrument;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}[] = [
  {
    name: 'Acoustic Guitar Riff',
    instrument: 'Guitar',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-a-guitar-42512-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    duration: 38,
  },
  {
    name: 'Vocal Harmony',
    instrument: 'Vocals',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-42514-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    duration: 45,
  },
  {
    name: 'Rhodes Keys Chords',
    instrument: 'Keyboard',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-playing-piano-keys-in-a-studio-42515-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520523839898-507127050302?w=800&auto=format&fit=crop&q=80',
    duration: 32,
  },
  {
    name: 'Groove Beats & Drums',
    instrument: 'Drums',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop&q=80',
    duration: 29,
  },
  {
    name: 'Synth & Bass Line',
    instrument: 'Bass',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-synthesizer-in-a-recording-studio-42516-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    duration: 34,
  },
];

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

export const AddPartModal: React.FC<AddPartModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  song,
  parentVersion,
  activeContributions,
  artists,
  onConfirmContribution,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoFileSize, setVideoFileSize] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<MusicalInstrument>('Guitar');
  const [partNote, setPartNote] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const unconfirmedDraftUrlRef = useRef<string | null>(null);

  // Set default instrument based on current user's profile
  useEffect(() => {
    if (isOpen) {
      if (currentUser.instruments && currentUser.instruments.length > 0) {
        setSelectedInstrument(currentUser.instruments[0]);
      } else {
        setSelectedInstrument('Guitar');
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    // Validate video MIME type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    // Size limit check (max 500MB)
    const maxBytes = 500 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage('Video size exceeds 500MB limit. Please choose a smaller file.');
      return;
    }

    // Clean up previously replaced unconfirmed draft if user selects another file
    if (unconfirmedDraftUrlRef.current && unconfirmedDraftUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(unconfirmedDraftUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    unconfirmedDraftUrlRef.current = objectUrl;
    setVideoFile(file);
    setVideoUrl(objectUrl);
    setVideoFileName(file.name);
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    setIsPlayingPreview(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSelectPreset = (preset: typeof PART_PRESETS[0]) => {
    if (unconfirmedDraftUrlRef.current && unconfirmedDraftUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(unconfirmedDraftUrlRef.current);
      unconfirmedDraftUrlRef.current = null;
    }
    setVideoFile(null);
    setVideoUrl(preset.videoUrl);
    setVideoFileName(`${preset.name}.mp4`);
    setVideoFileSize('4.2 MB');
    setSelectedInstrument(preset.instrument);
    setErrorMessage(null);
    setIsPlayingPreview(false);
  };

  const handleTogglePlayPreview = () => {
    if (!previewVideoRef.current) return;
    if (isPlayingPreview) {
      previewVideoRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewVideoRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleClearSelectedVideo = () => {
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    if (unconfirmedDraftUrlRef.current && unconfirmedDraftUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(unconfirmedDraftUrlRef.current);
      unconfirmedDraftUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setVideoFile(null);
    setVideoUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    setIsPlayingPreview(false);
    setErrorMessage(null);
  };

  const handleConfirm = () => {
    if (!videoUrl) {
      setErrorMessage('Please select or upload a video for your musical part.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const videoMedia: MediaReference = {
      type: 'video',
      url: videoUrl,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      durationSeconds: 30,
    };

    try {
      // Disown draft so it stays valid for playback in the workspace
      unconfirmedDraftUrlRef.current = null;

      const result = onConfirmContribution({
        songId: song.id,
        parentVersionId: parentVersion.id,
        partType: selectedInstrument,
        videoMedia,
        partLabel: `${currentUser.displayName || currentUser.username} — ${selectedInstrument}`,
        note: partNote.trim() || `Added ${selectedInstrument} part to ${song.title}`,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to save contribution. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving contribution.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const isAtMaxVisible = activeContributions.length >= MAX_VISIBLE_CONTRIBUTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D7] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#EFE9DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#20201E] tracking-tight">Add Part</h2>
                <span className="text-[10px] font-extrabold bg-[#D9F56A] text-[#20201E] px-2 py-0.5 rounded-full">
                  v{parentVersion.versionNumber.toFixed(1)} → v{(parentVersion.versionNumber + 0.1).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-[#B9B2A9] font-medium truncate max-w-xs">
                Contributing to <span className="text-[#20201E] font-bold">"{song.title}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#78716C] hover:text-[#20201E] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Creator Row */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#EFE9DF]">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                size="sm"
              />
              <div>
                <p className="text-xs font-bold text-[#20201E]">{currentUser.displayName}</p>
                <p className="text-[11px] text-[#B9B2A9]">@{currentUser.username}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-extrabold text-[#FF5A36] bg-[#FFEBE5] px-2 py-0.5 rounded-full">
                {selectedInstrument}
              </span>
            </div>
          </div>

          {/* Capacity notice if reaching 6 stems */}
          {isAtMaxVisible && (
            <div className="p-3 bg-[#E9DFFF]/40 border border-[#E9DFFF] rounded-2xl flex items-start gap-2.5 text-xs text-[#20201E]">
              <span className="text-base shrink-0">ℹ️</span>
              <div>
                <p className="font-bold">6 Active Parts Limit</p>
                <p className="text-[11px] text-[#78716C] mt-0.5">
                  This song currently has {MAX_VISIBLE_CONTRIBUTIONS} active parts. Your contribution will become part of the active mix, and the full history remains accessible in Song DNA.
                </p>
              </div>
            </div>
          )}

          {/* Video Selection / Upload Area */}
          <div>
            <label className="block text-xs font-bold text-[#20201E] uppercase tracking-wider mb-2">
              1. Your Performance Video
            </label>

            {videoUrl ? (
              <div className="bg-black rounded-2xl overflow-hidden relative shadow-md">
                <video
                  ref={previewVideoRef}
                  src={videoUrl}
                  playsInline
                  loop
                  onEnded={() => setIsPlayingPreview(false)}
                  className="w-full h-52 object-cover"
                />

                {/* Video Info Overlay with Remove ✕ Action */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    <span className="text-[10px] bg-black/60 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full truncate max-w-[200px]">
                      {videoFileName} {videoFileSize && `(${videoFileSize})`}
                    </span>
                    <span className="text-[10px] bg-[#D9F56A] text-[#20201E] font-black px-2 py-0.5 rounded-full shrink-0">
                      Preview
                    </span>
                  </div>

                  {/* Remove Video Button (✕) */}
                  <button
                    type="button"
                    onClick={handleClearSelectedVideo}
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#FF5A36] text-white flex items-center justify-center text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                    title="Remove selected video"
                    aria-label="Remove selected video"
                  >
                    ✕
                  </button>
                </div>

                {/* Play/Pause Center Button */}
                <button
                  type="button"
                  onClick={handleTogglePlayPreview}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  aria-label={isPlayingPreview ? 'Pause' : 'Play'}
                >
                  {isPlayingPreview ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <path d="M8 5V19L19 12L8 5Z" />
                    </svg>
                  )}
                </button>

                {/* Change Video Action */}
                <div className="absolute bottom-2.5 right-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition-colors cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D8D0C5] hover:border-[#FF5A36] bg-white hover:bg-[#FFF9F6] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBE5] text-[#FF5A36] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#20201E]">Select Video File</p>
                  <p className="text-xs text-[#B9B2A9] mt-0.5">MP4, WebM, MOV · Up to 500MB</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Quick Performance Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                Or pick a quick take
              </span>
              <span className="text-[10px] text-[#B9B2A9]">Tap to test instantly</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PART_PRESETS.map((preset) => {
                const isSelected = videoUrl === preset.videoUrl;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#FF5A36]/10 border-[#FF5A36] text-[#20201E]'
                        : 'bg-white border-[#EFE9DF] hover:border-[#D8D0C5]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${preset.thumbnailUrl})` }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{preset.instrument}</p>
                      <p className="text-[10px] text-[#B9B2A9] truncate">{preset.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part Type / Instrument Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#20201E] uppercase tracking-wider">
                2. Musical Part
              </label>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="text-[11px] font-bold text-[#FF5A36] hover:text-[#FF2D8B] flex items-center gap-1.5 cursor-pointer bg-[#FFF2EE] hover:bg-[#FFE5DC] px-2.5 py-1 rounded-full transition-colors border border-[#FF5A36]/20"
                title="Ask AI what instrument or layer to contribute"
              >
                <SparklesIcon size={12} color="#FF5A36" />
                <span>AI Copilot: What to contribute?</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INSTRUMENT_OPTIONS.map((inst) => {
                const isSelected = selectedInstrument === inst;
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setSelectedInstrument(inst)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#20201E] text-white shadow-xs'
                        : 'bg-white border border-[#EFE9DF] text-[#78716C] hover:text-[#20201E]'
                    }`}
                  >
                    {inst}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-[#20201E] uppercase tracking-wider mb-1.5">
              3. Note for Collaborators (Optional)
            </label>
            <input
              type="text"
              value={partNote}
              onChange={(e) => setPartNote(e.target.value)}
              placeholder={`e.g. Added a soulful ${selectedInstrument} line over the bridge`}
              className="w-full bg-white border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs text-[#20201E] placeholder:text-[#B9B2A9] focus:outline-none focus:border-[#FF5A36]"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-600">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#EFE9DF] flex items-center justify-between gap-3">
          <SecondaryButton
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="md"
            onClick={handleConfirm}
            disabled={!videoUrl || isSubmitting}
            className="flex-2 flex items-center justify-center gap-2"
          >
            <span>Confirm Contribution</span>
            <span className="text-white/80">→</span>
          </PrimaryButton>
        </div>
      </div>

      {/* AI Music Copilot Modal */}
      {isCopilotOpen && (
        <MusicCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          songTitle={song.title}
          initialGenre={artists[song.originalCreatorId]?.genres?.[0] || 'Indie'}
          initialInstrument={selectedInstrument}
          contextTitle={`AI Copilot · Contribute to ${song.title}`}
          existingParts={activeContributions.map((c) => ({
            instrument: c.partType,
            creatorName: artists[c.contributorId]?.displayName || 'Artist',
            note: c.isOriginalStem ? 'Original Stem' : c.partType,
          }))}
          onApplySuggestions={(res) => {
            if (res.instrument) setSelectedInstrument(res.instrument);
            if (res.notes) setPartNote(res.notes);
            setIsCopilotOpen(false);
          }}
        />
      )}
    </div>
  );
};
