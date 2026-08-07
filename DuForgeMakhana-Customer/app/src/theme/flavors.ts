// ============================================================================
// PRANA — centralized flavor identity (single source of truth)
// ============================================================================
// Every flavor-aware surface consumes THIS module: the Flavor Universe HTML
// controls, the 3D packet (body/accent/label + rim light), the CSS atmosphere
// (data-flavor), the Build-Your-Box slot accents, and the static fallbacks.
// Do NOT re-declare flavor colors anywhere else.
//
// Honesty note: CTAs route to the real "Flavored Makhana" catalog category —
// there are no per-flavor SKUs yet, so `flavorQuery` stays undefined until the
// catalog exposes flavor-level filtering. No fabricated SKUs.

export type FlavorId =
  | 'classic'
  | 'peri-peri'
  | 'pudina'
  | 'cheese'
  | 'himalayan-salt'
  | 'tangy-masala'
  | 'caramel';

export interface FlavorColors {
  /** Main pouch body / dominant brand color. */
  body: string;
  /** Seal band + label accents + UI chip color. */
  accent: string;
  /** Printed label panel background. */
  label: string;
  /** Section atmosphere background (CSS --flavor-bg). */
  atmosphere: string;
  /** Readable foreground on the atmosphere (CSS --flavor-deep). AA on atmosphere. */
  foreground: string;
  /** Warm rim-light color for the 3D scene (lifts the pouch silhouette). */
  rim: string;
}

export interface FlavorTheme {
  id: FlavorId;
  name: string;
  tagline: string;
  /** Real catalog category the CTA points at (honest — no fabricated SKUs). */
  categoryQuery: string;
  /** Per-flavor catalog filter — undefined until flavor-level SKUs exist. */
  flavorQuery?: string;
  colors: FlavorColors;
  /** Optional real assets when a Blender/texture pass lands (see packaging-system.md). */
  assets?: {
    packTexture?: string;
    staticPack?: string;
  };
}

export const FLAVORS: FlavorTheme[] = [
  {
    id: 'classic', name: 'Classic', tagline: 'Lightly salted, endlessly crunchable.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#173F35', accent: '#EEE7DA', label: '#FAF7F0', atmosphere: '#F6F1E7', foreground: '#173F35', rim: '#Eadfc4' },
  },
  {
    id: 'peri-peri', name: 'Peri Peri', tagline: 'A slow-building kick with warm smoke.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#8F3B24', accent: '#C96545', label: '#FAF0EA', atmosphere: '#F6E9E2', foreground: '#7A2F1B', rim: '#F0A070' },
  },
  {
    id: 'pudina', name: 'Pudina', tagline: 'Cool mint over botanical green.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#2C5A3D', accent: '#6E9A72', label: '#EFF6EC', atmosphere: '#EAF1E6', foreground: '#234C32', rim: '#A6D0A2' },
  },
  {
    id: 'cheese', name: 'Cheese', tagline: 'Golden, creamy, dangerously moreish.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#9A6D14', accent: '#D99A2B', label: '#FBF3DF', atmosphere: '#F9F0DC', foreground: '#7C5710', rim: '#F5C766' },
  },
  {
    id: 'himalayan-salt', name: 'Himalayan Salt', tagline: 'Mineral pink salt, nothing else.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#7A5350', accent: '#D8A8A0', label: '#F9EFED', atmosphere: '#F7ECEA', foreground: '#5F413F', rim: '#E8C3BC' },
  },
  {
    id: 'tangy-masala', name: 'Tangy Masala', tagline: 'Street-style spice with a citrus snap.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#8F4A14', accent: '#D97B2B', label: '#FAF0E2', atmosphere: '#F8EDDF', foreground: '#743A10', rim: '#F2A65A' },
  },
  {
    id: 'caramel', name: 'Caramel', tagline: 'Amber-sweet crunch for dessert hours.',
    categoryQuery: 'Flavored Makhana',
    colors: { body: '#5C3D1E', accent: '#B9812F', label: '#F8F0E2', atmosphere: '#F5EBDC', foreground: '#4A3018', rim: '#DCB472' },
  },
];

export const getFlavor = (id: FlavorId): FlavorTheme =>
  FLAVORS.find((f) => f.id === id) ?? FLAVORS[0];

/** Deterministic accent palette for Build-Your-Box slots (visual identity only). */
export const FLAVOR_ACCENTS: string[] = FLAVORS.map((f) => f.colors.accent);

/** Build a catalog URL for a flavor's CTA (honest: category-level until SKUs exist). */
export const flavorCtaHref = (f: FlavorTheme): string => {
  const params = new URLSearchParams({ category: f.categoryQuery });
  if (f.flavorQuery) params.set('flavor', f.flavorQuery);
  return `/products?${params.toString()}`;
};
