import * as THREE from 'three';

/**
 * Procedural laminated-foil surface maps — crinkle normals + broken roughness.
 *
 * Why this exists: the pouch used a flat `roughness=0.42, metalness=0.06`. That
 * pair *is* the PBR fingerprint of matte plastic. A snack pouch is metallised
 * film — semi-metallic, and covered in fine creases that shatter its reflection
 * into moving glints. Uniform roughness cannot produce a glint, so the pack read
 * as a painted brick however the lights were moved.
 *
 * Canvas-generated to stay consistent with the rest of this system: no
 * downloads, no CDN, works offline and behind the funnel. ~8ms for 256².
 */

const SIZE = 256;
const PERIOD = 8; // lattice period — keeps the noise tileable so it can repeat

/* Periodic value noise. The modulo on the lattice coords is what makes the
   result seamless; without it the repeat seam shows as a hard line on the pack. */
function hash(ix: number, iy: number): number {
  const x = ((ix % PERIOD) + PERIOD) % PERIOD;
  const y = ((iy % PERIOD) + PERIOD) % PERIOD;
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/**
 * Ridged fBm. Plain fBm gives soft dunes — foil creases are *sharp*, so each
 * octave is folded (`1 - |2n-1|`) and sharpened, which turns the smooth hills
 * into knife-edged folds. This is the difference between "crumpled cloth" and
 * "crumpled foil".
 */
function ridged(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(x * freq, y * freq);
    const fold = 1 - Math.abs(2 * n - 1);
    sum += amp * Math.pow(fold, 2.2);
    norm += amp;
    amp *= 0.55;
    freq *= 2;
  }
  return sum / norm;
}

/** Height field the normal + roughness maps are both derived from. */
function heightField(): Float32Array {
  const h = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x / SIZE) * PERIOD;
      const v = (y / SIZE) * PERIOD;
      // Coarse folds (the big crumple) + a fine grain (the film's texture).
      const coarse = ridged(u, v, 4);
      const fine = ridged(u * 3.7 + 11.3, v * 3.7 + 7.1, 2);
      h[y * SIZE + x] = coarse * 0.78 + fine * 0.22;
    }
  }
  return h;
}

/**
 * Crinkle normal map. Central differences on the height field, packed to RGB.
 * `strength` stays low — real pouch creases are shallow; overdriving this is the
 * classic tell of a fake CG foil (it starts looking like hammered metal).
 */
export function makeFoilNormalMap(strength = 1.6): THREE.DataTexture {
  const h = heightField();
  const data = new Uint8Array(SIZE * SIZE * 4);
  const at = (x: number, y: number) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      // Normalise (-dx, -dy, 1) into tangent space and pack to 0..255.
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * SIZE + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      data[i + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace; // normals are data, not colour — sRGB here would skew them
  tex.needsUpdate = true;
  return tex;
}

/**
 * Roughness map. Creases polish where the film is stretched and dull in the
 * troughs, so roughness *varies* across the surface — that variance is what
 * makes highlights break up into glints as the pack rotates.
 */
export function makeFoilRoughnessMap(min = 0.16, max = 0.52): THREE.DataTexture {
  const h = heightField();
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    // High ground (a crease ridge) = stretched, polished, low roughness.
    const r = max - (max - min) * Math.pow(h[i], 1.4);
    const v = Math.max(0, Math.min(255, r * 255));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The crinkle as a plain grayscale canvas, so callers can composite it into a
 * larger map with `createPattern` instead of re-running the noise at print
 * resolution. Tiling 256² through the 2D context costs nothing; generating
 * 1024×720 of ridged fBm in JS would stall a phone for ~100ms at mount.
 */
export function makeFoilNoiseCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const h = heightField();
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = Math.max(0, Math.min(255, h[i] * 255));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Both maps share one height field, so build them together and let callers
 * dispose them as a pair.
 */
export function makeFoilMaps(repeat = 2) {
  const normalMap = makeFoilNormalMap();
  const roughnessMap = makeFoilRoughnessMap();
  normalMap.repeat.set(repeat, repeat);
  roughnessMap.repeat.set(repeat, repeat);
  return { normalMap, roughnessMap };
}
