import React, { useMemo, useState } from 'react';
import SectionHeader from '../ui/SectionHeader';
import ProductCard from '../../pageComponents/ProductCard';

interface BestsellersProps {
  products: any[];
  loading: boolean;
  openCart?: () => void;
}

/**
 * Section — "Most-Loved Makhana". Tab set is derived from the categories that
 * actually exist in the catalog (never hardcoded categories with no products).
 */
export default function Bestsellers({ products, loading, openCart }: BestsellersProps) {
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p) => (p.category || '').toUpperCase()).filter(Boolean))
    ).slice(0, 5);
    return [
      { id: 'featured', label: 'Featured' },
      { id: 'bestsellers', label: 'Best Sellers' },
      ...cats.map((c) => ({
        id: c,
        label: c.charAt(0) + c.slice(1).toLowerCase(),
      })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    let list = [...products];
    if (activeTab === 'bestsellers') {
      list.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
    } else if (activeTab !== 'featured') {
      list = list.filter((p) => (p.category || '').toUpperCase() === activeTab);
    }
    return list.slice(0, 8);
  }, [products, activeTab]);

  return (
    <section className="home-section" aria-labelledby="bestsellers-title">
      <SectionHeader
        eyebrow="Customer favourites"
        title="Most-Loved Makhana"
        viewAllTo="/products"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {loading ? (
        <div className="home-product-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="home-product-skeleton" key={i}>
              <div className="ui-skeleton sk-img" />
              <div className="ui-skeleton sk-line" />
              <div className="ui-skeleton sk-line short" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="ui-empty">
          <h3>Nothing here yet</h3>
          <p>New products are on their way — check back soon.</p>
        </div>
      ) : (
        <div className="home-product-grid">
          {visible.map((product) => (
            <ProductCard key={product._id} product={product} openCart={openCart} />
          ))}
        </div>
      )}
    </section>
  );
}
