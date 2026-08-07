import * as THREE from 'three';

/**
 * Parametric pillow-pouch geometry.
 *
 * The pack used to be a `RoundedBox`. A box has a constant cross-section and
 * square corners; a real snack pouch is a *wrapped film tube* — it bulges where
 * the product sits, converges to a flat crimped fin at each seal, and creases
 * where the film gathers. That silhouette is most of what your eye uses to tell
 * "photo of a pack" from "3D primitive", so no amount of shading fixes a box.
 *
 * Construction: sweep a lens-shaped cross-section up the pouch, varying its
 * depth with height.
 *
 *   depth ── full in the belly, pinching to ~0 where the seal starts,
 *            then a thin constant fin through the crimp, closing at the edge.
 *
 * U is laid out by **arc length**, not by angle. Equal angular steps are not
 * equal distances around a lens, so an angle-based UV visibly stretches the
 * print near the side folds — and warped type on packaging is instantly read as
 * fake. The arc-length table is computed once from the belly cross-section and
 * reused at every height, which is also what physically happens: one fixed-width
 * printed web wrapped around the pouch.
 */

export interface PouchParams {
  width?: number;
  height?: number;
  depth?: number;
  /** Fraction of half-height at which the body stops and the crimp fin begins. */
  sealStart?: number;
  segU?: number;
  segV?: number;
  /** Crease/wrinkle amplitude. 0 disables (used by the cheap 'box' tier). */
  wrinkle?: number;
}

const TAU = Math.PI * 2;

/** Lens exponent: <1 fills the cross-section out, giving a soft fold at the sides. */
const LENS_P = 1.24;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Half-depth profile up the pouch. This single function is what turns a tube
 * into a pouch.
 */
function halfDepth(t: number, dMax: number, sealStart: number, sealHalf: number): number {
  if (t <= sealStart) {
    const u = t / sealStart;
    // ^0.42 keeps the belly full instead of tapering like an ellipse — a full
    // pouch is closer to a cylinder than a rugby ball.
    const body = dMax * Math.pow(Math.max(0, 1 - u * u), 0.42);
    return Math.max(sealHalf, body);
  }
  // Flat crimp fin, closing to an edge in the last few percent so the surface
  // seals without needing a cap.
  const closing = 1 - smoothstep(0.985, 1, t);
  return sealHalf * closing;
}

/** Cheap trig "noise" — same idiom as FloatingMakhana, no extra dependency. */
function crease(x: number, y: number): number {
  return (
    0.55 * Math.sin(x * 5.7 + y * 2.3) * Math.cos(y * 4.1 - x * 1.7) +
    0.30 * Math.sin(x * 11.3 - y * 7.9) +
    0.15 * Math.cos(x * 19.1 + y * 13.3)
  );
}

export function makePouchGeometry({
  width = 1.42,
  height = 2.1,
  depth = 0.5,
  sealStart = 0.8,
  segU = 64,
  segV = 72,
  wrinkle = 0.012,
}: PouchParams = {}): THREE.BufferGeometry {
  const halfW = width / 2;
  const halfH = height / 2;
  const dMax = depth / 2;
  const sealHalf = Math.min(0.016, dMax * 0.08);

  // ---- Arc-length table around the belly cross-section (for undistorted UVs).
  //
  // The sweep runs x = -halfW·cos(θ), so θ: 0→π walks the *front* face from
  // world-left to world-right while u runs 0→0.5. Sweeping the other way (the
  // obvious `+cos`) maps world-right to canvas-left and renders every word on
  // the pack mirrored — correct-looking geometry with backwards type.
  const arc: number[] = [0];
  let prevX = -halfW;
  let prevZ = 0;
  for (let i = 1; i <= segU; i++) {
    const th = (i / segU) * TAU;
    const x = -halfW * Math.cos(th);
    const s = Math.sin(th);
    const z = dMax * Math.sign(s) * Math.pow(Math.abs(s), LENS_P);
    arc.push(arc[i - 1] + Math.hypot(x - prevX, z - prevZ));
    prevX = x;
    prevZ = z;
  }
  const total = arc[segU] || 1;
  const uOf = arc.map((a) => a / total);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    const y = (v - 0.5) * height;
    const t = Math.abs(y) / halfH; // 0 belly … 1 seal edge

    const dh = halfDepth(t, dMax, sealStart, sealHalf);

    // Fin corners round off very slightly so the crimp doesn't end in a
    // perfectly square corner, which no real pack has.
    const wScale = 1 - 0.06 * smoothstep(0.94, 1, t);

    // Crimp teeth: parallel ridges running across the fin. Only inside the seal.
    const inSeal = t > sealStart ? (t - sealStart) / (1 - sealStart) : 0;
    const teeth = inSeal > 0 ? Math.sin(inSeal * Math.PI * 9) * 0.010 * (1 - inSeal * 0.4) : 0;

    // The film gathers as it converges into the seal, so creases strengthen
    // toward the top and bottom rather than being uniform.
    const gather = 0.35 + 0.65 * smoothstep(0.4, 0.98, t);

    for (let i = 0; i <= segU; i++) {
      const th = (i / segU) * TAU;
      const s = Math.sin(th);
      const zs = s >= 0 ? 1 : -1;
      const lens = Math.pow(Math.abs(s), LENS_P);

      const x = -halfW * wScale * Math.cos(th);

      let zMag = dh * lens;
      // Crimp + wrinkles fade out at the side folds (|s|→0), where the film is
      // pulled tight and has nothing to crumple into.
      zMag += teeth * Math.pow(Math.abs(s), 0.5);
      if (wrinkle > 0) {
        zMag += wrinkle * gather * crease(x * 3.1, y * 2.7) * Math.pow(Math.abs(s), 0.7);
      }

      positions.push(x, y, zs * Math.max(0, zMag));
      uvs.push(uOf[i], v);
    }
  }

  const cols = segU + 1;
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setIndex(indices);
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  // The seal rows collapse to zero-area triangles; they contribute nothing to
  // the normals and simply close the surface.
  g.computeBoundingSphere();
  return g;
}

/** Tier presets — segment counts are the only thing that scales with device. */
export const POUCH_TIERS = {
  hero: { segU: 72, segV: 80, wrinkle: 0.013 },
  viewer: { segU: 64, segV: 72, wrinkle: 0.012 },
  box: { segU: 24, segV: 24, wrinkle: 0.004 },
  fallback: { segU: 16, segV: 16, wrinkle: 0 },
} as const;
