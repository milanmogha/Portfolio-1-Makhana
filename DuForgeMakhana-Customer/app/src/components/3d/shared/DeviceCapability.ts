// Device capability tiers for 3D delivery (see /docs/3d-architecture.md §5).
// Never user-agent-only; based on real capability signals.

export type CapabilityTier = 'A' | 'B' | 'C';

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};

const hasWebGL = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
};

/**
 * Kill switch — 3D disabled by owner request (2026-07-08): the procedural
 * scenes don't meet the visual bar yet (real GLB/textures pending — see
 * docs/packaging-system.md). With this on, `detectTier` always returns 'C', so
 * every scene renders its existing static/2D fallback (hero image, CSS flavor
 * packet, 2D box slot grid). No 3D code is deleted — flip back to `false` to
 * restore the WebGL scenes once packaging assets land.
 */
export const DISABLE_3D = true;

/**
 * Synchronous tier detection at mount time.
 * Philosophy (conservative): only *known-strong* devices reach Tier A.
 *   • reduced motion / no WebGL            → C (static)
 *   • known constrained (memory < 4)       → C on mobile, B on desktop
 *   • small screen                         → B
 *   • known strong (memory ≥ 8, desktop)   → A
 *   • UNKNOWN capability                   → B  (never assume A)
 * `navigator.deviceMemory` is absent in Firefox/Safari, so "unknown" is common
 * — those devices get the safe mid tier, not the heaviest one.
 */
export const detectTier = (): CapabilityTier => {
  if (DISABLE_3D) return 'C'; // 3D disabled — force static/2D fallbacks everywhere
  if (typeof window === 'undefined') return 'C';
  if (prefersReducedMotion()) return 'C';
  if (!hasWebGL()) return 'C';

  const memory = (navigator as any).deviceMemory as number | undefined;
  const smallScreen = window.innerWidth < 768;

  if (memory !== undefined && memory < 4) return smallScreen ? 'C' : 'B';
  if (smallScreen) return 'B';
  if (memory !== undefined && memory >= 8) return 'A'; // known strong only
  return 'B'; // unknown or mid memory → safe mid tier
};

export const tierSettings = (tier: CapabilityTier) => ({
  // DPR capped at 1.75 even on tier A — integrated GPUs (common on laptops)
  // lose WebGL context under high-DPR multi-canvas load.
  dpr: (tier === 'A' ? [1, 1.75] : [1, 1.25]) as [number, number],
  shadows: tier === 'A',
  floaterCount: tier === 'A' ? 14 : 8,
});
