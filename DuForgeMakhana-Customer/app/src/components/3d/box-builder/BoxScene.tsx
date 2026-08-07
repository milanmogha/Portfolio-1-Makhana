import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import PacketModel from '../shared/PacketModel';
import StudioEnvironment from '../shared/StudioEnvironment';
import { tierSettings, type CapabilityTier } from '../shared/DeviceCapability';

export interface BoxSlotItem {
  id: string;
  color: string; // accent color per selected product
}

interface BoxSceneProps {
  tier: Exclude<CapabilityTier, 'C'>;
  capacity: number;      // box size (4/6/8/12)
  items: BoxSlotItem[];  // flattened selections, length ≤ capacity
}

/** Gentle pointer tilt for the whole composition. */
function TiltRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      THREE.MathUtils.clamp(pointer.x * 0.35, -0.4, 0.4),
      0.06
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      0.42 + THREE.MathUtils.clamp(-pointer.y * 0.08, -0.1, 0.1),
      0.06
    );
  });
  return <group ref={group} rotation={[0.42, 0, 0]}>{children}</group>;
}

/** Open gift box built from solid boxes — thick walls + slot dividers so it
 *  reads as a real compartmentalized box, not thin wireframe edges. */
function Tray({ cols, rows }: { cols: number; rows: number }) {
  const cellW = 1.05, cellD = 0.62;
  const wall = 0.14;          // thick, substantial walls
  const h = 0.62;
  const w = cols * cellW + wall * 2;
  const d = rows * cellD + wall * 2;
  const wood = '#173F35';
  const cream = '#EEE7DA';
  const woodMat = <meshStandardMaterial color={wood} roughness={0.5} metalness={0.04} />;
  const dividerMat = <meshStandardMaterial color={cream} roughness={0.85} />;

  // Interior divider rails (between cells), sitting on the padded base.
  const dividers: React.ReactElement[] = [];
  for (let c = 1; c < cols; c++) {
    const x = (c - cols / 2) * cellW;
    dividers.push(
      <mesh key={`vx${c}`} position={[x, -0.08, 0]}>
        <boxGeometry args={[0.04, h * 0.5, d - wall * 2]} />
        {dividerMat}
      </mesh>
    );
  }
  for (let r = 1; r < rows; r++) {
    const z = (r - rows / 2) * cellD;
    dividers.push(
      <mesh key={`vz${r}`} position={[0, -0.08, z]}>
        <boxGeometry args={[w - wall * 2, h * 0.5, 0.04]} />
        {dividerMat}
      </mesh>
    );
  }

  return (
    <group>
      {/* padded cream base */}
      <mesh position={[0, -h / 2 + 0.05, 0]}>
        <boxGeometry args={[w - wall * 1.4, 0.16, d - wall * 1.4]} />
        {dividerMat}
      </mesh>
      {/* thick outer walls */}
      <mesh position={[0, 0, -d / 2]}><boxGeometry args={[w, h, wall]} />{woodMat}</mesh>
      <mesh position={[0, 0, d / 2]}><boxGeometry args={[w, h, wall]} />{woodMat}</mesh>
      <mesh position={[-w / 2, 0, 0]}><boxGeometry args={[wall, h, d]} />{woodMat}</mesh>
      <mesh position={[w / 2, 0, 0]}><boxGeometry args={[wall, h, d]} />{woodMat}</mesh>
      {/* box floor */}
      <mesh position={[0, -h / 2, 0]}><boxGeometry args={[w, 0.1, d]} />{woodMat}</mesh>
      {dividers}

      {/* Open lid — hinged at the back top edge, leaning back like an unboxing. */}
      <group position={[0, h / 2 - 0.02, -d / 2]} rotation={[-1.95, 0, 0]}>
        <mesh position={[0, 0, -d / 2]} castShadow>
          <boxGeometry args={[w + 0.04, 0.09, d + 0.04]} />
          {woodMat}
        </mesh>
        {/* subtle cream inner liner on the lid */}
        <mesh position={[0, 0.055, -d / 2]}>
          <boxGeometry args={[w - wall, 0.01, d - wall]} />
          {dividerMat}
        </mesh>
      </group>
    </group>
  );
}

/**
 * Phase 15 — box visualization. Application state is the source of truth;
 * this scene only mirrors `items` (3d-architecture §3). Decorative.
 */
export default function BoxScene({ tier, capacity, items }: BoxSceneProps) {
  const settings = tierSettings(tier);
  const cols = capacity <= 4 ? 2 : capacity <= 8 ? 3 : 4;
  const rows = Math.ceil(capacity / cols);

  return (
    <Canvas
      dpr={settings.dpr}
      camera={{ position: [0, 2.6, 4.6], fov: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.02,
      }}
      style={{ background: 'transparent' }}
    >
      {/* The box packs run at 'box' quality (standard material, no wrap maps),
          but they still reflect the environment — a dozen little pouches with a
          shared studio behind them is what makes the tray look like one photo
          instead of a dozen separate props. Low res: they're small on screen. */}
      <StudioEnvironment intensity={0.9} resolution={128} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} />
      <directionalLight position={[-4, 3, -3]} intensity={0.25} color="#F0C070" />

      <TiltRig>
        <Tray cols={cols} rows={rows} />
        {items.slice(0, capacity).map((item, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = (col - (cols - 1) / 2) * 1.05;
          const z = (row - (rows - 1) / 2) * 0.62;
          return (
            <group key={`${item.id}-${i}`} position={[x, 0.45, z]} scale={0.42}>
              <PacketModel
                colors={{ body: item.color, accent: '#EEE7DA', label: '#FAF7F0' }}
                float={false}
                simple
              />
            </group>
          );
        })}
      </TiltRig>

      <ContactShadows position={[0, -0.62, 0]} opacity={0.3} scale={9} blur={2.6} far={2.4} />
    </Canvas>
  );
}
