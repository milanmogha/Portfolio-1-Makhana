import React, { useEffect, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { detectTier, type CapabilityTier } from '../shared/DeviceCapability';
import WebGLErrorBoundary from '../shared/WebGLErrorBoundary';

// The full three.js stack loads only if this chunk is requested — never in
// the main bundle (3d-architecture §1). next/dynamic (not React.lazy) so
// chunking works identically under Turbopack dev and webpack production.
const HeroScene = nextDynamic(() => import('./HeroScene'), { ssr: false });

interface Hero3DProps {
  /** Static fallback — always rendered for tier C / failure / while loading. */
  fallback: React.ReactNode;
}

/**
 * Mount controller for the hero scene:
 *  - capability tiering (A/B full/reduced, C = static image)
 *  - waits for idle time after LCP paint before requesting the 3D chunk
 *  - SINGLE-CANVAS POLICY: the scene unmounts when scrolled out of view so
 *    only one WebGL context is alive at a time (integrated GPUs lose
 *    context under multi-canvas load)
 *  - context loss / render error → permanent static fallback
 */
export default function Hero3D({ fallback }: Hero3DProps) {
  const [tier, setTier] = useState<CapabilityTier | null>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [dead, setDead] = useState(false); // context lost — don't retry
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  // Don't compete with LCP: request the 3D chunk during idle time.
  useEffect(() => {
    if (tier === null || tier === 'C') return;
    if (typeof window === 'undefined') return;
    const start = () => setReady(true);
    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
    if (idle) {
      const id = idle(start, { timeout: 2500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 1200);
    return () => window.clearTimeout(t);
  }, [tier]);

  // Unmount the canvas when the hero scrolls out of view (frees the context
  // before the Flavor Universe canvas mounts further down the page).
  useEffect(() => {
    if (typeof window === 'undefined' || !hostRef.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { rootMargin: '150px' }
    );
    io.observe(hostRef.current);
    return () => io.disconnect();
  }, [ready]);

  const showScene = tier !== null && tier !== 'C' && ready && inView && !dead;

  useEffect(() => {
    if (tier === 'C' && process.env.NODE_ENV !== 'production') {
      console.info('[Hero3D] Tier C — static fallback (no WebGL, reduced motion, or low device signals)');
    }
  }, [tier]);

  return (
    <div ref={hostRef} className="hero-3d-host" aria-hidden="true">
      {showScene ? (
        <WebGLErrorBoundary fallback={fallback}>
          <HeroScene
            tier={tier as Exclude<CapabilityTier, 'C'>}
            onContextLost={() => {
              console.warn('[Hero3D] WebGL context lost — switching to static fallback');
              setDead(true);
            }}
          />
        </WebGLErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
