import React from 'react';
import { Environment, Lightformer } from '@react-three/drei';

/**
 * Image-based lighting for the packaging scenes.
 *
 * `meshPhysicalMaterial`/`meshStandardMaterial` are PBR: their specular term is
 * *a reflection of the environment*. With only ambient/directional lights and no
 * envMap there is nothing to reflect, so every surface resolves to flat matte
 * plastic no matter how the colours are tuned. That — not the geometry — was why
 * the old scenes read as toys.
 *
 * Built from <Lightformer> children rather than an HDRI `preset`: drei's presets
 * fetch a .hdr from a CDN, which is a network dependency the rest of this 3D
 * system deliberately doesn't have (every texture here is canvas-drawn). This
 * bakes an equivalent studio into a small cubemap at mount instead.
 *
 * `frames={1}` bakes once and never re-renders — nothing in the environment
 * animates, so paying for it every frame would be pure waste on the integrated
 * GPUs this has to run on.
 */

interface StudioEnvironmentProps {
  /** Scales every emitter together. Tier B trims this to keep the look calm. */
  intensity?: number;
  /** Cubemap size. 256 is plenty for soft reflections; 128 for weaker devices. */
  resolution?: number;
}

export default function StudioEnvironment({
  intensity = 1,
  resolution = 256,
}: StudioEnvironmentProps) {
  return (
    <Environment resolution={resolution} frames={1} background={false}>
      {/* Dark surround. Foil only *looks* like foil when it has bright emitters
          to catch against a dark field — on a bright neutral background the
          highlights have no contrast to sit in and it flattens out again. */}
      <color attach="background" args={['#101016']} />

      {/* Key softbox, high and camera-right. The big soft roll-off across the
          pouch face comes from this. */}
      <Lightformer
        form="rect"
        intensity={3.6 * intensity}
        color="#fff6e8"
        position={[3, 4, 4]}
        scale={[7, 5, 1]}
        target
      />

      {/* Narrow vertical strips. These are the whole trick for laminated foil:
          a long thin emitter reflects as a stretched streak that slides along
          the pouch as it turns, which is what your eye reads as "shiny film"
          rather than "shiny plastic". Diffuse-only lighting can't fake this. */}
      <Lightformer
        form="rect"
        intensity={5.0 * intensity}
        color="#ffffff"
        position={[-3.4, 1.2, 2.6]}
        scale={[0.32, 5, 1]}
        target
      />
      <Lightformer
        form="rect"
        intensity={3.2 * intensity}
        color="#dfe9ff"
        position={[3.2, 0.4, 2.2]}
        scale={[0.22, 4, 1]}
        target
      />

      {/* Warm rim from behind — carves the silhouette away from the background
          and picks up the gold seal band. */}
      <Lightformer
        form="rect"
        intensity={2.4 * intensity}
        color="#ffc978"
        position={[-2.6, 1.6, -4]}
        scale={[5, 3, 1]}
        target
      />

      {/* Cool bounce from below-front, standing in for a fill card. Keeps the
          shadow side from crushing to black without lifting the whole frame. */}
      <Lightformer
        form="rect"
        intensity={0.9 * intensity}
        color="#bcd2ff"
        position={[0, -3, 2.5]}
        scale={[6, 2, 1]}
        target
      />

      {/* Broad top ambient dome — the "room" the studio sits in. */}
      <Lightformer
        form="ring"
        intensity={0.6 * intensity}
        color="#ffffff"
        position={[0, 6, 0]}
        scale={[10, 10, 1]}
        target
      />
    </Environment>
  );
}
