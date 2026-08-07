import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import PacketModel, { type PacketColors } from '../shared/PacketModel';
import StudioEnvironment from '../shared/StudioEnvironment';
import { tierSettings, type CapabilityTier } from '../shared/DeviceCapability';

/** Gentle idle turn so the packet feels alive without user input. */
function IdleTurn({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const idle = Math.sin(clock.getElapsedTime() * 0.35) * 0.3;
    const target = idle + THREE.MathUtils.clamp(pointer.x * 0.25, -0.3, 0.3);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target, 0.05);
  });
  return <group ref={group}>{children}</group>;
}

interface FlavorSceneProps {
  tier: Exclude<CapabilityTier, 'C'>;
  colors: PacketColors;
  flavorName: string;
  /** Per-flavor rim-light color (from theme/flavors). */
  rim?: string;
  onContextLost?: () => void;
}

export default function FlavorScene({ tier, colors, flavorName, rim, onContextLost }: FlavorSceneProps) {
  const settings = tierSettings(tier);
  return (
    <Canvas
      dpr={settings.dpr}
      camera={{ position: [0, 0.15, 4.2], fov: 38 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onContextLost?.();
        });
      }}
    >
      {/* Studio IBL does the lighting; the per-flavour rim below is the only
          light that still carries "atmosphere", and it stays punctual so each
          flavour keeps its own coloured edge. */}
      <StudioEnvironment
        intensity={tier === 'A' ? 0.95 : 0.8}
        resolution={tier === 'A' ? 256 : 128}
      />
      <directionalLight position={[4, 5, 6]} intensity={0.8} />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color={rim || colors.accent} />
      <IdleTurn>
        {/* key remount per flavor → label texture regenerates + disposes cleanly */}
        <PacketModel key={flavorName} colors={colors} scale={1.12} float flavorName={flavorName} quality="hero" />
      </IdleTurn>
      <ContactShadows position={[0, -1.55, 0]} opacity={0.32} scale={6} blur={2.4} far={2} />
    </Canvas>
  );
}
