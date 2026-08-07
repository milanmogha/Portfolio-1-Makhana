import React, { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import PacketModel, { type PacketColors } from '../shared/PacketModel';
import StudioEnvironment from '../shared/StudioEnvironment';
import { tierSettings, type CapabilityTier } from '../shared/DeviceCapability';

interface Viewer360Props {
  tier: Exclude<CapabilityTier, 'C'>;
  colors?: PacketColors;
  /** Accessible description of what is being previewed. */
  label?: string;
}

/**
 * Interactive 3D packaging preview — drag to rotate, constrained zoom, and
 * smoothly-interpolated Front/Side/Back/Reset presets. Honest naming: this is
 * an interactive preview of the procedural pack, not a photographic full-360
 * product inspection (there is no real product photography behind it yet).
 */
function PresetRig({ controls, targetRef }: { controls: React.RefObject<OrbitControlsImpl | null>; targetRef: React.MutableRefObject<number | null> }) {
  useFrame(() => {
    const c = controls.current;
    const target = targetRef.current;
    if (!c || target === null) return;
    const cur = c.getAzimuthalAngle();
    if (Math.abs(cur - target) < 0.008) {
      targetRef.current = null; // reached — release so the user can drag freely
      return;
    }
    c.setAzimuthalAngle(THREE.MathUtils.lerp(cur, target, 0.18));
    c.update();
  });
  return null;
}

export default function Viewer360({ tier, colors, label = 'Interactive 3D packaging preview' }: Viewer360Props) {
  const settings = tierSettings(tier);
  const controls = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef<number | null>(null);

  const goTo = (angle: number) => { targetRef.current = angle; };
  const reset = () => { targetRef.current = null; controls.current?.reset(); };

  return (
    <div className="viewer360" role="group" aria-label={label}>
      <p className="sr-only">
        Drag to rotate the 3D pack, or use the Front, Side, Back and Reset buttons below.
        This is a decorative preview; product photos and details are listed on the page.
      </p>

      <div className="viewer360-stage" aria-hidden="true">
        <Canvas
          dpr={settings.dpr}
          camera={{ position: [0, 0.2, 4.2], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          style={{ background: 'transparent', touchAction: 'none' }}
        >
          {/* This is the scene that most needs the IBL: the whole point of the
              viewer is turning the pack, and it's the *travel* of the streak
              highlights across the foil as it rotates that reads as a real
              object. Diffuse-only lighting stays static under rotation. */}
          <StudioEnvironment
            intensity={tier === 'A' ? 1 : 0.85}
            resolution={tier === 'A' ? 256 : 128}
          />
          <directionalLight position={[4, 5, 6]} intensity={0.8} />
          <directionalLight position={[-4, 2, -3]} intensity={0.22} color="#F0C070" />
          <Suspense fallback={null}>
            <PacketModel colors={colors} scale={1.15} float={false} quality="viewer" />
          </Suspense>
          <ContactShadows position={[0, -1.55, 0]} opacity={0.32} scale={6} blur={2.4} far={2} />
          <OrbitControls
            ref={controls}
            enablePan={false}
            minDistance={2.8}
            maxDistance={6}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.7}
            autoRotate={false}
          />
          <PresetRig controls={controls} targetRef={targetRef} />
        </Canvas>
      </div>

      <div className="viewer360-controls">
        <button type="button" onClick={() => goTo(0)} className="viewer360-btn" aria-label="View pack front">Front</button>
        <button type="button" onClick={() => goTo(Math.PI / 2)} className="viewer360-btn" aria-label="View pack side">Side</button>
        <button type="button" onClick={() => goTo(Math.PI)} className="viewer360-btn" aria-label="View pack back">Back</button>
        <button type="button" onClick={reset} className="viewer360-btn" aria-label="Reset view">Reset</button>
      </div>
    </div>
  );
}
