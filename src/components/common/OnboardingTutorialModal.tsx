/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora — First-Visit Walkthrough Tutorial
 * 5-step clean, mobile-friendly tutorial explaining:
 * 1. Get Demo Videos (Google Drive link & download instructions)
 * 2. Create a Post (share musical performance)
 * 3. Add Part (asynchronous multi-part collaboration)
 * 4. Explore (musicians, instruments & genres)
 * 5. Connect & Showcase (Link messages & Stage artist profiles)
 */

import React, { useState } from 'react';
import {
  CircleNavIcon,
  ExploreNavIcon,
  LinkNavIcon,
  StageNavIcon,
  SongDnaWaveIcon,
} from './SonoraIcons';

export interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  tagline: string;
  badge: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
  accentColor: string;
  actionButton?: {
    label: string;
    href: string;
    subtext?: string;
  };
}

const DEMO_VIDEOS_DRIVE_URL =
  'https://drive.google.com/drive/folders/1ALWgBPD4KERQBEjTOEEKoZCMjcPM9c3s?usp=sharing';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Get Demo Videos',
    tagline: 'Download demo videos to try Sonora.',
    badge: 'Step 1 of 5',
    description:
      'To test Sonora’s creation and collaboration flows, download sample instrument and vocal takes from our demo library to your device.',
    highlights: [
      'Download one or more video stems to your phone or computer',
      'Upload your downloaded clip when creating a post or adding a part',
      'Try different instruments like guitar, drums, bass, or vocals',
    ],
    actionButton: {
      label: 'Download Demo Videos Folder ↗',
      href: DEMO_VIDEOS_DRIVE_URL,
      subtext: 'Opens Google Drive in a new tab. Download a clip, then return here to continue.',
    },
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    accentColor: '#FF5A36',
  },
  {
    title: 'Create a Post',
    tagline: 'Share your performance with the community.',
    badge: 'Step 2 of 5',
    description:
      'Share an original musical take or jam idea using Sonora’s standard post creation flow.',
    highlights: [
      'Tap the "+ Create" button in the navigation or top bar',
      'Select a downloaded or recorded video file from your device',
      'Add a caption, musical #tags, and your instrument role',
      'Publish to the Circle feed for other musicians to watch and hear',
    ],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    accentColor: '#D9F56A',
  },
  {
    title: 'Add Part',
    tagline: 'Asynchronous multi-part collaboration.',
    badge: 'Step 3 of 5',
    description:
      'Sonora’s core feature lets you contribute to existing musical reels without needing to be online together at the same time.',
    highlights: [
      'Open any eligible music reel in Circle and tap "+ Add Part"',
      'Upload your video take from your device',
      'Choose your musical role (e.g. Bass, Keys, Drums, Vocals, Sax)',
      'Publish to create an evolving split-screen collaboration with Song DNA attribution',
    ],
    icon: <SongDnaWaveIcon size={26} color="#FFFFFF" />,
    accentColor: '#FF5A36',
  },
  {
    title: 'Explore',
    tagline: 'Discover musicians, performances & genres.',
    badge: 'Step 4 of 5',
    description:
      'Find creators, performances, instruments, and musical genres that match your style.',
    highlights: [
      'Browse featured artists and open collaboration requests',
      'Filter creators by primary instruments, genres, and availability',
      'Listen to audio samples and discover tracks ready for your input',
    ],
    icon: <ExploreNavIcon size={26} />,
    accentColor: '#20201E',
  },
  {
    title: 'Connect & Showcase',
    tagline: 'Link messages & Stage artist profiles.',
    badge: 'Step 5 of 5',
    description:
      'Use Link for direct messages and collaboration requests, and Stage to showcase your musical identity.',
    highlights: [
      'Use Link to manage messages, friend requests, and collaboration invites',
      'Visit Stage to view artist profiles, bio, instrument badges, and musical catalog',
      'Switch between demo personas anytime to experience different artist perspectives',
    ],
    icon: <StageNavIcon size={26} />,
    accentColor: '#FF2D8B',
  },
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('sonora_tutorial_completed', 'true');
    } catch {}
    onClose();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('sonora_tutorial_completed', 'true');
    } catch {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D7] flex flex-col max-h-[92vh]">
        {/* Top Header with Progress and Skip */}
        <div className="px-5 py-3.5 bg-white border-b border-[#EFE9DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-[#78716C]">
              Welcome to Sonora
            </span>
            <span className="text-[10px] font-black bg-[#FFEBE5] text-[#FF5A36] px-2 py-0.5 rounded-full">
              {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-[#78716C] hover:text-[#20201E] px-2.5 py-1 rounded-full hover:bg-[#F0EBE1] transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-[#EFE9DF] h-1.5 flex" aria-hidden="true">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStepIndex ? 'bg-[#FF5A36]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-4">
          {/* Visual Icon Badge & Step Counter */}
          <div className="flex items-center justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm text-white transition-all transform duration-200"
              style={{
                backgroundColor:
                  currentStep.accentColor === '#D9F56A'
                    ? '#20201E'
                    : currentStep.accentColor,
                color:
                  currentStep.accentColor === '#D9F56A'
                    ? '#D9F56A'
                    : '#FFFFFF',
              }}
            >
              {currentStep.icon}
            </div>

            <span className="text-[11px] font-extrabold bg-[#EFE9DF] text-[#20201E] px-3 py-1 rounded-full">
              {currentStep.badge}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 id="tutorial-title" className="text-xl sm:text-2xl font-black text-[#20201E] tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#FF5A36] mt-0.5">
              {currentStep.tagline}
            </p>
          </div>

          {/* Detailed Paragraph */}
          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
            {currentStep.description}
          </p>

          {/* Special Step 1 Action Button (Google Drive Folder) */}
          {currentStep.actionButton && (
            <div className="bg-white rounded-2xl p-4 border border-[#FF5A36]/30 shadow-2xs space-y-2">
              <a
                href={currentStep.actionButton.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#FF5A36] hover:bg-[#F04D29] text-white font-extrabold text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer text-center"
              >
                <span>{currentStep.actionButton.label}</span>
              </a>
              {currentStep.actionButton.subtext && (
                <p className="text-[11px] text-[#78716C] text-center leading-normal">
                  {currentStep.actionButton.subtext}
                </p>
              )}
            </div>
          )}

          {/* Key Highlights Checklist */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EFE9DF] space-y-2 shadow-2xs">
            <h4 className="text-[10px] font-black text-[#78716C] uppercase tracking-wider">
              How it works:
            </h4>
            {currentStep.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[#20201E] font-medium">
                <span className="w-4 h-4 rounded-full bg-[#D9F56A] text-[#20201E] font-black flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="leading-snug">{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-[#EFE9DF] flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstStep}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isFirstStep
                ? 'opacity-0 pointer-events-none'
                : 'text-[#57534E] hover:bg-[#F0EBE1] active:scale-95'
            }`}
          >
            Back
          </button>

          {/* Center Indicator Dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-5 bg-[#FF5A36]'
                    : 'w-1.5 bg-[#D8D0C5] hover:bg-[#B9B2A9]'
                }`}
              />
            ))}
          </div>

          {/* Next / Finish button */}
          <div className="flex items-center gap-2">
            {isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-full text-xs font-black bg-[#FF5A36] hover:bg-[#F04D29] text-white transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>Finish</span>
                <span>✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-full text-xs font-black bg-[#FF5A36] hover:bg-[#F04D29] text-white transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
