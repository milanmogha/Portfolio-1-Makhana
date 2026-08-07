// Build Your Own Box (Phase 15) — flagship conversion feature.
// Works entirely over the REAL catalog: the "box" is a guided multi-add over
// existing products, so pricing, stock and cart rules stay server-authoritative.
// The 3D scene only mirrors React state (3d-architecture §3); a 2D grid is the
// fallback for Tier C / reduced motion / WebGL failure.

import React, { useEffect, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../api/productApi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/formatters';
import { firstProductImage } from '../utils/productImages';
import QuantityStepper from '../components/ui/QuantityStepper';
import { detectTier, type CapabilityTier } from '../components/3d/shared/DeviceCapability';
import WebGLErrorBoundary from '../components/3d/shared/WebGLErrorBoundary';
import type { BoxSlotItem } from '../components/3d/box-builder/BoxScene';
import { FLAVOR_ACCENTS } from '../theme/flavors';

const BoxScene = nextDynamic(() => import('../components/3d/box-builder/BoxScene'), { ssr: false });

const BOX_SIZES = [4, 6, 8, 12];

// Deterministic slot accents come from the centralized flavor palette.
const SLOT_COLORS = FLAVOR_ACCENTS;

type Product = {
  _id: string;
  name: string;
  category?: string;
  price: number;
  discount?: number;
  stock?: number;
  rating?: { average?: number; count?: number };
};

const finalPrice = (p: Product) =>
  p.discount ? (p.price * (100 - p.discount)) / 100 : p.price;

type BuildYourBoxProps = { openCart?: () => void };

export default function BuildYourBox({ openCart }: BuildYourBoxProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState(6);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [tier, setTier] = useState<CapabilityTier | null>(null);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        const items = (Array.isArray(data) ? data : []).filter(
          (p: Product) => (p.stock ?? 0) > 0
        );
        setCatalog(items);
      } catch (err) {
        console.error('Failed to load catalog for box builder:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalCount = useMemo(
    () => Object.values(selections).reduce((s, q) => s + q, 0),
    [selections]
  );

  const totalPrice = useMemo(
    () =>
      catalog.reduce((sum, p) => sum + (selections[p._id] || 0) * finalPrice(p), 0),
    [catalog, selections]
  );

  const remaining = capacity - totalCount;

  const setQty = (product: Product, qty: number) => {
    const clampedByStock = Math.min(qty, product.stock ?? 0);
    const current = selections[product._id] || 0;
    // Never exceed box capacity overall
    const clamped = Math.min(clampedByStock, current + remaining);
    setSelections((prev) => {
      const next = { ...prev };
      if (clamped <= 0) delete next[product._id];
      else next[product._id] = clamped;
      return next;
    });
  };

  const changeCapacity = (size: number) => {
    setCapacity(size);
    // Trim selections if the new box is smaller
    setSelections((prev) => {
      let budget = size;
      const next: Record<string, number> = {};
      for (const [id, qty] of Object.entries(prev)) {
        if (budget <= 0) break;
        const q = Math.min(qty, budget);
        next[id] = q;
        budget -= q;
      }
      return next;
    });
  };

  // Flattened slot list for the 3D scene / 2D fallback
  const slotItems: BoxSlotItem[] = useMemo(() => {
    const items: BoxSlotItem[] = [];
    const ids = Object.keys(selections);
    ids.forEach((id, idx) => {
      for (let i = 0; i < (selections[id] || 0); i++) {
        items.push({ id, color: SLOT_COLORS[idx % SLOT_COLORS.length] });
      }
    });
    return items;
  }, [selections]);

  const handleAddBox = async () => {
    if (totalCount !== capacity) return;
    if (!user) {
      showToast('Sign in to add your box to the cart');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      for (const p of catalog) {
        const qty = selections[p._id];
        if (qty) await addToCart(p as any, qty);
      }
      showToast('Your box is in the cart 🎉');
      setSelections({});
      openCart?.();
    } catch (err) {
      console.error('Failed to add box:', err);
      showToast('Something went wrong adding your box — please try again');
    } finally {
      setAdding(false);
    }
  };

  const fallback2D = (
    <div className="byb-fallback" aria-label={`Box preview: ${totalCount} of ${capacity} slots filled`}>
      {Array.from({ length: capacity }).map((_, i) => (
        <span
          key={i}
          className={`byb-slot ${slotItems[i] ? 'filled' : ''}`}
          style={slotItems[i] ? { background: slotItems[i].color } : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="byb-page">
      <header className="byb-header">
        <p className="ui-section-eyebrow">Build your own box</p>
        <h1>Your Crunch, Your Rules</h1>
        <p className="byb-sub">
          Pick a box size, fill it with your favourites, and add the whole box
          to your cart in one go.
        </p>
      </header>

      <div className="byb-layout">
        <div className="byb-config">
          {/* Step 1 — size */}
          <section aria-labelledby="byb-step1">
            <h2 id="byb-step1" className="byb-step-title">
              <span className="byb-step-num">1</span> Choose your box size
            </h2>
            <div className="byb-sizes" role="group" aria-label="Box size">
              {BOX_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`byb-size ${capacity === size ? 'active' : ''}`}
                  aria-pressed={capacity === size}
                  onClick={() => changeCapacity(size)}
                >
                  <strong>{size}</strong>
                  <span>packs</span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 — fill it */}
          <section aria-labelledby="byb-step2">
            <h2 id="byb-step2" className="byb-step-title">
              <span className="byb-step-num">2</span> Fill it with crunch
              <span className="byb-progress" aria-live="polite">
                {totalCount}/{capacity} filled
              </span>
            </h2>

            {loading ? (
              <div className="byb-products">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="byb-product" key={i}>
                    <div className="ui-skeleton" style={{ width: 56, height: 56, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div className="ui-skeleton sk-line" />
                      <div className="ui-skeleton sk-line short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : catalog.length === 0 ? (
              <div className="ui-empty">
                <h3>No products available</h3>
                <p>The catalog is empty or out of stock — check back soon.</p>
              </div>
            ) : (
              <div className="byb-products">
                {catalog.map((p) => {
                  const qty = selections[p._id] || 0;
                  const img = firstProductImage(p as any, 200) || '/images/placeholder.jpg';
                  const stockCap = Math.min(p.stock ?? 0, qty + remaining);
                  return (
                    <div className={`byb-product ${qty > 0 ? 'selected' : ''}`} key={p._id}>
                      <img
                        src={img}
                        alt=""
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          if (!el.dataset.fallback) {
                            el.dataset.fallback = '1';
                            el.src = '/images/placeholder.jpg';
                          }
                        }}
                      />
                      <div className="byb-product-info">
                        <h3>{p.name}</h3>
                        <p>
                          {formatPrice(finalPrice(p))}
                          {p.category && <span className="byb-cat"> · {p.category}</span>}
                        </p>
                      </div>
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="mk-btn mk-btn-ghost byb-add"
                          disabled={remaining <= 0}
                          onClick={() => setQty(p, 1)}
                        >
                          Add
                        </button>
                      ) : (
                        <QuantityStepper
                          value={qty}
                          min={0}
                          max={stockCap}
                          size="sm"
                          label={p.name}
                          onChange={(v) => setQty(p, v)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Live preview */}
        <aside className="byb-preview" aria-label="Box preview">
          <div className="byb-stage">
            {tier && tier !== 'C' ? (
              <WebGLErrorBoundary fallback={fallback2D}>
                <BoxScene tier={tier} capacity={capacity} items={slotItems} />
              </WebGLErrorBoundary>
            ) : (
              fallback2D
            )}
          </div>

          {/* Step 3 — review */}
          <div className="byb-summary">
            <h2 className="byb-step-title">
              <span className="byb-step-num">3</span> Review &amp; add
            </h2>
            <ul className="byb-summary-list">
              {catalog
                .filter((p) => selections[p._id])
                .map((p) => (
                  <li key={p._id}>
                    <span>{selections[p._id]}× {p.name}</span>
                    <strong>{formatPrice(selections[p._id] * finalPrice(p))}</strong>
                  </li>
                ))}
              {totalCount === 0 && <li className="byb-empty-hint">Your box is empty — add some crunch.</li>}
            </ul>
            <div className="byb-total">
              <span>Box total</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <button
              type="button"
              className="mk-btn mk-btn-primary byb-cta"
              disabled={totalCount !== capacity || adding}
              onClick={handleAddBox}
            >
              {adding
                ? 'Adding…'
                : totalCount === capacity
                ? `Add Box to Cart · ${formatPrice(totalPrice)}`
                : `Fill ${remaining} more to continue`}
            </button>
            <p className="byb-note">
              Items are added as regular cart lines — shipping and any coupons
              are calculated at checkout as usual.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
