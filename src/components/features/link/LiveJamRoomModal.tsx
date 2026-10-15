/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, CollaborationEvent } from '../../../types/models';
import { Avatar } from '../../common/Avatar';
import { PrimaryButton, SecondaryButton } from '../../common/Buttons';

interface LiveJamRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CollaborationEvent;
  currentUser: UserProfile;
  participants: UserProfile[];
}

export const LiveJamRoomModal: React.FC<LiveJamRoomModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  participants,
}) => {
  const [bpm, setBpm] = useState(98);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeBeat, setActiveBeat] = useState(0);
  const [activeStems, setActiveStems] = useState({
    drums: true,
    bass: true,
    chords: true,
    lead: true,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const synthStopRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Web Audio synth beat groove
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      let step = 0;
      let isStopped = false;

      const stepIntervalMs = (60 / bpm / 2) * 1000; // Eighth notes

      // Chord frequencies in Pentatonic / Soul scale
      const chordNotes = [
        [220, 261.63, 329.63, 392], // Am7
        [174.61, 220, 261.63, 329.63], // Fmaj7
        [261.63, 329.63, 392, 493.88], // Cmaj7
        [196, 246.94, 293.66, 349.23], // G7
      ];

      const playStep = () => {
        if (isStopped) return;
        const currentStep = step % 8;
        setActiveBeat(currentStep);

        const chordIdx = Math.floor(step / 8) % chordNotes.length;
        const now = ctx.currentTime;

        // Kick drum on beats 0 & 4
        if (activeStems.drums && (currentStep === 0 || currentStep === 4)) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
          kickGain.gain.setValueAtTime(0.3, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.16);
        }

        // Snare / Rim on beat 2 & 6
        if (activeStems.drums && (currentStep === 2 || currentStep === 6)) {
          const snareOsc = ctx.createOscillator();
          const snareGain = ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(220, now);
          snareGain.gain.setValueAtTime(0.18, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          snareOsc.connect(snareGain);
          snareGain.connect(ctx.destination);
          snareOsc.start(now);
          snareOsc.stop(now + 0.09);
        }

        // Bassline on root notes
        if (activeStems.bass && (currentStep === 0 || currentStep === 3 || currentStep === 5)) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'sawtooth';
          const rootFreq = chordNotes[chordIdx][0] / 2;
          bassOsc.frequency.setValueAtTime(rootFreq, now);
          bassGain.gain.setValueAtTime(0.15, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.25);
        }

        // Synth Chords on measure start
        if (activeStems.chords && currentStep === 0) {
          chordNotes[chordIdx].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.02);
            gain.gain.setValueAtTime(0.04, now + i * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.02);
            osc.stop(now + 0.85);
          });
        }

        step++;
      };

      const timer = setInterval(playStep, stepIntervalMs);
      intervalRef.current = timer as unknown as number;

      synthStopRef.current = () => {
        isStopped = true;
        clearInterval(timer);
        ctx.close().catch(() => {});
      };
    } catch {
      // AudioContext unavailable or suspended
    }

    return () => {
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }
    };
  }, [isOpen, isPlaying, bpm, activeStems]);

  // Recording timer
  useEffect(() => {
    let recTimer: number;
    if (isRecording) {
      recTimer = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(recTimer);
  }, [isRecording]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141417] text-white w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#D9F56A] text-[#20201E] text-xs font-black px-4 py-2 rounded-full shadow-lg">
            {toastMessage}
          </div>
        )}

        {/* Room Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0F0F12]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9F56A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D9F56A]"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">{event.title}</h2>
                <span className="text-[10px] font-black bg-[#D9F56A] text-[#0A0A0C] px-2 py-0.5 rounded-full">
                  LIVE JAM
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                {event.genre || 'Indie'} · {event.instrument || 'Guitar'} · Synchronized Multi-Track
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Live Collaborators Rail */}
        <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10">
                <Avatar src={p.avatarUrl} alt={p.displayName} size="xs" />
                <span className="text-[11px] font-bold text-white truncate max-w-[100px]">
                  {p.displayName}
                </span>
                <span className="text-[9px] text-[#D9F56A] font-black">● In Sync</span>
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-white/60 shrink-0 ml-2">
            {participants.length} connected
          </span>
        </div>

        {/* Interactive Visualizer Canvas / Beat Grid */}
        <div className="p-5 flex-1 flex flex-col justify-center items-center bg-radial from-neutral-900 to-[#0F0F12]">
          {/* Waveform / Visualizer Pulsing Bars */}
          <div className="w-full flex items-center justify-center gap-1.5 h-20 mb-6">
            {[30, 60, 95, 45, 80, 100, 75, 40, 85, 95, 65, 45, 90, 70, 50, 80].map((h, i) => {
              const isCurrent = activeBeat === i % 8;
              return (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-150 ${
                    isCurrent
                      ? 'bg-[#D9F56A] shadow-md shadow-[#D9F56A]/50 scale-y-110'
                      : isPlaying
                      ? 'bg-[#FF5A36]/80'
                      : 'bg-white/20'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(20, h * (isCurrent ? 1 : 0.6))}%` : '20%',
                  }}
                />
              );
            })}
          </div>

          {/* 8-Step Beat Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
              <span
                key={b}
                className={`w-3 h-3 rounded-full transition-all ${
                  activeBeat === b
                    ? 'bg-[#D9F56A] ring-4 ring-[#D9F56A]/30 scale-125'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Stem Toggles */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
            {[
              { key: 'drums', label: '🥁 Beats' },
              { key: 'bass', label: '🎸 Bass' },
              { key: 'chords', label: '🎹 Rhodes' },
              { key: 'lead', label: '🎙️ Lead' },
            ].map(({ key, label }) => {
              const active = activeStems[key as keyof typeof activeStems];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setActiveStems((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof activeStems],
                    }))
                  }
                  className={`py-2 px-1 rounded-2xl text-[11px] font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-white/15 text-white border-white/20 shadow-xs'
                      : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                  }`}
                >
                  {label}
                  <span
                    className={`block text-[9px] mt-0.5 ${
                      active ? 'text-[#D9F56A]' : 'text-white/30'
                    }`}
                  >
                    {active ? 'ON' : 'MUTE'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Control Deck */}
        <div className="p-4 sm:p-5 bg-[#0F0F12] border-t border-white/10 shrink-0 space-y-3">
          {/* Tempo BPM Slider & Play Toggle */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-full bg-[#D9F56A] text-[#20201E] font-black text-xs flex items-center gap-1.5 hover:bg-[#C9E758] transition-colors cursor-pointer"
            >
              <span>{isPlaying ? '⏸ Pause Groove' : '▶ Play Groove'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">BPM:</span>
              <input
                type="range"
                min="70"
                max="140"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 accent-[#FF5A36] cursor-pointer"
              />
              <span className="text-xs font-black text-white w-7 text-right">{bpm}</span>
            </div>
          </div>

          {/* Record Live Stem / Sync */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                if (isRecording) {
                  setIsRecording(false);
                  setToastMessage(`Stem recorded (${recordingSeconds}s)! Synced with session.`);
                  setTimeout(() => setToastMessage(null), 3000);
                } else {
                  setIsRecording(true);
                  setToastMessage('Recording your stem live...');
                  setTimeout(() => setToastMessage(null), 2500);
                }
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
              <span>{isRecording ? `Recording (${recordingSeconds}s)... Stop` : 'Record Stem Take'}</span>
            </button>

            <SecondaryButton size="sm" onClick={onClose}>
              Leave Room
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};
