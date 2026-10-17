/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — CreatePostModal
 * Creator-focused simple creation experience:
 * - "What's brewing?" free-form thought/caption composer
 * - Compact AI Copilot prompt/idea generator
 * - Video upload and preview
 * - Visibly marked "Coming soon" AI music generation placeholder
 * - Collapsible Advanced section with exactly 2 choices:
 *     1. Link to a song (reveals song search)
 *     2. Standalone (independent post without Song DNA lineage)
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
} from '../../../types/models';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';
import { Avatar } from '../../common/Avatar';
import { SparklesIcon, SearchIcon, SongDnaWaveIcon } from '../../common/SonoraIcons';
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
  // Composer state: free-form thoughts, musical ideas, or captions
  const [caption, setCaption] = useState<string>('');

  // Video state
  const [, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoFileSize, setVideoFileSize] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Advanced section collapse state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(!!initialSongId);

  // Optional Post Settings: Exactly two choices ('standalone' | 'link_song')
  const [postSettingChoice, setPostSettingChoice] = useState<'standalone' | 'link_song'>(
    initialSongId ? 'link_song' : 'standalone'
  );
  const [selectedLinkedSongId, setSelectedLinkedSongId] = useState<string>(initialSongId || '');
  const [songSearchQuery, setSongSearchQuery] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('sonora, music');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const draftObjectUrlRef = useRef<string | null>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsPlayingPreview(false);
      if (initialSongId) {
        setPostSettingChoice('link_song');
        setSelectedLinkedSongId(initialSongId);
        setIsAdvancedOpen(true);
      } else {
        setPostSettingChoice('standalone');
        setSelectedLinkedSongId('');
        setIsAdvancedOpen(false);
      }
    } else {
      if (draftObjectUrlRef.current && draftObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(draftObjectUrlRef.current);
        draftObjectUrlRef.current = null;
      }
    }
  }, [isOpen, initialSongId]);

  if (!isOpen) return null;

  // Video file upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('Video size exceeds 500MB limit.');
      return;
    }

    try {
      if (draftObjectUrlRef.current && draftObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(draftObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      draftObjectUrlRef.current = objectUrl;
      setVideoFile(file);
      setVideoUrl(objectUrl);
      setVideoFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setVideoFileSize(`${sizeMB} MB`);
      setIsPlayingPreview(false);
    } catch {
      setErrorMessage('Failed to load video file. Please try another file.');
    }
  };

  const handleClearVideo = () => {
    if (draftObjectUrlRef.current && draftObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(draftObjectUrlRef.current);
      draftObjectUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setVideoFile(null);
    setVideoUrl(null);
    setVideoFileName('');
    setVideoFileSize('');
    setIsPlayingPreview(false);
  };

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

  // Filter songs by search query
  const filteredSongs = availableSongs.filter((s) => {
    if (!songSearchQuery.trim()) return true;
    const q = songSearchQuery.toLowerCase().trim();
    return s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });

  // Handle publishing post
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCaption = caption.trim();
    if (!trimmedCaption && !videoUrl) {
      setErrorMessage("Please enter a thought or choose a video before posting.");
      return;
    }

    // Validate user's intent if 'Link to a song' was selected
    if (postSettingChoice === 'link_song' && !selectedLinkedSongId) {
      setErrorMessage('Please select a song to link, or choose Standalone post.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const mediaList: MediaReference[] = videoUrl
      ? [
          {
            type: 'video',
            url: videoUrl,
            thumbnailUrl: '',
            durationSeconds: 30,
          },
        ]
      : [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
          },
        ];

    // Clean handoff: if linked, branch that song. If standalone, absolutely no song DNA!
    if (postSettingChoice === 'link_song' && selectedLinkedSongId) {
      const parentSong = availableSongs.find((s) => s.id === selectedLinkedSongId);
      const parentVersions = parentSong ? songVersions.filter((v) => v.songId === parentSong.id) : [];
      const latestVer = parentVersions[parentVersions.length - 1];

      draftObjectUrlRef.current = null; // Disown so it persists in state
      onSubmitPost({
        post: {
          postType: videoUrl ? 'video' : 'post',
          caption: trimmedCaption || `Collaborating on "${parentSong?.title}" 🎶`,
          tags: tags.length ? tags : ['collab', 'music'],
          media: mediaList,
        },
        songDnaMode: 'contribute',
        contributeSongData: {
          songId: selectedLinkedSongId,
          parentVersionId: latestVer?.id || `ver_root_${selectedLinkedSongId}`,
          partType: (currentUser.instruments?.[0] as MusicalInstrument) || 'Guitar',
          versionLabel: `${currentUser.displayName || currentUser.username} Take`,
          changelog: trimmedCaption || 'Added collaboration take.',
        },
      });
    } else {
      // Standalone: purely independent post with no songId and no inherited Song DNA
      draftObjectUrlRef.current = null; // Disown so it persists in state
      onSubmitPost({
        post: {
          postType: videoUrl ? 'video' : 'post',
          caption: trimmedCaption || `New share by @${currentUser.username} 🎶`,
          tags: tags.length ? tags : ['music', 'share'],
          media: mediaList,
        },
        songDnaMode: 'none',
      });
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] text-[#20201E] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#EFE9DF] shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-[#20201E]">Create Post</h2>
          </div>
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
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="sm" />
            <div>
              <p className="text-xs font-bold leading-tight text-[#20201E]">{currentUser.displayName}</p>
              <p className="text-[11px] text-[#B9B2A9]">@{currentUser.username}</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D9F56A] text-[#20201E]">
            Circle Feed
          </span>
        </div>

        <form onSubmit={handlePublish} className="space-y-4 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 1. "WHAT'S BREWING?" COMPOSER WITH AI COPILOT                 */}
          {/* ------------------------------------------------------------- */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block">
                What's brewing?
              </label>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="text-[10px] font-bold text-[#FF5A36] hover:text-[#FF2D8B] flex items-center gap-1 cursor-pointer bg-[#FFF2EE] px-2.5 py-1 rounded-full border border-[#FF5A36]/25 transition-colors"
                title="Spark post ideas, lyrics, and chords with AI Copilot"
              >
                <SparklesIcon size={12} color="#FF5A36" />
                <span>Copilot Ideas</span>
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share what's on your mind — a late-night riff, chord progression, vocal idea, or creative prompt..."
              rows={3}
              className="w-full bg-white border border-[#EFE9DF] rounded-2xl p-3 text-xs sm:text-sm text-[#20201E] placeholder:text-[#B9B2A9] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] resize-none shadow-2xs leading-relaxed"
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 2. VIDEO UPLOAD & PREVIEW                                     */}
          {/* ------------------------------------------------------------- */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-2">
              Performance Video
            </label>

            {!videoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5CEC2] hover:border-[#FF5A36] bg-white rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-[#FFFDFC] group shadow-2xs flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF2EE] text-[#FF5A36] group-hover:scale-105 transition-transform flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#20201E]">Select video from device</p>
                  <p className="text-[10px] text-[#B9B2A9] mt-0.5">MP4 or WebM video format</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-2.5 border border-[#EFE9DF] space-y-2 shadow-2xs">
                <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoElementRef}
                    src={videoUrl}
                    playsInline
                    loop
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleTogglePlayPreview}
                    onPlay={() => setIsPlayingPreview(true)}
                    onPause={() => setIsPlayingPreview(false)}
                  />

                  {/* Top bar with file name & discard ✕ */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-auto">
                    <span className="text-[10px] bg-black/60 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full truncate max-w-[200px]">
                      {videoFileName} {videoFileSize && `(${videoFileSize})`}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearVideo}
                      className="w-6 h-6 rounded-full bg-black/70 hover:bg-[#FF5A36] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Remove video"
                    >
                      ✕
                    </button>
                  </div>

                  {!isPlayingPreview && (
                    <button
                      type="button"
                      onClick={handleTogglePlayPreview}
                      className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      aria-label="Play preview"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                        <path d="M8 5V19L19 12L8 5Z" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-[11px] text-[#8E8E93] truncate">{videoFileName || 'Selected video'}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                  >
                    Change file
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. FUTURE MUSIC GENERATION PLACEHOLDER (COMING SOON)          */}
          {/* ------------------------------------------------------------- */}
          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5DFD5] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <SparklesIcon size={16} color="#9333ea" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#20201E] truncate">AI Music Generation</span>
                  <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full uppercase shrink-0">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[10px] text-[#78716C] truncate">
                  Generate accompaniment tracks & audio stems directly in Sonora.
                </p>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-bold px-2 py-1 rounded-lg bg-neutral-100 shrink-0 cursor-not-allowed">
              Preview
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. COLLAPSIBLE ADVANCED SECTION                               */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#78716C] hover:text-[#20201E] transition-colors cursor-pointer"
            >
              <span>{isAdvancedOpen ? '▾' : '▸'}</span>
              <span>Advanced Settings</span>
              {postSettingChoice === 'link_song' && selectedLinkedSongId && (
                <span className="text-[10px] bg-[#D9F56A] text-[#20201E] font-bold px-2 py-0.2 rounded-full">
                  Linked to Song
                </span>
              )}
            </button>

            {isAdvancedOpen && (
              <div className="mt-2.5 p-3.5 bg-white rounded-2xl border border-[#EFE9DF] space-y-3 animate-in fade-in duration-150">
                {/* Exactly Two Clear Choices */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#20201E] block mb-2">
                    Post Relationship
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Choice 1: Standalone */}
                    <button
                      type="button"
                      onClick={() => {
                        setPostSettingChoice('standalone');
                        setSelectedLinkedSongId('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        postSettingChoice === 'standalone'
                          ? 'bg-[#20201E] text-white border-[#20201E] shadow-xs'
                          : 'bg-[#FAF7F2] border-[#EFE9DF] text-[#78716C] hover:text-[#20201E]'
                      }`}
                    >
                      <div className="text-xs font-bold">1. Standalone</div>
                      <div className={`text-[10px] mt-0.5 ${postSettingChoice === 'standalone' ? 'text-white/70' : 'text-[#B9B2A9]'}`}>
                        Independent post; no Song DNA lineage
                      </div>
                    </button>

                    {/* Choice 2: Link to a song */}
                    <button
                      type="button"
                      onClick={() => setPostSettingChoice('link_song')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        postSettingChoice === 'link_song'
                          ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs'
                          : 'bg-[#FAF7F2] border-[#EFE9DF] text-[#78716C] hover:text-[#20201E]'
                      }`}
                    >
                      <div className="text-xs font-bold">2. Link to a song</div>
                      <div className={`text-[10px] mt-0.5 ${postSettingChoice === 'link_song' ? 'text-white/80' : 'text-[#B9B2A9]'}`}>
                        Connect with an existing song DNA
                      </div>
                    </button>
                  </div>
                </div>

                {/* Song Search: strictly revealed ONLY when Link to a song is selected */}
                {postSettingChoice === 'link_song' && (
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE9DF] space-y-2 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-[#20201E] flex items-center justify-between">
                      <span>Search & Select Existing Song</span>
                      <span className="text-[10px] text-[#B9B2A9]">Required for linked posts</span>
                    </label>

                    {/* Search query input */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                        <SearchIcon size={14} />
                      </div>
                      <input
                        type="text"
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        placeholder="Search song title..."
                        className="w-full bg-white border border-[#EFE9DF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#20201E] focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                      />
                    </div>

                    {/* Song Select Dropdown */}
                    <select
                      value={selectedLinkedSongId}
                      onChange={(e) => setSelectedLinkedSongId(e.target.value)}
                      className="w-full bg-white border border-[#EFE9DF] rounded-xl px-3 py-2 text-xs font-bold text-[#20201E] focus:outline-none focus:ring-1 focus:ring-[#FF5A36] cursor-pointer"
                    >
                      <option value="">-- Choose a song to link --</option>
                      {filteredSongs.map((s) => (
                        <option key={s.id} value={s.id}>
                          🎵 {s.title} ({s.totalLineageAdditions} additions)
                        </option>
                      ))}
                    </select>

                    {selectedLinkedSongId && (
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <span>✓</span>
                        <span>
                          Will connect as a new collaborative contribution on "
                          {availableSongs.find((s) => s.id === selectedLinkedSongId)?.title}"
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Tags */}
                <div>
                  <label className="text-[11px] font-bold text-[#20201E] block mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. guitar, indie, acoustic"
                    className="w-full bg-[#FAF7F2] border border-[#EFE9DF] rounded-xl px-3 py-1.5 text-xs text-[#20201E] focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 5. PUBLISH AND CANCEL ACTIONS                                 */}
          {/* ------------------------------------------------------------- */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE9DF] shrink-0">
            <SecondaryButton size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              type="submit"
              disabled={isSubmitting || (!caption.trim() && !videoUrl)}
              className="px-5 font-bold cursor-pointer"
            >
              {isSubmitting ? 'Publishing...' : 'Publish to Circle'}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* AI Music Copilot Modal */}
      {isCopilotOpen && (
        <MusicCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          initialInstrument={(currentUser.instruments?.[0] as MusicalInstrument) || 'Guitar'}
          contextTitle="AI Copilot · Spark Post Ideas"
          onApplySuggestions={(res) => {
            if (res.caption) setCaption(res.caption);
            if (res.tags && res.tags.length > 0) setTagsInput(res.tags.join(', '));
            setIsCopilotOpen(false);
          }}
        />
      )}
    </div>
  );
};
