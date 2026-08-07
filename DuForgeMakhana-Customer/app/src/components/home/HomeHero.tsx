import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Section 1 — commerce hero.
 * Copy/CTAs are semantic HTML; the visual column is a hand-hung sign board
 * that sways gently (pure CSS pendulum, disabled under reduced motion).
 */
export default function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">Premium Indian Makhana</p>
          <h1 id="home-hero-title" className="home-hero-title">
            Snack Ancient.<br />Live Modern.
          </h1>
          <p className="home-hero-sub">
            Premium makhana crafted for modern everyday wellness — roasted,
            never fried.
          </p>
          <div className="home-hero-ctas">
            <Link to="/products" className="mk-btn mk-btn-primary">Shop Makhana</Link>
            <Link to="/products?category=Flavored%20Makhana" className="mk-btn mk-btn-ghost">
              Explore Flavors
            </Link>
          </div>
          <ul className="home-hero-trust" aria-label="Quality highlights">
            <li>Carefully roasted</li>
            <li>Quality ingredients</li>
            <li>Freshly packed</li>
          </ul>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-visual-bg" aria-hidden="true" />
          {/* Hanging sign board — sways gently on a CSS pendulum. */}
          <div className="hb-rig">
            <span className="hb-hook" aria-hidden="true" />
            <span className="hb-beam" aria-hidden="true" />
            <span className="hb-rope hb-rope-left" aria-hidden="true" />
            <span className="hb-rope hb-rope-right" aria-hidden="true" />
            <div className="hb-board">
              <img
                src="/makhana.png"
                alt="Bowl of premium roasted makhana"
                className="hb-board-img"
                fetchPriority="high"
              />
              <span className="hb-plate">Premium Makhana</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
