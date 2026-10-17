/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Song, SongVersion, Contribution, UserProfile, MusicalInstrument } from '../../../types/models';
import { AISongDNAGuideRequest, AISongDNAGuideResponse, RecommendedContributionProposal } from '../../../types/ai';
import { fetchSongDNAGuide } from '../../../services/aiService';
import { SparklesIcon, SongDnaWaveIcon } from '../../common/SonoraIcons';

interface SongDNAGuideSectionProps {
  song: Song;
  versions: SongVersion[];
  contributions: Contribution[];
  artists: Record<string, UserProfile>;
  onSelectContributionProposal?: (proposal: RecommendedContributionProposal) => void;
}

export const SongDNAGuideSection: React.FC<SongDNAGuideSectionProps> = ({
  song,
  versions,
  contributions,
  artists,
  onSelectContributionProposal,
}) => {
  const [guideData, setGuideData] = useState<AISongDNAGuideResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const loadDNAGuide = async () => {
    setIsLoading(true);
    const originalArtist = artists[song.originalCreatorId]?.displayName || 'Original Creator';

    const versionPayload = versions.map((v) => {
      const parts = (v.orderedContributionIds || [])
        .map((cid) => contributions.find((c) => c.id === cid))
        .filter((c): c is Contribution => c !== undefined)
        .map((c) => ({
          instrument: c.partType,
          creatorName: artists[c.contributorId]?.displayName || 'Artist',
          note: c.isOriginalStem ? 'Original Stem' : c.partType,
        }));

      return {
        versionNumber: v.versionNumber,
        label: v.versionLabel || `Version ${v.versionNumber}`,
        contributions: parts,
      };
    });

    const request: AISongDNAGuideRequest = {
      songId: song.id,
      songTitle: song.title,
      originalCreator: originalArtist,
      versions: versionPayload,
    };

    const res = await fetchSongDNAGuide(request);
    setGuideData(res);
    setIsLoading(false);
    setHasLoaded(true);
  };

  useEffect(() => {
    // Automatically load on mount
    loadDNAGuide();
  }, [song.id, versions.length]);

  return (
    <div className="bg-[#141416] rounded-2xl p-4 border border-[#FF5A36]/20 my-3 text-white space-y-4">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF2D8B] flex items-center justify-center p-0.5 shadow-sm">
            <div className="w-full h-full bg-[#1C1C1E] rounded-[10px] flex items-center justify-center">
              <SparklesIcon size={16} color="#FF5A36" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D9F56A]">
                AI Song DNA Guide
              </span>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                {guideData?.isAiGenerated === false ? 'Sonora Audio Engine' : 'Gemini 3.8 Flash'}
              </span>
            </div>
            <h4 className="text-sm font-black text-white">Lineage Evolution & Next Stems</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDNAGuide}
          disabled={isLoading}
          className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : '↻ Re-analyze'}
        </button>
      </div>

      {isLoading && !guideData && (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-2 border-[#FF5A36] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-white/70 font-medium">Analyzing Song DNA lineage and sonic spectrum...</p>
        </div>
      )}

      {guideData && (
        <>
          {/* Narrative Lineage Story */}
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A36] block mb-1">
              Lineage Evolutionary Story
            </span>
            <p className="text-xs text-white/90 leading-relaxed">{guideData.lineageStory}</p>
            {guideData.currentVibe && (
              <div className="mt-2 text-[11px] text-[#D9F56A] font-semibold flex items-center gap-1.5">
                <span>Vibe Profile:</span>
                <span className="text-white/80 font-normal">{guideData.currentVibe}</span>
              </div>
            )}
          </div>

          {/* Sonic Spectrum Balance */}
          {guideData.sonicBalance && (
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">
                Sonic Spectrum & Frequency Balance
              </span>
              <p className="text-xs text-white/80 leading-relaxed">{guideData.sonicBalance.analysis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="bg-[#1C1C1E] p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-white/50 font-bold block mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Covered Frequencies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {guideData.sonicBalance.occupiedFrequencies.map((f, i) => (
                      <span key={i} className="text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1C1C1E] p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-white/50 font-bold block mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
                    Missing Sonic Space:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {guideData.sonicBalance.missingFrequencies.map((f, i) => (
                      <span key={i} className="text-[10px] bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[#FF5A36] px-2 py-0.5 rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Next Contributions */}
          {guideData.recommendedContributions && guideData.recommendedContributions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Recommended Next Contributions (3 Proposals)
                </span>
                <span className="text-[10px] text-white/40">Select a part to contribute</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {guideData.recommendedContributions.map((proposal, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1C1C1E] p-3 rounded-xl border border-white/10 hover:border-[#FF5A36]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FF5A36]/20 text-[#FF5A36] border border-[#FF5A36]/30">
                          {proposal.instrument}
                        </span>
                        <h5 className="text-xs font-bold text-white group-hover:text-[#D9F56A] transition-colors">
                          {proposal.roleTitle}
                        </h5>
                        {proposal.complexity && (
                          <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded text-white/60">
                            {proposal.complexity}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/80 leading-relaxed">
                        {proposal.musicalRationale}
                      </p>
                      {proposal.suggestedKeyOrTempo && (
                        <p className="text-[10px] text-white/50 font-mono">
                          Tip: {proposal.suggestedKeyOrTempo} · {proposal.vibe}
                        </p>
                      )}
                    </div>

                    {onSelectContributionProposal && (
                      <button
                        type="button"
                        onClick={() => onSelectContributionProposal(proposal)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF2D8B] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>Contribute Part</span>
                        <span>↗</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
