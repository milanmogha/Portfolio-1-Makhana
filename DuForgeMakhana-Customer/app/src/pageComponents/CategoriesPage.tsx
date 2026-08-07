import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { getAllProducts } from '../api/productApi';
import SectionHeader from '../components/ui/SectionHeader';
import '../css/CategoriesPage.css';

/**
 * Categories landing page — reached via the "Shop" tab of the mobile bottom nav.
 * On tablet/mobile the top category navigation is hidden, so this page is the
 * single place to browse the full catalog by category.
 */

type Product = { category?: string };

/* Existing catalog categories only — mirrors HomePage's category discovery. */
const categoryCards = [
  { title: 'Flavored Makhana', category: 'Flavored Makhana', image: '/images/cat-flavored.jpg' },
  { title: 'Plain Makhana', category: 'Plain Makhana', image: '/images/cat-plain.jpg' },
  { title: 'Makhana Mixes', category: 'Makhana Mixes', image: '/images/cat-mixes.jpg' },
  { title: 'Dry Fruits', category: 'Dry Fruits', image: '/images/cat-dryfruits.jpg' },
  { title: 'Gift Boxes', category: 'Gift Boxes', image: '/images/makhana-giftbox.jpg' },
  { title: 'Offers', category: 'Sale', image: '/images/sale.png' },
];

const CategoriesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    getAllProducts()
      .then((data) => {
        if (alive) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        /* Counts are a non-critical enhancement — page works without them. */
      });
    return () => {
      alive = false;
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const c = (p.category || '').toUpperCase();
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [products]);

  return (
    <div className="categories-page">
      <SectionHeader
        eyebrow="Browse the catalog"
        title="Shop by Category"
        align="center"
      />

      {/* Quick actions */}
      <div className="categories-actions">
        <Link to="/products" className="categories-action categories-action--primary">
          <FontAwesomeIcon icon={faStore} />
          <span>All Products</span>
        </Link>
        <Link to="/build-your-box" className="categories-action categories-action--accent">
          <FontAwesomeIcon icon={faBoxOpen} />
          <span>Build Your Box</span>
        </Link>
      </div>

      {/* Category grid */}
      <div className="categories-grid">
        {categoryCards.map((item) => {
          const count = categoryCounts[item.category.toUpperCase()] || 0;
          return (
            <Link
              key={item.category}
              to={`/products?category=${encodeURIComponent(item.category)}`}
              className="categories-card"
            >
              <span
                className="categories-card-img"
                style={{ backgroundImage: `url(${item.image})` }}
                role="img"
                aria-label={item.title}
              />
              <span className="categories-card-body">
                <span className="categories-card-name">{item.title}</span>
                {count > 0 && (
                  <span className="categories-card-count">{count} products</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
