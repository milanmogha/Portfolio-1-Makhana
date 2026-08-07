import React, { useEffect, useRef, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { Link } from 'react-router-dom';
import { detectTier, type CapabilityTier } from '../3d/shared/DeviceCapability';
import WebGLErrorBoundary from '../3d/shared/WebGLErrorBoundary';
import { FLAVORS, flavorCtaHref, type FlavorTheme } from '../../theme/flavors';

// next/dynamic (not React.lazy) — reliable chunking in Turbopack dev + webpack prod
const FlavorScene = nextDynamic(() => import('../3d/flavor-universe/FlavorScene'), { ssr: false });

// Flavor identity now lives in a single source of truth (theme/flavors.ts).
export type Flavor = FlavorTheme;

/**
 * Section — "Explore Your Flavor Universe" (Phase 13).
 * App state (activeFlavor) is the source of truth: copy, CTA, CSS atmosphere
 * (data-flavor) and the 3D packet all subscribe to it. The scene is
 * decorative; the flavor buttons are plain HTML and fully keyboard operable.
 */
export default function FlavorUniverse() {
  const [active, setActive] = useState<Flavor>(FLAVORS[0]);
  const [tier, setTier] = useState<CapabilityTier | null>(null);
  const [visible, setVisible] = useState(false);
  const [dead, setDead] = useState(false); // context lost — stay on fallback
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  // SINGLE-CANVAS POLICY: mount the scene while near the viewport, unmount
  // when scrolled away — keeps at most one WebGL context alive per page.
  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setVisible(e.isIntersecting)),
      { rootMargin: '200px' }
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  const staticPacket = (
    <div className="flavor-static-packet" aria-hidden="true">
      <div
        className="flavor-static-body"
        style={{ background: active.colors.body, borderColor: active.colors.accent }}
      >
        <span className="flavor-static-label" style={{ background: active.colors.label }}>
          {active.name}
        </span>
        <span className="flavor-static-stripe" style={{ background: active.colors.accent }} />
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="home-section flavor-universe"
      data-flavor={active.id}
      aria-labelledby="flavor-title"
      style={{ background: 'var(--flavor-bg)' }}
    >
      <div className="flavor-universe-inner">
        <div className="flavor-copy">
          <p className="ui-section-eyebrow">Flavor universe</p>
          <h2 id="flavor-title">Explore Your Flavor Universe</h2>
          <p className="flavor-tagline" aria-live="polite">{active.tagline}</p>

          <div className="flavor-picker" role="group" aria-label="Choose a flavor">
            {FLAVORS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`flavor-chip ${active.id === f.id ? 'active' : ''}`}
                aria-pressed={active.id === f.id}
                style={{ '--chip-color': f.colors.accent } as React.CSSProperties}
                onClick={() => setActive(f)}
              >
                <span className="flavor-chip-dot" aria-hidden="true" />
                {f.name}
              </button>
            ))}
          </div>

          <Link
            to={flavorCtaHref(active)}
            className="mk-btn mk-btn-primary flavor-cta"
          >
            Shop {active.name} &amp; more
          </Link>
        </div>

        <div className="flavor-stage">
          {tier && tier !== 'C' && visible && !dead ? (
            <WebGLErrorBoundary fallback={staticPacket}>
              <FlavorScene
                tier={tier}
                colors={active.colors}
                flavorName={active.name}
                rim={active.colors.rim}
                onContextLost={() => {
                  console.warn('[FlavorUniverse] WebGL context lost — static fallback');
                  setDead(true);
                }}
              />
            </WebGLErrorBoundary>
          ) : (
            staticPacket
          )}
        </div>
      </div>
    </section>
  );
}
