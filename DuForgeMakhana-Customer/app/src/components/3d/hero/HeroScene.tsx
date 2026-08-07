import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import PacketModel from '../shared/PacketModel';
import FloatingMakhana from '../shared/FloatingMakhana';
import StudioEnvironment from '../shared/StudioEnvironment';
import { tierSettings, type CapabilityTier } from '../shared/DeviceCapability';

/** Gentle pointer-reactive rotation — clamped, no camera chaos. */
function PointerRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!group.current) return;
    const targetY = THREE.MathUtils.clamp(pointer.x * 0.28, -0.35, 0.35);
    const targetX = THREE.MathUtils.clamp(-pointer.y * 0.16, -0.2, 0.2);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06);
  });
  return <group ref={group}>{children}</group>;
}

interface HeroSceneProps {
  tier: Exclude<CapabilityTier, 'C'>;
  onContextLost?: () => void;
}

/**
 * Phase-12 hero scene. Decorative only (canvas is aria-hidden by the mount
 * wrapper); all copy/CTAs live in semantic HTML next to it.
 */
export default function HeroScene({ tier, onContextLost }: HeroSceneProps) {
  const settings = tierSettings(tier);

  return (
    <Canvas
      dpr={settings.dpr}
      camera={{ position: [0, 0.2, 4.4], fov: 38 }}
      shadows={settings.shadows}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        // Raw linear output blows the foil highlights to flat white and washes
        // the greens. ACES rolls the highlights off the way a camera does — it
        // is most of why a render reads as "photographed" rather than "rendered".
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
      {/* The IBL now carries the lighting: it's what the pouch's specular
          actually reflects. The punctual lights below only shape it — hence the
          much lower intensities than the old ambient-heavy rig. */}
      <StudioEnvironment
        intensity={tier === 'A' ? 1 : 0.85}
        resolution={tier === 'A' ? 256 : 128}
      />

      {/* Kept solely to cast the key shadow — the environment can't. */}
      <directionalLight
        position={[4, 5, 6]}
        intensity={0.85}
        castShadow={settings.shadows}
        shadow-mapSize={[1024, 1024]}
      />
      {/* Small warm bounce, so the fox nuts don't go flat on the shadow side. */}
      <directionalLight position={[-5, 3, -4]} intensity={0.25} color="#F0C070" />

      <PointerRig>
        <PacketModel scale={1.05} flavorName="Classic" />
        <FloatingMakhana count={settings.floaterCount} />
      </PointerRig>

      <ContactShadows position={[0, -1.55, 0]} opacity={0.32} scale={7} blur={2.6} far={2.2} />
    </Canvas>
  );
}
