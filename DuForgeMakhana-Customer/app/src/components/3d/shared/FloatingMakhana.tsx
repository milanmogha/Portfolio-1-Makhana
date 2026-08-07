import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface FloatingMakhanaProps {
  count?: number;
  radius?: number;
}

const VARIANTS = 3;

/**
 * Build one organic "fox-nut" geometry: a low-poly icosphere pushed around by
 * cheap trig noise (lobes + a flattened profile + a soft central dent) so the
 * pieces read as popped makhana rather than plain spheres. Low detail keeps it
 * instance-friendly.
 */
function makeMakhanaGeo(seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const noise =
      0.14 * Math.sin(v.x * 3.1 + seed) +
      0.10 * Math.cos(v.y * 4.3 + seed * 1.7) +
      0.08 * Math.sin(v.z * 5.2 + seed * 2.3);
    v.multiplyScalar(1 + noise);
    v.y *= 0.78; // flatten
    // soft dent on the +z pole (where the nut popped)
    const dent = Math.max(0, v.z) * 0.18 * Math.exp(-(v.x * v.x + v.y * v.y) * 2.4);
    v.z -= dent;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/**
 * Instanced makhana drifting around the packet. One InstancedMesh per organic
 * variant (≤3 draw calls); counts stay tier-controlled (§5 of 3d-architecture).
 */
export default function FloatingMakhana({ count = 14, radius = 2.2 }: FloatingMakhanaProps) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometries = useMemo(() => Array.from({ length: VARIANTS }, (_, i) => makeMakhanaGeo(i * 11.3 + 1)), []);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  // Seeds grouped by variant so each InstancedMesh knows its own instances.
  const groups = useMemo(() => {
    const all = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      r: radius * (0.62 + Math.random() * 0.42),
      y: (Math.random() - 0.5) * 2.0,
      speed: 0.08 + Math.random() * 0.12,
      size: 0.11 + Math.random() * 0.07,
      wobble: Math.random() * Math.PI * 2,
      spin: 0.6 + Math.random() * 1.1,
    }));
    const byVariant: (typeof all)[] = Array.from({ length: VARIANTS }, () => []);
    all.forEach((s, i) => byVariant[i % VARIANTS].push(s));
    return byVariant;
  }, [count, radius]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groups.forEach((seeds, vi) => {
      const mesh = meshes.current[vi];
      if (!mesh) return;
      seeds.forEach((s, i) => {
        const a = s.angle + t * s.speed;
        dummy.position.set(
          Math.cos(a) * s.r,
          s.y + Math.sin(t * 0.7 + s.wobble) * 0.12,
          Math.sin(a) * s.r * 0.5 - 0.4
        );
        dummy.scale.setScalar(s.size);
        dummy.rotation.set(t * s.speed * s.spin + s.wobble, a, s.wobble * 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {geometries.map((geo, vi) => (
        <instancedMesh
          key={vi}
          ref={(m) => { meshes.current[vi] = m; }}
          args={[geo, undefined, Math.max(1, groups[vi].length)]}
          frustumCulled={false}
        >
          {/* Fox nuts are a dry, porous, near-dielectric surface: high roughness,
              no metalness. Left glossier they read as polystyrene balls. */}
          <meshStandardMaterial
            color="#F3E8D0"
            roughness={0.78}
            metalness={0}
            envMapIntensity={0.85}
          />
        </instancedMesh>
      ))}
    </>
  );
}
