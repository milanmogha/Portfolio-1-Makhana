// TEMPORARY — the previous (v3) pack, kept only so the preview route can show a
// true before/after. Delete along with app/preview-3d/.
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

export interface PacketColors {
  body: string;
  accent: string;
  label: string;
}

const DEFAULT_COLORS: PacketColors = {
  body: '#1C4A3E',
  accent: '#D99A2B',
  label: '#FAF7F0',
};

function makeLabelTexture(colors: PacketColors, flavorName: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const W = 512, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = colors.body;
  ctx.fillRect(0, 0, W, H);

  const px = 56, py = 96, pw = W - 112, ph = H - 230, r = 34;
  ctx.beginPath();
  ctx.moveTo(px + r, py);
  ctx.arcTo(px + pw, py, px + pw, py + ph, r);
  ctx.arcTo(px + pw, py + ph, px, py + ph, r);
  ctx.arcTo(px, py + ph, px, py, r);
  ctx.arcTo(px, py, px + pw, py, r);
  ctx.closePath();
  ctx.fillStyle = colors.label;
  ctx.fill();

  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, W, 56);
  ctx.textAlign = 'center';

  ctx.fillStyle = colors.body;
  ctx.font = '700 32px Georgia, serif';
  ctx.fillText('MAKHANA E-STORE', W / 2, 168);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 130, 190);
  ctx.lineTo(W / 2 + 130, 190);
  ctx.stroke();

  const cx = W / 2, cy = 358;
  ctx.fillStyle = '#F1E6D0';
  const heap = [[0, -36, 40], [-52, -14, 34], [52, -14, 34], [-24, -44, 30], [24, -44, 30], [0, 0, 42], [-58, 16, 30], [58, 16, 30]];
  heap.forEach(([dx, dy, rr]) => {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, rr, rr * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 42, 120, 34, 0, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = colors.body;
  ctx.font = '800 52px Georgia, serif';
  ctx.fillText(flavorName.toUpperCase(), W / 2, 512);

  ctx.fillStyle = 'rgba(60,60,50,0.75)';
  ctx.font = '500 24px Arial, sans-serif';
  ctx.fillText('Roasted Fox Nuts · Never Fried', W / 2, 552);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, H - 88, W, 88);
  ctx.fillStyle = colors.body;
  ctx.font = '700 26px Arial, sans-serif';
  ctx.fillText('PREMIUM QUALITY', W / 2, H - 34);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCurvedPanel(w: number, h: number, bulge: number, segX: number, segY: number) {
  const g = new THREE.PlaneGeometry(w, h, segX, segY);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / (w / 2);
    const ny = pos.getY(i) / (h / 2);
    const z = (1 - nx * nx * 0.9) * (1 - ny * ny * 0.35) * bulge;
    pos.setZ(i, Math.max(0, z));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export default function LegacyPacket({
  colors = DEFAULT_COLORS,
  scale = 1,
  float = true,
  flavorName = 'Classic',
}: {
  colors?: PacketColors;
  scale?: number;
  float?: boolean;
  flavorName?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const t0 = useMemo(() => Math.random() * Math.PI * 2, []);

  const labelTexture = useMemo(() => makeLabelTexture(colors, flavorName), [colors, flavorName]);
  const frontGeo = useMemo(() => makeCurvedPanel(1.3, 1.86, 0.14, 24, 28), []);

  useEffect(() => () => labelTexture?.dispose(), [labelTexture]);
  useEffect(() => () => frontGeo.dispose(), [frontGeo]);

  useFrame(({ clock }) => {
    if (!group.current || !float) return;
    const t = clock.getElapsedTime() + t0;
    group.current.position.y = Math.sin(t * 0.8) * 0.05;
    group.current.rotation.z = Math.sin(t * 0.5) * 0.025;
  });

  return (
    <group ref={group} scale={scale}>
      <RoundedBox args={[1.42, 1.98, 0.46]} radius={0.17} smoothness={4} castShadow>
        <meshStandardMaterial color={colors.body} roughness={0.42} metalness={0.06} />
      </RoundedBox>
      <mesh geometry={frontGeo} position={[0, 0, 0.225]}>
        {labelTexture ? (
          <meshStandardMaterial map={labelTexture} roughness={0.44} metalness={0.04} />
        ) : (
          <meshStandardMaterial color={colors.label} roughness={0.6} />
        )}
      </mesh>
      <mesh position={[0, 1.06, 0]} castShadow>
        <boxGeometry args={[1.34, 0.14, 0.1]} />
        <meshStandardMaterial color={colors.accent} roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.985, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.28]} />
        <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, -1.03, 0]}>
        <boxGeometry args={[1.36, 0.1, 0.5]} />
        <meshStandardMaterial color={colors.accent} roughness={0.45} metalness={0.12} />
      </mesh>
    </group>
  );
}
