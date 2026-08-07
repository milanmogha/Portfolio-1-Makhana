import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { makePouchGeometry, POUCH_TIERS } from './pouchGeometry';
import { makeFoilNormalMap, makeFoilNoiseCanvas } from './foilMaps';

export interface PacketColors {
  body: string;      // main pouch color
  accent: string;    // seal band + label accents
  label: string;     // label panel background
}

/** Fidelity tiers — hero/viewer get the full foil treatment; box/fallback stay cheap. */
export type PacketQuality = 'hero' | 'viewer' | 'box' | 'fallback';

interface PacketModelProps {
  colors?: PacketColors;
  scale?: number;
  float?: boolean;
  flavorName?: string;       // printed on the label
  quality?: PacketQuality;
  /** @deprecated use quality="box" — kept for backward compatibility. */
  simple?: boolean;
}

const DEFAULT_COLORS: PacketColors = {
  body: '#1C4A3E',
  accent: '#D99A2B',
  label: '#FAF7F0',
};

/* ------------------------------------------------------------------------- *
 * Wrap maps
 *
 * The pouch is one continuous printed film, so it gets one continuous texture:
 * the front artwork occupies u 0–0.5 and the back u 0.5–1, matching the
 * arc-length UVs from pouchGeometry.
 *
 * Three channels are painted from the *same shapes*, because a real pack is not
 * one material — it's three, and a single flat `metalness` cannot express that:
 *
 *   colour     what you see
 *   metalness  the gold accents are a real foil stamp (≈1.0); the body is ink
 *              over metallised film, so it keeps a sheen (≈0.45); the cream
 *              label panel is matte ink sitting on top of it (≈0.05)
 *   roughness  the panel is paper-matte, the foil stamp is near-mirror
 *
 * That metalness split is what sells "premium snack pouch" instead of "green
 * plastic box": the gold has to catch the light differently from the panel
 * right next to it, and one uniform material can never do that.
 * ------------------------------------------------------------------------- */

const WRAP_W = 1024;
const WRAP_H = 720;
const FACE_W = 512;

type Channel = 'color' | 'metal' | 'rough';

interface Palette {
  body: string;
  panel: string;
  accent: string;
  onPanel: string;   // type printed on the cream panel
  subdued: string;   // secondary type
  bowl: string;
  bowlEdge: string;
  onAccent: string;
}

function palette(ch: Channel, c: PacketColors): Palette {
  if (ch === 'color') {
    return {
      body: c.body,
      panel: c.label,
      accent: c.accent,
      onPanel: c.body,
      subdued: 'rgba(60,60,50,0.75)',
      bowl: '#F1E6D0',
      bowlEdge: 'rgba(120,100,70,0.25)',
      onAccent: c.body,
    };
  }
  if (ch === 'metal') {
    // grey level = metalness. Foil stamp bright, film body mid, printed ink dark.
    return {
      body: '#737373',
      panel: '#0d0d0d',
      accent: '#ffffff',
      onPanel: '#0d0d0d',
      subdued: '#0d0d0d',
      bowl: '#0d0d0d',
      bowlEdge: '#0d0d0d',
      onAccent: '#4d4d4d',
    };
  }
  // grey level = roughness. Panel matte, foil stamp polished.
  return {
    body: '#6b6b6b',
    panel: '#cccccc',
    accent: '#3d3d3d',
    onPanel: '#cccccc',
    subdued: '#cccccc',
    bowl: '#d6d6d6',
    bowlEdge: '#cccccc',
    onAccent: '#4a4a4a',
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** Printed front. `ox` is the horizontal origin of this face inside the wrap. */
function drawFront(ctx: CanvasRenderingContext2D, ox: number, p: Palette, flavorName: string) {
  const W = FACE_W;
  const H = WRAP_H;
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = p.body;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = p.panel;
  roundRect(ctx, 56, 96, W - 112, H - 230, 34);

  ctx.fillStyle = p.accent;
  ctx.fillRect(0, 0, W, 56);
  ctx.textAlign = 'center';

  ctx.fillStyle = p.onPanel;
  ctx.font = '700 32px Georgia, serif';
  ctx.fillText('MAKHANA E-STORE', W / 2, 168);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 130, 190);
  ctx.lineTo(W / 2 + 130, 190);
  ctx.stroke();

  // Bowl illustration
  const cx = W / 2;
  const cy = 358;
  ctx.fillStyle = p.bowl;
  const heap = [
    [0, -36, 40], [-52, -14, 34], [52, -14, 34], [-24, -44, 30],
    [24, -44, 30], [0, 0, 42], [-58, 16, 30], [58, 16, 30],
  ];
  heap.forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, rr, rr * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.bowlEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 42, 120, 34, 0, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = p.onPanel;
  ctx.font = '800 52px Georgia, serif';
  ctx.fillText(flavorName.toUpperCase(), W / 2, 512);

  ctx.fillStyle = p.subdued;
  ctx.font = '500 24px Arial, sans-serif';
  ctx.fillText('Roasted Fox Nuts · Never Fried', W / 2, 552);

  ctx.fillStyle = p.accent;
  ctx.fillRect(0, H - 88, W, 88);
  ctx.fillStyle = p.onAccent;
  ctx.font = '700 26px Arial, sans-serif';
  ctx.fillText('PREMIUM QUALITY', W / 2, H - 34);

  ctx.restore();
}

/** Printed back — brand + neutral copy only (no fabricated nutrition). */
function drawBack(ctx: CanvasRenderingContext2D, ox: number, p: Palette) {
  const W = FACE_W;
  const H = WRAP_H;
  ctx.save();
  ctx.translate(ox, 0);

  ctx.fillStyle = p.body;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.accent;
  ctx.fillRect(0, 0, W, 56);
  ctx.fillRect(0, H - 56, W, 56);

  ctx.textAlign = 'center';
  ctx.fillStyle = p.panel;
  ctx.font = '700 30px Georgia, serif';
  ctx.fillText('MAKHANA E-STORE', W / 2, H / 2 - 30);
  ctx.font = '500 22px Arial, sans-serif';
  ctx.fillText('Roasted, never fried fox nuts.', W / 2, H / 2 + 12);
  ctx.fillStyle = p.subdued;
  ctx.font = '400 18px Arial, sans-serif';
  ctx.fillText('Nutrition & ingredients printed on pack.', W / 2, H / 2 + 52);

  ctx.restore();
}

function makeWrapTexture(
  ch: Channel,
  colors: PacketColors,
  flavorName: string,
  noise: HTMLCanvasElement | null
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = WRAP_W;
  c.height = WRAP_H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  const p = palette(ch, colors);
  drawFront(ctx, 0, p, flavorName);
  drawBack(ctx, FACE_W, p);

  // Break the roughness up with the crinkle. Uniform roughness cannot glint, and
  // a glint travelling across the film as the pack turns is the single strongest
  // cue that reads as "foil" rather than "paint".
  if (ch === 'rough' && noise) {
    const pat = ctx.createPattern(noise, 'repeat');
    if (pat) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, WRAP_W, WRAP_H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  // Only the colour channel is colour. Tagging the data maps as sRGB would bend
  // their values through the transfer curve and quietly wreck the shading.
  tex.colorSpace = ch === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural makhana pouch v4 — a swept pillow pouch (not a box), lit by the
 * studio IBL in StudioEnvironment, surfaced as printed metallised film.
 *
 * Still asset-free by design: every map is drawn at runtime, so the pack ships
 * with zero downloads and re-colours per flavour for free. Swappable for a
 * commissioned GLB later without changing the props contract.
 */
export default function PacketModel({
  colors = DEFAULT_COLORS,
  scale = 1,
  float = true,
  flavorName = 'Classic',
  quality = 'hero',
  simple = false,
}: PacketModelProps) {
  const group = useRef<THREE.Group>(null);
  const t0 = useMemo(() => Math.random() * Math.PI * 2, []);

  const q: PacketQuality = simple ? 'box' : quality;
  const detailed = q === 'hero' || q === 'viewer';

  const geometry = useMemo(() => makePouchGeometry(POUCH_TIERS[q]), [q]);
  const noise = useMemo(() => (detailed ? makeFoilNoiseCanvas() : null), [detailed]);

  const colorMap = useMemo(
    () => (detailed ? makeWrapTexture('color', colors, flavorName, null) : null),
    [detailed, colors.body, colors.accent, colors.label, flavorName] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const roughnessMap = useMemo(
    () => (detailed ? makeWrapTexture('rough', colors, flavorName, noise) : null),
    [detailed, noise, colors.body, colors.accent, colors.label, flavorName] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const metalnessMap = useMemo(
    () => (detailed ? makeWrapTexture('metal', colors, flavorName, null) : null),
    [detailed, colors.body, colors.accent, colors.label, flavorName] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const normalMap = useMemo(() => {
    if (!detailed) return null;
    const n = makeFoilNormalMap();
    n.repeat.set(3, 3);
    return n;
  }, [detailed]);

  // Explicit GPU cleanup — geometries and textures are not GC-managed.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => colorMap?.dispose(), [colorMap]);
  useEffect(() => () => roughnessMap?.dispose(), [roughnessMap]);
  useEffect(() => () => metalnessMap?.dispose(), [metalnessMap]);
  useEffect(() => () => normalMap?.dispose(), [normalMap]);

  useFrame(({ clock }) => {
    if (!group.current || !float) return;
    const t = clock.getElapsedTime() + t0;
    group.current.position.y = Math.sin(t * 0.8) * 0.05;
    group.current.rotation.z = Math.sin(t * 0.5) * 0.025;
  });

  return (
    <group ref={group} scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        {detailed ? (
          // Physical rather than Standard: the clearcoat *is* the laminate — a
          // thin gloss layer whose highlight sits on top of the print instead of
          // taking its colour. That's the difference between a laminated pack
          // and a paper bag.
          <meshPhysicalMaterial
            map={colorMap ?? undefined}
            normalMap={normalMap ?? undefined}
            normalScale={new THREE.Vector2(0.55, 0.55)}
            roughnessMap={roughnessMap ?? undefined}
            metalnessMap={metalnessMap ?? undefined}
            // The maps carry the actual values; these are the multipliers they scale.
            roughness={1}
            metalness={1}
            clearcoat={0.45}
            clearcoatRoughness={0.24}
            envMapIntensity={1.15}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color={colors.body}
            roughness={0.45}
            metalness={0.3}
            envMapIntensity={1}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </group>
  );
}
