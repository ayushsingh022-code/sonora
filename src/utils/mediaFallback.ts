/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bundled local demo videos from /public/videos/
 * Guaranteed to be available offline and locally in the prototype.
 */
export const LOCAL_DEMO_VIDEOS = {
  collab: '/videos/demo-collab-splitscreen.mp4',
  guitar: '/videos/guitar-take.mp4',
  vocals: '/videos/vocals-take.mp4',
  bass: '/videos/bass-take.mp4',
  drums: '/videos/drums-take.mp4',
  keys: '/videos/keys-take.mp4',
} as const;

export const DEFAULT_FALLBACK_VIDEO = LOCAL_DEMO_VIDEOS.collab;

/**
 * Resolves the most appropriate bundled video based on instrument, tags, or collaboration role.
 */
export function getLocalFallbackVideo(partType?: string, isCollab?: boolean): string {
  if (isCollab) {
    return LOCAL_DEMO_VIDEOS.collab;
  }

  const normalized = (partType || '').trim().toLowerCase();

  if (
    normalized.includes('guitar') ||
    normalized.includes('gtr') ||
    normalized.includes('riff') ||
    normalized.includes('stratocaster')
  ) {
    return LOCAL_DEMO_VIDEOS.guitar;
  }

  if (
    normalized.includes('vocal') ||
    normalized.includes('vox') ||
    normalized.includes('sing') ||
    normalized.includes('harmony') ||
    normalized.includes('topline')
  ) {
    return LOCAL_DEMO_VIDEOS.vocals;
  }

  if (normalized.includes('bass') || normalized.includes('groove') || normalized.includes('pocket')) {
    return LOCAL_DEMO_VIDEOS.bass;
  }

  if (
    normalized.includes('drum') ||
    normalized.includes('beat') ||
    normalized.includes('percussion') ||
    normalized.includes('tempo')
  ) {
    return LOCAL_DEMO_VIDEOS.drums;
  }

  if (
    normalized.includes('key') ||
    normalized.includes('piano') ||
    normalized.includes('rhodes') ||
    normalized.includes('synth') ||
    normalized.includes('organ')
  ) {
    return LOCAL_DEMO_VIDEOS.keys;
  }

  return LOCAL_DEMO_VIDEOS.collab;
}

/**
 * Determines whether a URL is already a reliable bundled local video
 */
export function isLocalBundledVideo(url?: string | null): boolean {
  if (!url) return false;
  return Object.values(LOCAL_DEMO_VIDEOS).some((path) => url.includes(path));
}
