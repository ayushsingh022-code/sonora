/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Song DNA Engine
 * Implements core Song DNA lineage rules:
 * - Rule 2: Support branching and version history.
 * - Rule 3: Each contribution creates an immutable new version preserving earlier history and attribution.
 * - Rule 4: Maximum of six visible contributions per version mix.
 * - Rule 5: Original creator's additions count aggregates across entire lineage.
 * - Rule 6: Replacing a contribution creates a new version rather than overwriting historical data.
 */

import {
  Song,
  SongVersion,
  Contribution,
  MusicalInstrument,
  MediaReference,
  MAX_VISIBLE_CONTRIBUTIONS,
} from '../types/models';

export interface CreateRootSongParams {
  title: string;
  creatorId: string;
  postId: string;
  partType: MusicalInstrument;
  media: MediaReference;
  versionLabel?: string;
  changelog?: string;
}

export interface ContributeSongDnaParams {
  song: Song;
  parentVersion: SongVersion;
  contributorId: string;
  partType: MusicalInstrument;
  media: MediaReference;
  versionLabel?: string;
  changelog?: string;
  replacedContributionId?: string; // If mix is at capacity (6) or artist replaces a stem
}

/**
 * Creates a brand-new Song DNA root with its v1.0 initial version and root contribution.
 */
export function createSongDnaRoot(params: CreateRootSongParams): {
  song: Song;
  version: SongVersion;
  contribution: Contribution;
} {
  const timestamp = new Date().toISOString();
  const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const versionId = `ver_${Date.now()}_root`;
  const contributionId = `contrib_${Date.now()}_stem0`;

  const contribution: Contribution = {
    id: contributionId,
    songId,
    versionId,
    contributorId: params.creatorId,
    partType: params.partType,
    audioReference: params.media,
    videoReference: params.media.type === 'video' ? params.media : undefined,
    orderIndex: 0,
    isOriginalStem: true,
    createdAt: timestamp,
  };

  const version: SongVersion = {
    id: versionId,
    songId,
    parentVersionId: null,
    versionNumber: 1.0,
    versionLabel: params.versionLabel || 'Original Root Idea',
    orderedContributionIds: [contributionId],
    createdAt: timestamp,
    createdByUserId: params.creatorId,
    changelogDescription: params.changelog || `Original ${params.partType} stem recorded by creator.`,
  };

  const song: Song = {
    id: songId,
    title: params.title.trim() || 'Untitled Jam',
    originalCreatorId: params.creatorId,
    originalPostId: params.postId,
    lineageIdentifier: `dna_${Date.now()}`,
    totalLineageAdditions: 1, // Root stem counts as 1st contribution
    rootCreatedAt: timestamp,
  };

  return { song, version, contribution };
}

/**
 * Branches an existing Song DNA version with a new contributed musical part.
 * Enforces Rules 3, 4, 5, 6.
 */
export function contributeToSongDna(params: ContributeSongDnaParams): {
  updatedSong: Song;
  newVersion: SongVersion;
  newContribution: Contribution;
} {
  const timestamp = new Date().toISOString();
  const newVersionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newContributionId = `contrib_${Date.now()}_stem`;

  // Compute version number (e.g. 1.0 -> 1.1; 1.9 -> 2.0)
  const nextVersionNumber = Number((params.parentVersion.versionNumber + 0.1).toFixed(1));

  // Determine active ordered stems in the new version (Rule 4: max 6)
  let nextContributionIds = [...params.parentVersion.orderedContributionIds];

  if (params.replacedContributionId) {
    // Rule 6: Replacing a contribution creates a new version with the replacement
    nextContributionIds = nextContributionIds.map((id) =>
      id === params.replacedContributionId ? newContributionId : id
    );
  } else if (nextContributionIds.length >= MAX_VISIBLE_CONTRIBUTIONS) {
    // At maximum capacity (6): replace the oldest non-root stem, or append at limit
    // Preserve original creator's root stem (first element), replace the 6th stem
    nextContributionIds = [
      ...nextContributionIds.slice(0, MAX_VISIBLE_CONTRIBUTIONS - 1),
      newContributionId,
    ];
  } else {
    // Normal append
    nextContributionIds.push(newContributionId);
  }

  const newContribution: Contribution = {
    id: newContributionId,
    songId: params.song.id,
    versionId: newVersionId,
    contributorId: params.contributorId,
    partType: params.partType,
    audioReference: params.media,
    videoReference: params.media.type === 'video' ? params.media : undefined,
    parentContributionId: params.parentVersion.orderedContributionIds[params.parentVersion.orderedContributionIds.length - 1] || null,
    orderIndex: nextContributionIds.indexOf(newContributionId),
    isOriginalStem: false,
    createdAt: timestamp,
  };

  const newVersion: SongVersion = {
    id: newVersionId,
    songId: params.song.id,
    parentVersionId: params.parentVersion.id,
    versionNumber: nextVersionNumber,
    versionLabel: params.versionLabel || `Added ${params.partType}`,
    orderedContributionIds: nextContributionIds,
    createdAt: timestamp,
    createdByUserId: params.contributorId,
    changelogDescription:
      params.changelog || `Added new ${params.partType} stem to v${params.parentVersion.versionNumber.toFixed(1)} mix.`,
  };

  // Rule 5: Aggregate contributions across entire lineage
  const updatedSong: Song = {
    ...params.song,
    totalLineageAdditions: params.song.totalLineageAdditions + 1,
  };

  return { updatedSong, newVersion, newContribution };
}
