/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, CollaborationEvent, MusicalInstrument, MusicGenre } from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';

export interface JamSessionSubmitPayload {
  sessionType: 'now' | 'scheduled';
  targetUserId: string;
  title: string;
  date?: string;
  startTime?: string;
  durationMinutes: number;
  instrument?: MusicalInstrument;
  genre?: MusicGenre;
  note?: string;
}

interface JamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialTargetUser?: UserProfile;
  availableMusicians: UserProfile[];
  onConfirmSchedule: (payload: JamSessionSubmitPayload) => void;
}

export const JamSessionModal: React.FC<JamSessionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTargetUser,
  availableMusicians,
  onConfirmSchedule,
}) => {
  const [sessionType, setSessionType] = useState<'now' | 'scheduled'>('now');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialTargetUser?.id || availableMusicians[0]?.id || ''
  );
  const [title, setTitle] = useState(
    initialTargetUser ? `Jam Session with ${initialTargetUser.displayName}` : 'Live Song DNA Jam'
  );
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [instrument, setInstrument] = useState<MusicalInstrument>('Guitar');
  const [genre, setGenre] = useState<MusicGenre>('Indie');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetMusician = availableMusicians.find((m) => m.id === selectedUserId) || initialTargetUser;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage('Please select a musician to jam with.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a session title.');
      return;
    }
    if (sessionType === 'scheduled' && (!date || !startTime)) {
      setErrorMessage('Please set a date and start time for your scheduled session.');
      return;
    }

    onConfirmSchedule({
      sessionType,
      targetUserId: selectedUserId,
      title: title.trim(),
      date: sessionType === 'scheduled' ? date : undefined,
      startTime: sessionType === 'scheduled' ? startTime : undefined,
      durationMinutes,
      instrument,
      genre,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const instrumentOptions: MusicalInstrument[] = [
    'Guitar',
    'Vocals',
    'Bass',
    'Drums',
    'Keyboard',
    'Piano',
    'Beats',
    'Synth',
    'Saxophone',
  ];

  const genreOptions: MusicGenre[] = [
    'Indie',
    'Pop',
    'Rock',
    'R&B',
    'Hip Hop',
    'Afro-fusion',
    'Electronic',
    'Jazz',
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#EFE9DF] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9DF] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] text-white flex items-center justify-center font-black shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-black text-[#20201E]">Request Jam Session</h2>
              <p className="text-[11px] text-[#8E8E93]">Play live or schedule a synchronized collaboration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#EBE5DA] text-[#20201E] flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Session Type Switcher */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
              Session Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFE9DF]/60 rounded-2xl">
              <button
                type="button"
                onClick={() => setSessionType('now')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  sessionType === 'now'
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'text-[#20201E]/70 hover:text-[#20201E]'
                }`}
              >
                <span>⚡</span>
                <span>Jam Now</span>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('scheduled')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  sessionType === 'scheduled'
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'text-[#20201E]/70 hover:text-[#20201E]'
                }`}
              >
                <span>📅</span>
                <span>Schedule Later</span>
              </button>
            </div>
          </div>

          {/* Target Musician Picker */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
              Jam Partner
            </label>
            {initialTargetUser ? (
              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EFE9DF]">
                <Avatar src={initialTargetUser.avatarUrl} alt={initialTargetUser.displayName} size="md" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#20201E] block truncate">
                    {initialTargetUser.displayName}
                  </span>
                  <span className="text-[11px] text-[#8E8E93]">@{initialTargetUser.username}</span>
                </div>
                <span className="ml-auto text-[10px] font-bold bg-[#D9F56A] text-[#20201E] px-2 py-0.5 rounded-full">
                  Selected
                </span>
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  const partner = availableMusicians.find((m) => m.id === e.target.value);
                  if (partner) {
                    setTitle(`Jam Session with ${partner.displayName}`);
                  }
                }}
                className="w-full bg-white text-xs font-bold text-[#20201E] p-3 rounded-2xl border border-[#EFE9DF] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]"
              >
                {availableMusicians
                  .filter((m) => m.id !== currentUser.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} (@{m.username}) — {m.instruments.slice(0, 2).join(', ')}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Session Title */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Late Night Groove / Drum Stems Sync"
              className="w-full bg-white text-xs text-[#20201E] font-medium p-3 rounded-2xl border border-[#EFE9DF] focus:outline-none focus:ring-2 focus:ring-[#FF5A36]"
              required
            />
          </div>

          {/* Date & Start Time (Only when scheduled) */}
          {sessionType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-2xl border border-[#EFE9DF]">
              <div>
                <label className="text-[11px] font-bold text-[#20201E] block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#FAF7F2] text-xs font-bold text-[#20201E] p-2 rounded-xl border border-[#EFE9DF]"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#20201E] block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#FAF7F2] text-xs font-bold text-[#20201E] p-2 rounded-xl border border-[#EFE9DF]"
                  required
                />
              </div>
            </div>
          )}

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-[#20201E] text-white shadow-xs'
                      : 'bg-white text-[#20201E] hover:bg-[#EFE9DF] border border-[#EFE9DF]'
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* Instrument & Genre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
                Instrument
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-white text-xs font-bold text-[#20201E] p-2.5 rounded-xl border border-[#EFE9DF]"
              >
                {instrumentOptions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-white text-xs font-bold text-[#20201E] p-2.5 rounded-xl border border-[#EFE9DF]"
              >
                {genreOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Note / Agenda */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#20201E] block mb-1.5">
              Note or Collaboration Goal (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Let's record the bridge guitar riff and harmonize on the chorus."
              rows={2}
              className="w-full bg-white text-xs text-[#20201E] p-3 rounded-2xl border border-[#EFE9DF] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#EFE9DF] flex items-center justify-end gap-2">
            <SecondaryButton size="sm" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" type="submit">
              {sessionType === 'now' ? 'Launch Jam Now ⚡' : 'Confirm Schedule 📅'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
