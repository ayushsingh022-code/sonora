/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — AddPartModal (Two-Screen Collaboration Workflow)
 * Screen 1: Add Part (Upload, Record Coming Soon, Preloaded Demo Assets, Musical Part dropdown, Preview, Discard X)
 * Screen 2: Publish (Optional caption, Back button, Publish Collab, Duplicate prevention, Loading/Success/Error states)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MusicalInstrument,
  UserProfile,
  Song,
  SongVersion,
  Contribution,
  MediaReference,
  Post,
} from '../../../types/models';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';
import { Avatar } from '../../common/Avatar';
import { SparklesIcon, SongDnaWaveIcon } from '../../common/SonoraIcons';
import { MusicCopilotModal } from '../ai/MusicCopilotModal';

export interface AddPartSubmitPayload {
  songId: string;
  parentVersionId: string;
  partType: MusicalInstrument;
  videoMedia: MediaReference;
  partLabel?: string;
  note?: string;
}

export interface PublishPartPayload {
  songId: string;
  parentVersionId: string;
  partType: MusicalInstrument;
  videoMedia: MediaReference;
  caption?: string;
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
  onPublishCollaborationPart?: (
    payload: PublishPartPayload
  ) => Promise<{ success: boolean; error?: string; post?: Post }> | { success: boolean; error?: string; post?: Post };
  onConfirmContribution?: (
    payload: AddPartSubmitPayload
  ) => { success: boolean; error?: string };
}

// Bundled royalty-free sample videos verified and bundled with the app
const PRELOADED_SAMPLE_VIDEOS = [
  {
    id: 'sample_guitar',
    name: 'Acoustic Guitar Riff',
    instrument: 'Guitar' as MusicalInstrument,
    url: '/videos/guitar-take.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 38,
  },
  {
    id: 'sample_vocals',
    name: 'Soulful Vocal Harmony',
    instrument: 'Vocals' as MusicalInstrument,
    url: '/videos/vocals-take.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 45,
  },
  {
    id: 'sample_keys',
    name: 'Rhodes Piano Chords',
    instrument: 'Keyboard' as MusicalInstrument,
    url: '/videos/keys-take.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520523839898-507127050302?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 32,
  },
  {
    id: 'sample_drums',
    name: 'Pocket Drum Groove',
    instrument: 'Drums' as MusicalInstrument,
    url: '/videos/drums-take.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 29,
  },
  {
    id: 'sample_bass',
    name: 'Synthesizer & Sub Bass',
    instrument: 'Bass' as MusicalInstrument,
    url: '/videos/bass-take.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 34,
  },
];

const MUSICAL_PART_OPTIONS: MusicalInstrument[] = [
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
  onPublishCollaborationPart,
  onConfirmContribution,
}) => {
  // Step navigation: 1 = Add Part, 2 = Publish
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Selected contribution video state
  const [, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<MusicalInstrument>('Guitar');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Step 2 publish state
  const [publishCaption, setPublishCaption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Video preview playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const draftBlobUrlRef = useRef<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsSubmitting(false);
      setIsSuccess(false);
      setErrorMessage(null);
      setIsPlayingPreview(false);
      if (currentUser.instruments && currentUser.instruments.length > 0) {
        setSelectedInstrument(currentUser.instruments[0]);
      } else {
        setSelectedInstrument('Guitar');
      }
    } else {
      // Clean up draft blob url if modal closed without publishing
      if (draftBlobUrlRef.current && draftBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(draftBlobUrlRef.current);
        draftBlobUrlRef.current = null;
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle local video file upload
  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('File size exceeds 500MB limit. Please choose a smaller file.');
      return;
    }

    if (draftBlobUrlRef.current && draftBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(draftBlobUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    draftBlobUrlRef.current = objectUrl;
    setVideoFile(file);
    setVideoUrl(objectUrl);
    setVideoTitle(file.name);
    setSelectedPresetId('');
    setIsPlayingPreview(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Direct selection of bundled sample video asset (no local file picker required)
  const handleSelectPreloadedSample = (sampleId: string) => {
    const sample = PRELOADED_SAMPLE_VIDEOS.find((s) => s.id === sampleId);
    if (!sample) return;

    if (draftBlobUrlRef.current && draftBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(draftBlobUrlRef.current);
      draftBlobUrlRef.current = null;
    }

    setVideoFile(null);
    setVideoUrl(sample.url);
    setVideoTitle(sample.name);
    setSelectedInstrument(sample.instrument);
    setSelectedPresetId(sample.id);
    setErrorMessage(null);
    setIsPlayingPreview(false);
  };

  // Discard selected pending video (✕ control)
  const handleDiscardSelection = () => {
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
    if (draftBlobUrlRef.current && draftBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(draftBlobUrlRef.current);
      draftBlobUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setVideoFile(null);
    setVideoUrl(null);
    setVideoTitle('');
    setSelectedPresetId('');
    setIsPlayingPreview(false);
    setErrorMessage(null);
  };

  const handleTogglePlayPreview = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    } else {
      previewVideoRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  // Proceed from Screen 1 to Screen 2
  const handleContinueToPublish = () => {
    if (!videoUrl) {
      setErrorMessage('Please select a video or pick a quick take before continuing.');
      return;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
      setIsPlayingPreview(false);
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  // Execute publication on Screen 2
  const handleExecutePublish = async () => {
    if (!videoUrl) {
      setErrorMessage('No video selected.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const videoMedia: MediaReference = {
        type: 'video',
        url: videoUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        durationSeconds: 30,
      };

      const payload: PublishPartPayload = {
        songId: song.id,
        parentVersionId: parentVersion.id,
        partType: selectedInstrument,
        videoMedia,
        caption: publishCaption.trim() || undefined,
        partLabel: `${currentUser.displayName || currentUser.username} — ${selectedInstrument}`,
        note: `Added ${selectedInstrument} part to ${song.title}`,
      };

      let result: { success: boolean; error?: string; post?: Post } = { success: false };
      if (onPublishCollaborationPart) {
        result = await onPublishCollaborationPart(payload);
      } else if (onConfirmContribution) {
        result = onConfirmContribution(payload);
      } else {
        result = { success: false, error: 'Publish handler is not configured.' };
      }

      if (result.success) {
        setIsSuccess(true);
        // Do not revoke object url as it's now saved in the published feed post
        draftBlobUrlRef.current = null;
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMessage(result.error || 'Failed to publish collaboration.');
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while publishing.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] text-[#20201E] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D7] max-h-[92vh] flex flex-col">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#EFE9DF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center text-white shadow-xs">
              <SongDnaWaveIcon size={18} color="#FFFFFF" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[#20201E]">
                  {currentStep === 1 ? 'Add Part' : 'Publish Collaboration'}
                </h2>
                <span className="text-[10px] font-black bg-[#D9F56A] text-[#20201E] px-2 py-0.5 rounded-full">
                  Step {currentStep} of 2
                </span>
              </div>
              <p className="text-xs text-[#B9B2A9] font-medium truncate max-w-xs">
                Song: <span className="text-[#20201E] font-bold">"{song.title}"</span> · v{parentVersion.versionNumber.toFixed(1)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#78716C] hover:text-[#20201E] flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL BODY                                                    */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3 bg-[#D9F56A]/40 border border-[#D9F56A] rounded-2xl text-xs font-black text-[#20201E] flex items-center gap-2">
              <span>✓</span>
              <span>Published successfully! New reel placed at top of Circle.</span>
            </div>
          )}

          {/* =========================================================== */}
          {/* SCREEN 1: ADD PART                                          */}
          {/* =========================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Creator & Part Role Summary Bar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#EFE9DF]">
                <div className="flex items-center gap-2.5">
                  <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-[#20201E] leading-tight">{currentUser.displayName}</p>
                    <p className="text-[11px] text-[#B9B2A9]">@{currentUser.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-[#FF5A36] bg-[#FFEBE5] px-2.5 py-0.5 rounded-full">
                    {selectedInstrument}
                  </span>
                </div>
              </div>

              {/* Option 1: Upload and Record Options */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#20201E] mb-2">
                  1. Record or Upload Take
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 bg-white border border-[#EFE9DF] hover:border-[#FF5A36] rounded-2xl text-left transition-all hover:bg-[#FFF9F7] cursor-pointer group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#FFEBE5] text-[#FF5A36] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className="text-xs font-black text-[#20201E]">Upload Video</div>
                    <div className="text-[10px] text-[#B9B2A9]">Select MP4 or WebM file</div>
                  </button>

                  {/* Record Placeholder (Strictly labelled Coming Soon) */}
                  <div className="p-3.5 bg-[#FAF7F2] border border-[#E5DFD5] rounded-2xl text-left opacity-80 relative select-none">
                    <div className="w-8 h-8 rounded-xl bg-neutral-200 text-neutral-600 flex items-center justify-center mb-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="7" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-neutral-800">Record Take</span>
                      <span className="text-[9px] font-black bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded-full uppercase">
                        Coming Soon
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A8A29E] mt-0.5">In-app camera recording</div>
                  </div>
                </div>
              </div>

              {/* Option 2: Preloaded Demo Assets Dropdown */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#20201E] mb-1.5">
                  Or Pick a Preloaded Demo Take
                </label>
                <div className="relative">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleSelectPreloadedSample(e.target.value)}
                    className="w-full bg-white border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] cursor-pointer shadow-2xs appearance-none pr-9"
                  >
                    <option value="">-- Choose a preloaded demo asset --</option>
                    {PRELOADED_SAMPLE_VIDEOS.map((s) => (
                      <option key={s.id} value={s.id}>
                        🎵 {s.instrument} — {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Option 3: Musical Part Selection Dropdown with AI Copilot Advice */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#20201E]">
                    Musical Part / Role
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCopilotOpen(true)}
                    className="text-[10px] font-bold text-[#FF5A36] hover:text-[#FF2D8B] flex items-center gap-1 cursor-pointer bg-[#FFF2EE] px-2 py-0.5 rounded-full border border-[#FF5A36]/20 transition-colors"
                  >
                    <SparklesIcon size={11} color="#FF5A36" />
                    <span>Copilot suggestions</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value as MusicalInstrument)}
                    className="w-full bg-white border border-[#EFE9DF] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] cursor-pointer shadow-2xs appearance-none pr-9"
                  >
                    {MUSICAL_PART_OPTIONS.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Video Preview Player with Discard (✕) Control */}
              {videoUrl ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#20201E]">
                      Preview Contribution
                    </span>
                    <span className="text-[10px] text-[#B9B2A9]">Tap player to play / pause</span>
                  </div>
                  <div className="relative aspect-16/9 w-full bg-black rounded-2xl overflow-hidden shadow-md">
                    <video
                      ref={previewVideoRef}
                      src={videoUrl}
                      playsInline
                      loop
                      onClick={handleTogglePlayPreview}
                      onPlay={() => setIsPlayingPreview(true)}
                      onPause={() => setIsPlayingPreview(false)}
                      className="w-full h-full object-cover cursor-pointer"
                    />

                    {/* Top Overlay with Title and Discard ✕ Button */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-auto">
                      <span className="text-[10px] bg-black/60 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full truncate max-w-[200px]">
                        {videoTitle || `${selectedInstrument} Take`}
                      </span>

                      {/* Clear/Remove ✕ control */}
                      <button
                        type="button"
                        onClick={handleDiscardSelection}
                        className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#FF5A36] text-white flex items-center justify-center text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                        title="Remove selected video"
                        aria-label="Remove selected video"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Center Play/Pause button */}
                    {!isPlayingPreview && (
                      <button
                        type="button"
                        onClick={handleTogglePlayPreview}
                        className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                        aria-label="Play preview"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <path d="M8 5V19L19 12L8 5Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/70 border border-dashed border-[#D8D0C5] rounded-2xl text-center text-xs text-[#B9B2A9]">
                  No video selected yet. Select a file above or pick a demo take to preview.
                </div>
              )}

              {/* Sync to Original Video (AI-powered · Coming Soon) */}
              <div className="pt-0.5">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-3.5 bg-white text-[#20201E] border border-[#EFE9DF] rounded-2xl flex items-center justify-between shadow-2xs opacity-80 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FFEBE5] text-[#FF5A36] flex items-center justify-center shrink-0">
                      <SparklesIcon size={13} color="#FF5A36" />
                    </div>
                    <span className="text-xs font-black text-[#20201E]">
                      Sync to Original Video
                    </span>
                  </div>

                  <span className="text-[9px] font-black bg-[#FFEBE5] text-[#FF5A36] border border-[#FF5A36]/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    AI-powered · Coming Soon
                  </span>
                </button>
                <p className="text-[10px] text-[#78716C] mt-1 text-center font-medium">
                  Automatically align your contribution with the original video.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================== */}
          {/* SCREEN 2: PUBLISH                                           */}
          {/* =========================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Summary Card of the Collaboration */}
              <div className="p-4 bg-white rounded-2xl border border-[#EFE9DF] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DF]">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36]">
                      Target Lineage
                    </span>
                    <h3 className="text-sm font-black text-[#20201E]">{song.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-[#D9F56A] text-[#20201E] px-2 py-0.5 rounded-full">
                      v{(parentVersion.versionNumber + 0.1).toFixed(1)} Mix
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {videoUrl && (
                    <div className="w-16 h-16 rounded-xl bg-black overflow-hidden shrink-0 relative">
                      <video src={videoUrl} playsInline className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[8px] bg-black/70 text-white font-bold px-1 rounded-xs">
                        {selectedInstrument}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#20201E] truncate">
                      {videoTitle || `${selectedInstrument} performance take`}
                    </p>
                    <p className="text-[11px] text-[#B9B2A9]">
                      Contributed by @{currentUser.username} as <span className="font-bold text-[#FF5A36]">{selectedInstrument}</span>
                    </p>
                    <p className="text-[10px] text-[#78716C] mt-1">
                      Inherits {activeContributions.length} prior stem{activeContributions.length === 1 ? '' : 's'} · Full attribution preserved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Thought or Caption Composer */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#20201E] mb-1.5">
                  Thought or Caption (Optional)
                </label>
                <textarea
                  value={publishCaption}
                  onChange={(e) => setPublishCaption(e.target.value)}
                  placeholder={`Share what inspired your ${selectedInstrument} take, chord ideas, or invite others to collaborate...`}
                  rows={3}
                  className="w-full bg-white border border-[#EFE9DF] rounded-2xl p-3 text-xs text-[#20201E] placeholder:text-[#B9B2A9] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] resize-none shadow-2xs"
                />
              </div>

              {/* Informative publication note */}
              <div className="p-3 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-[11px] text-[#78716C] leading-relaxed">
                ℹ️ Publishing creates a new child version in Song DNA and displays your contribution video alongside existing stems at the top of Circle.
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL FOOTER                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#EFE9DF] flex items-center justify-between gap-3 shrink-0">
          {currentStep === 1 ? (
            <>
              <SecondaryButton size="md" onClick={onClose} disabled={isSubmitting} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton
                size="md"
                onClick={handleContinueToPublish}
                disabled={!videoUrl || isSubmitting}
                className="flex-2 flex items-center justify-center gap-1.5"
              >
                <span>Continue to Publish</span>
                <span className="text-white/80">→</span>
              </PrimaryButton>
            </>
          ) : (
            <>
              <SecondaryButton
                size="md"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting || isSuccess}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <span>← Back</span>
              </SecondaryButton>
              <PrimaryButton
                size="md"
                onClick={handleExecutePublish}
                disabled={isSubmitting || isSuccess}
                className="flex-2 flex items-center justify-center gap-1.5"
              >
                <span>{isSubmitting ? 'Publishing...' : 'Publish to Circle'}</span>
                <span>🚀</span>
              </PrimaryButton>
            </>
          )}
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
            if (res.caption) setPublishCaption(res.caption);
            setIsCopilotOpen(false);
          }}
        />
      )}
    </div>
  );
};
