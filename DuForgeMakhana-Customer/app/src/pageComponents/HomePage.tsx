// src/pages/HomePage.tsx — PRANA homepage (Phase 5)

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAllProducts } from "../api/productApi";
import socket from "../sockets";
import { useReveal } from "../hooks/useReveal";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { formatPrice } from "../utils/formatters";

import HomeHero from "../components/home/HomeHero";
import Bestsellers from "../components/home/Bestsellers";
import FlavorUniverse from "../components/home/FlavorUniverse";
import SnackFinder from "../features/snack-finder/SnackFinder";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "./ProductCard";

/* Rotating brand promises for the marquee strip.
   Claim-safety (P2): unverifiable nutrition/ingredient/absolute-delivery claims
   were neutralised. Kept only defensible product-method + positioning wording.
   Move to CMS/config + restore specific claims once business-verified. */
const marqueeItems = [
  "🌿 Wholesome Snacking",
  "🔥 Roasted, Never Fried",
  "🥣 Light & Satisfying",
  "🚚 Delivered to Your Door",
  "👑 Premium Quality",
  "✨ Thoughtfully Packed",
];

/* Category discovery — existing catalog categories only */
// Local assets only — previous external hotlinks (imimg/whiskaffair/gstatic)
// were unreliable (hotlink protection, no cache control). Replace the cat-*
// placeholders with owned photography when available.
const categoryCards = [
  { title: "Flavored", category: "Flavored Makhana", image: "/images/cat-flavored.jpg" },
  { title: "Plain", category: "Plain Makhana", image: "/images/cat-plain.jpg" },
  { title: "Mixes", category: "Makhana Mixes", image: "/images/cat-mixes.jpg" },
  { title: "Dry Fruits", category: "Dry Fruits", image: "/images/cat-dryfruits.jpg" },
  { title: "Gift Boxes", category: "Gift Boxes", image: "/images/makhana-giftbox.jpg" },
  { title: "Offers", category: "Sale", image: "/images/sale.png" },
];

/* Trust indicators — no fabricated certifications or claims */
const trustItems = [
  { icon: "👑", title: "Premium Quality", text: "Carefully selected and roasted for a consistent crunch" },
  { icon: "🔥", title: "Carefully Roasted", text: "Roasted, never fried — light and crunchy" },
  { icon: "📦", title: "Freshly Packed", text: "Sealed to keep every piece crisp" },
  { icon: "🔒", title: "Secure Payments", text: "UPI, cards & net banking via Razorpay" },
  { icon: "🚚", title: "Reliable Delivery", text: "Doorstep delivery with live order tracking" },
  { icon: "🌿", title: "Quality Ingredients", text: "Simple, thoughtfully chosen ingredients" },
];

type HomePageProps = { openCart?: () => void };

type Product = {
  _id?: string;
  name?: string;
  category?: string;
  price: number;
  discount?: number;
  rating?: { average?: number; count?: number };
};

const HomePage = ({ openCart }: HomePageProps) => {
  const navigate = useNavigate();
  const revealRef = useReveal<HTMLDivElement>(90);
  const { recentlyViewed } = useRecentlyViewed();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);

  /* One catalog fetch powers bestsellers, category counts and new arrivals */
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(false);
        const data = await getAllProducts({ sort: "newest" });
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load products:", err);
        setProductsError(true);
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, []);

  /* Live catalog updates */
  useEffect(() => {
    const onAdded = (p: Product) => setProducts((prev) => [p, ...prev]);
    const onDeleted = (id: string) =>
      setProducts((prev) => prev.filter((p) => p._id !== id));
    socket.on("product:added", onAdded);
    socket.on("product:deleted", onDeleted);
    return () => {
      socket.off("product:added", onAdded);
      socket.off("product:deleted", onDeleted);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const c = (p.category || "").toUpperCase();
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [products]);

  const newArrivals = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div className="homepage-wrapper" ref={revealRef}>
      {/* 1 — HERO */}
      <HomeHero />

      {/* Brand marquee */}
      <div className="brand-marquee" aria-hidden="true">
        <div className="brand-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span className="brand-marquee-item" key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* Explicit catalog error state (otherwise sections just render empty) */}
      {productsError && !loadingProducts && (
        <div className="home-error-notice" role="status">
          We couldn’t load products just now. Please refresh to try again.
        </div>
      )}

      {/* 3 — CATEGORY DISCOVERY */}
      <section className="home-section" aria-labelledby="category-title">
        <SectionHeader
          eyebrow="Browse by category"
          title="Find Your Perfect Crunch"
          align="center"
        />
        <div className="category-circles">
          {categoryCards.map((item) => {
            const count = categoryCounts[item.category.toUpperCase()] || 0;
            return (
              <Link
                key={item.category}
                to={`/products?category=${encodeURIComponent(item.category)}`}
                className="category-circle reveal-scale"
              >
                <span
                  className="category-circle-img"
                  style={{ backgroundImage: `url(${item.image})` }}
                  role="img"
                  aria-label={item.title}
                />
                <span className="category-circle-name">{item.title}</span>
                {count > 0 && (
                  <span className="category-circle-count">{count} products</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4 — BESTSELLERS (tabbed) */}
      <Bestsellers products={products} loading={loadingProducts} openCart={openCart} />

      {/* 5 — PROMO STRIP (real categories only) */}
      <section className="home-section" aria-label="Collections">
        <div className="home-promo-strip">
          <Link to="/products?category=Gift%20Boxes" className="home-promo-card promo-gift reveal">
            <div>
              <h3>Gifting, Done Healthy</h3>
              <p>Curated makhana gift boxes for festivals &amp; corporate gifting.</p>
              <span className="home-promo-cta">Shop Gift Boxes →</span>
            </div>
          </Link>
          <Link to="/build-your-box" className="home-promo-card promo-mix reveal">
            <div>
              <h3>Build Your Own Box</h3>
              <p>Pick a size, fill it with your favourite flavors, add it in one go.</p>
              <span className="home-promo-cta">Start Building →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 5b — FLAVOR UNIVERSE (3D, tier-gated) */}
      <FlavorUniverse />

      {/* 6 — NEW ARRIVALS strip */}
      <section className="home-section" aria-labelledby="arrivals-title">
        <SectionHeader title="New Arrivals" viewAllTo="/products?sort=newest" />
        <div className="home-product-scroller">
          {(loadingProducts ? Array.from({ length: 4 }) : newArrivals).map(
            (product: any, i) =>
              loadingProducts ? (
                <div className="home-product-skeleton" key={i}>
                  <div className="ui-skeleton sk-img" />
                  <div className="ui-skeleton sk-line" />
                  <div className="ui-skeleton sk-line short" />
                </div>
              ) : (
                <div className="home-product-slide" key={product._id}>
                  <ProductCardLazy product={product} openCart={openCart} />
                </div>
              )
          )}
        </div>
      </section>

      {/* 6b — AI SNACK FINDER (rules-based v1) */}
      <SnackFinder products={products as any} openCart={openCart} />

      {/* 7 — WHY CHOOSE US */}
      <section className="home-section home-trust" aria-labelledby="trust-title">
        <SectionHeader
          eyebrow="Why choose us"
          title="Crunch You Can Trust"
          align="center"
        />
        <div className="trust-grid">
          {trustItems.map((t) => (
            <div className="trust-card mk-card reveal" key={t.title}>
              <span className="trust-icon" aria-hidden="true">{t.icon}</span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 — ORIGIN STORY */}
      <section className="home-section home-origin" aria-labelledby="origin-title">
        <div className="home-origin-inner">
          <div className="home-origin-copy">
            <p className="ui-section-eyebrow">Our origin</p>
            <h2 id="origin-title">From Bihar&rsquo;s Waters to Your Everyday Crunch</h2>
            <p>
              Makhana — fox nut — grows in the still freshwater ponds of Bihar,
              where it has been cultivated and harvested for generations. We
              source, roast and season it, then pack it fresh so the crunch
              travels all the way to your door.
            </p>
            <Link to="/products" className="mk-btn mk-btn-ghost">Taste the Origin</Link>
          </div>
          <div className="home-origin-visual reveal-scale" aria-hidden="true">
            <img src="/makhana.png" alt="" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 9 — RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <section className="home-section" aria-labelledby="recent-title">
          <SectionHeader title="Recently Viewed" />
          <div className="recent-strip">
            {recentlyViewed.map((p) => (
              <button
                key={p._id}
                className="recent-chip mk-card"
                onClick={() => navigate(`/products/${p._id}`)}
              >
                <span className="recent-chip-name">{p.name}</span>
                <span className="recent-chip-meta">
                  {p.category && <em>{p.category}</em>}
                  <strong>
                    {formatPrice(p.discount ? (p.price * (100 - p.discount)) / 100 : p.price)}
                  </strong>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 10 — WELLNESS BAND */}
      <section className="home-wellness" aria-labelledby="wellness-title">
        <div className="home-wellness-inner">
          <h2 id="wellness-title">Make Better Snacking Part of Every Day</h2>
          <p>Swap the fried stuff for roasted makhana — your everyday crunch, upgraded.</p>
          <Link to="/products" className="mk-btn mk-btn-gold">Start Snacking Better</Link>
        </div>
      </section>
    </div>
  );
};

/* Local wrapper so the scroller can reuse the standard card */
const ProductCardLazy = ({ product, openCart }: { product: any; openCart?: () => void }) => (
  <ProductCard product={product} openCart={openCart} isCarouselContext />
);

export default HomePage;
