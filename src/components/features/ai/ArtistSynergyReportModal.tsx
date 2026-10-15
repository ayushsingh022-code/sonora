/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types/models';
import { MusicianMatchResult, AIMatchmakerRequest } from '../../../types/ai';
import { fetchCollaborationMatchmaker } from '../../../services/aiService';
import { SparklesIcon } from '../../common/SonoraIcons';
import { Avatar } from '../../common/Avatar';
import { SecondaryButton } from '../../common/Buttons';
import { calculateArtistSynergy } from '../../../utils/synergyEngine';

interface ArtistSynergyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  targetArtist: UserProfile;
  onRequestJamSession?: (artist: UserProfile) => void;
  onStartConversation?: (targetUserId: string) => void;
}

export const ArtistSynergyReportModal: React.FC<ArtistSynergyReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetArtist,
  onRequestJamSession,
  onStartConversation,
}) => {
  const [matchResult, setMatchResult] = useState<MusicianMatchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadSynergy = async () => {
      setIsLoading(true);
      try {
        const req: AIMatchmakerRequest = {
          currentUser,
          candidates: [targetArtist],
          targetUserId: targetArtist.id,
        };

        const res = await fetchCollaborationMatchmaker(req);
        if (res.matches && res.matches.length > 0) {
          setMatchResult(res.matches[0]);
        } else {
          setMatchResult(calculateArtistSynergy(currentUser, targetArtist));
        }
      } catch (e) {
        setMatchResult(calculateArtistSynergy(currentUser, targetArtist));
      } finally {
        setIsLoading(false);
      }
    };

    loadSynergy();
  }, [isOpen, currentUser.id, targetArtist.id]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center p-0.5 shadow-md">
              <div className="w-full h-full bg-[#1C1C1E] rounded-[10px] flex items-center justify-center">
                <SparklesIcon size={18} color="#FF5A36" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D9F56A]">
                AI Synergy Report
              </span>
              <h3 className="text-base font-black text-white">Collaboration Compatibility</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Both Avatars + Score */}
        <div className="flex items-center justify-around py-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex flex-col items-center text-center">
            <Avatar src={currentUser.avatarUrl} alt={currentUser.displayName} size="md" />
            <span className="text-xs font-bold text-white mt-1.5">{currentUser.displayName}</span>
            <span className="text-[10px] text-white/50">{currentUser.instruments?.[0] || 'Musician'}</span>
          </div>

          <div className="flex flex-col items-center">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-[#D9F56A]">{matchResult?.synergyScore || 92}%</span>
                <span className="text-[9px] font-bold text-[#FF5A36] uppercase tracking-wider">Synergy</span>
              </div>
            )}
            <span className="text-xs text-white/30 font-mono mt-1">✦ ✦ ✦</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <Avatar src={targetArtist.avatarUrl} alt={targetArtist.displayName} size="md" />
            <span className="text-xs font-bold text-white mt-1.5">{targetArtist.displayName}</span>
            <span className="text-[10px] text-white/50">{targetArtist.instruments?.[0] || 'Artist'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-white/60">
            Calculating acoustic frequencies, genre crossover, and harmonic affinity...
          </div>
        ) : matchResult ? (
          <div className="space-y-3">
            <div className="bg-[#242426] p-3.5 rounded-xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-[#FF5A36]">{matchResult.headline}</h4>

              <div className="space-y-1">
                {matchResult.complementaryReasons.map((reason, idx) => (
                  <div key={idx} className="text-xs text-white/85 flex items-start gap-1.5">
                    <span className="text-[#D9F56A] font-bold">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {matchResult.recommendedProjectConcept && (
                <div className="pt-2 border-t border-white/5 text-xs text-[#D9F56A]">
                  <span className="font-bold">Project Idea: </span>
                  <span className="text-white/90">{matchResult.recommendedProjectConcept}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {onRequestJamSession && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestJamSession(targetArtist);
                  }}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Request Jam Session</span>
                  <span>⚡</span>
                </button>
              )}

              {onStartConversation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartConversation(targetArtist.id);
                  }}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                >
                  Send Direct Message
                </button>
              )}
            </div>
          </div>
        ) : null}

        <div className="pt-2 border-t border-white/10 flex justify-end">
          <SecondaryButton onClick={onClose} size="sm">
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
