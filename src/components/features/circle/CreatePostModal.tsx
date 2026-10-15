/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — CreatePostModal (Phase 3A: Simple Video Post Creation)
 * Focused, streamlined 4-step creation experience:
 * 1. Select a video (MP4, WebM)
 * 2. Preview and play it
 * 3. Add a caption
 * 4. Publish to Circle
 * 
 * Advanced music and Song DNA options are tucked behind progressive disclosure.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MusicalInstrument,
  Post,
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

export interface CreatePostSubmitPayload {
  post: Partial<Post>;
  songDnaMode: 'none' | 'create_root' | 'contribute';
  rootSongData?: {
    title: string;
    partType: MusicalInstrument;
    versionLabel?: string;
  };
  contributeSongData?: {
    songId: string;
    parentVersionId: string;
    partType: MusicalInstrument;
    versionLabel?: string;
    changelog?: string;
    replacedContributionId?: string;
  };
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialType?: string;
  initialSongId?: string;
  availableSongs?: Song[];
  songVersions?: SongVersion[];
  contributions?: Contribution[];
  onSubmitPost: (payload: CreatePostSubmitPayload) => void;
}

// Curated royalty-free performance samples kept under optional settings
const OPTIONAL_PRESETS = [
  {
    name: 'Acoustic Guitar Take',
    instrument: 'Guitar' as MusicalInstrument,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-a-guitar-42512-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    duration: 38,
    fileSize: '4.2 MB',
  },
  {
    name: 'Studio Vocals Take',
    instrument: 'Vocals' as MusicalInstrument,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-42514-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    duration: 45,
    fileSize: '5.1 MB',
  },
  {
    name: 'Rhodes Keys Take',
    instrument: 'Keys' as MusicalInstrument,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-playing-piano-keys-in-a-studio-42515-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520523839898-507127050302?w=800&auto=format&fit=crop&q=80',
    duration: 32,
    fileSize: '3.8 MB',
  },
  {
    name: 'Drums & Beats Take',
    instrument: 'Beats' as MusicalInstrument,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop&q=80',
    duration: 29,
    fileSize: '3.4 MB',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSongId,
  availableSongs = [],
  songVersions = [],
  contributions = [],
  onSubmitPost,
}) => {
  // Simple default flow state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoFileSize, setVideoFileSize] = useState<string>('');
  const [caption, setCaption] = useState<string>('');

  // UI state: loading, error, success
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Progressive disclosure: collapsed by default
  const [showOptionalSettings, setShowOptionalSettings] = useState<boolean>(!!initialSongId);
  const [selectedInstrument, setSelectedInstrument] = useState<MusicalInstrument>('Guitar');
  const [tagsInput, setTagsInput] = useState<string>('music, collab, video');
  const [songTitle, setSongTitle] = useState<string>('');
  const [selectedParentSongId, setSelectedParentSongId] = useState<string>(initialSongId || '');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsPlayingPreview(false);
      if (initialSongId) {
        setSelectedParentSongId(initialSongId);
        setShowOptionalSettings(true);
      }
    }
  }, [isOpen, initialSongId]);

  if (!isOpen) return null;

  // Handle actual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate video format
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setErrorMessage('Please select a valid video file (MP4, WebM, or MOV).');
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(objectUrl);
      setVideoFileName(file.name);

      // Format file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setVideoFileSize(`${sizeMB} MB`);
      setIsPlayingPreview(false);
    } catch {
      setErrorMessage('Failed to load video file. Please try another file.');
    }
  };

  // Quick preset loader (under progressive disclosure)
  const handleSelectPreset = (preset: typeof OPTIONAL_PRESETS[0]) => {
    setVideoFile(null);
    setVideoUrl(preset.videoUrl);
    setVideoFileName(preset.name);
    setVideoFileSize(preset.fileSize);
    setSelectedInstrument(preset.instrument);
    setErrorMessage(null);
    setIsPlayingPreview(false);
  };

  // Toggle video playback in preview
  const handleTogglePlayPreview = () => {
    if (!videoElementRef.current) return;
    if (videoElementRef.current.paused) {
      videoElementRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    } else {
      videoElementRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  // Handle submission to Circle
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl) {
      setErrorMessage('Please select a video file before publishing to Circle.');
      return;
    }

    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);
    setErrorMessage(null);

    // Prepare tags
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const mediaRef: MediaReference = {
      type: 'video',
      url: videoUrl,
      thumbnailUrl: '',
      durationSeconds: 30,
    };

    // Determine Song DNA linkage:
    // If user explicitly chose a parent song under optional settings, branch it.
    // Otherwise, seamlessly establish a root Song DNA for this original video post.
    const isBranching = !!selectedParentSongId;
    const parentSong = isBranching ? availableSongs.find((s) => s.id === selectedParentSongId) : null;
    const parentVersions = parentSong ? songVersions.filter((v) => v.songId === parentSong.id) : [];
    const latestParentVersion = parentVersions[parentVersions.length - 1];

    const finalTitle = songTitle.trim() || caption.slice(0, 32).trim() || `${currentUser.displayName}'s Jam`;

    // Simulate brief publishing handshake to show progress and prevent duplicate clicks
    setTimeout(() => {
      onSubmitPost({
        post: {
          postType: 'video',
          caption: caption.trim() || `New music video by @${currentUser.username} 🎶`,
          tags: tags.length ? tags : ['music', 'video', 'collab'],
          media: [mediaRef],
        },
        songDnaMode: isBranching && parentSong && latestParentVersion ? 'contribute' : 'create_root',
        rootSongData:
          !isBranching || !parentSong
            ? {
                title: finalTitle,
                partType: selectedInstrument,
                versionLabel: 'Original Video Performance',
              }
            : undefined,
        contributeSongData:
          isBranching && parentSong && latestParentVersion
            ? {
                songId: parentSong.id,
                parentVersionId: latestParentVersion.id,
                partType: selectedInstrument,
                versionLabel: `Added ${selectedInstrument} Video`,
                changelog: `Contributed ${selectedInstrument} video part.`,
              }
            : undefined,
      });

      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAF7F2] text-[#20201E] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#EFE9DF] shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
          <h2 className="text-lg font-black tracking-tight text-[#20201E]">Create Post</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-[#EFE9DF] hover:bg-[#E2DDD3] flex items-center justify-center text-[#20201E] transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Creator compact row */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
            <div>
              <p className="text-xs font-bold leading-tight text-[#20201E]">{currentUser.displayName}</p>
              <p className="text-[11px] text-[#8E8E93]">@{currentUser.username}</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#D9F56A] text-[#20201E]">
            Circle
          </span>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 1. VIDEO UPLOAD & PREVIEW AREA                                */}
          {/* ------------------------------------------------------------- */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!videoUrl ? (
            /* Upload Dropzone (When no video is selected) */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D5CEC2] hover:border-[#FF5A36] bg-white rounded-3xl p-6 text-center cursor-pointer transition-all hover:bg-[#FFFDFC] group shadow-2xs"
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF2EE] group-hover:scale-105 transition-transform flex items-center justify-center mx-auto mb-3 text-[#FF5A36]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#20201E]">Choose a video file to upload</h3>
              <p className="text-xs text-[#8E8E93] mt-1">MP4 or WebM video format</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-4 py-1.5 rounded-full bg-[#FF5A36] hover:bg-[#F04D29] text-white text-xs font-bold transition-all shadow-xs"
              >
                Browse Video
              </button>
            </div>
          ) : (
            /* Video Preview Player (When video is selected) */
            <div className="bg-white rounded-3xl p-3 border border-[#EFE9DF] space-y-2.5 shadow-2xs">
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoElementRef}
                  src={videoUrl}
                  playsInline
                  loop
                  controls
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlayingPreview(true)}
                  onPause={() => setIsPlayingPreview(false)}
                />

                {/* Center play toggle if paused */}
                {!isPlayingPreview && (
                  <button
                    type="button"
                    onClick={handleTogglePlayPreview}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer pointer-events-auto"
                    aria-label="Play preview"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <path d="M8 5V19L19 12L8 5Z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Video metadata row with change button */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-[#20201E] truncate">{videoFileName || 'Selected video'}</p>
                  <p className="text-[11px] text-[#8E8E93]">{videoFileSize || 'Ready to post'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-xs font-bold text-[#FF5A36] hover:bg-[#FFF2EE] rounded-full transition-colors cursor-pointer shrink-0"
                >
                  Change video
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 2. CAPTION INPUT                                              */}
          {/* ------------------------------------------------------------- */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#20201E] block">
                Caption
              </label>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="text-[11px] font-bold text-[#FF5A36] hover:text-[#FF2D8B] flex items-center gap-1.5 cursor-pointer bg-[#FFF2EE] hover:bg-[#FFE5DC] px-2.5 py-1 rounded-full transition-colors border border-[#FF5A36]/20"
                title="Get AI ideas for captions, chords, and tags"
              >
                <SparklesIcon size={12} color="#FF5A36" />
                <span>AI Copilot: Spark Ideas</span>
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's brewing on your mind? Share your riff, chord progression, or collab idea..."
              rows={3}
              className="w-full bg-white border border-[#EFE9DF] rounded-2xl p-3 text-sm text-[#20201E] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] resize-none shadow-2xs"
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. PROGRESSIVE DISCLOSURE: OPTIONAL SETTINGS (COLLAPSED)      */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalSettings(!showOptionalSettings)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#8E8E93] hover:text-[#20201E] transition-colors cursor-pointer"
            >
              <span>{showOptionalSettings ? '▾' : '▸'}</span>
              <span>Optional settings</span>
              {selectedParentSongId && (
                <span className="text-[10px] bg-[#D9F56A] text-[#20201E] px-2 py-0.2 rounded-full">
                  Linked to Song DNA
                </span>
              )}
            </button>

            {showOptionalSettings && (
              <div className="mt-3 p-3.5 bg-white rounded-2xl border border-[#EFE9DF] space-y-3 animate-in fade-in duration-150">
                {/* Instrument Stem */}
                <div>
                  <label className="text-[11px] font-bold text-[#20201E] block mb-1">
                    Lead Instrument
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Vocals', 'Guitar', 'Bass', 'Beats', 'Keys'].map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => setSelectedInstrument(inst as MusicalInstrument)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedInstrument === inst
                            ? 'bg-[#D9F56A] text-[#20201E]'
                            : 'bg-[#FAF7F2] text-[#20201E]/70 hover:bg-[#EFE9DF]'
                        }`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Song DNA Branching */}
                {availableSongs.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-[#20201E] block mb-1">
                      Link to Existing Song DNA (Optional)
                    </label>
                    <select
                      value={selectedParentSongId}
                      onChange={(e) => setSelectedParentSongId(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#20201E] focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                    >
                      <option value="">Create independent root Song DNA (Default)</option>
                      {availableSongs.map((s) => (
                        <option key={s.id} value={s.id}>
                          Branch "{s.title}" ({s.totalLineageAdditions} stems)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="text-[11px] font-bold text-[#20201E] block mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-xl px-2.5 py-1.5 text-xs text-[#20201E] focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                  />
                </div>

                {/* Performance take samples helper */}
                <div className="pt-1 border-t border-[#EFE9DF]">
                  <span className="text-[10px] font-bold text-[#8E8E93] block mb-1">
                    Need sample video footage?
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {OPTIONAL_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`text-left p-1.5 rounded-lg border text-[10px] font-bold truncate transition-all cursor-pointer ${
                          videoUrl === p.videoUrl
                            ? 'bg-[#FF5A36]/10 border-[#FF5A36] text-[#FF5A36]'
                            : 'bg-[#FAF7F2] border-[#EFE9DF] text-[#20201E]/70 hover:bg-[#EFE9DF]'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. ACTIONS: PUBLISH TO CIRCLE & CANCEL                        */}
          {/* ------------------------------------------------------------- */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE9DF]">
            <SecondaryButton
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              type="submit"
              disabled={isSubmitting || !videoUrl}
              className={`px-5 font-bold transition-all ${
                !videoUrl || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Publishing to Circle...' : 'Publish to Circle'}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* AI Music Copilot Modal */}
      {isCopilotOpen && (
        <MusicCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          initialInstrument={selectedInstrument}
          contextTitle="AI Copilot · Spark Post Ideas"
          onApplySuggestions={(res) => {
            if (res.caption) setCaption(res.caption);
            if (res.tags && res.tags.length > 0) setTagsInput(res.tags.join(', '));
            if (res.instrument) setSelectedInstrument(res.instrument);
            if (res.title) setSongTitle(res.title);
            setIsCopilotOpen(false);
          }}
        />
      )}
    </div>
  );
};
