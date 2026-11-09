export const HUB = {
  /**
   * Markers closer than this (in rendered px) share a numbered cluster badge.
   * Equal to the minimum touch target, so marker hit areas never overlap.
   */
  clusterRadiusPx: 44,
  /** D4 (proposed, not yet confirmed): recovering these unlocks Mars. */
  marsUnlockIds: ['apollo-11-site', 'apollo-15-lrv', 'surveyor-3'],
} as const;
