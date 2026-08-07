// src/components/FilterSidebar.tsx
// PLP filter rail — price, category, in-stock, discount buckets, clear-all.
// Brand tokens: forest primary / saffron accent (see app/src/index.css).

import React from 'react';
import { formatPrice } from '../utils/formatters';

// Canonical catalog categories (must match what the navbar / homepage / API use).
export const FILTER_CATEGORIES = [
  'Flavored Makhana',
  'Plain Makhana',
  'Makhana Mixes',
  'Dry Fruits',
  'Gift Boxes',
  'Sale',
];

// Discount buckets the user can opt into (percentage off).
export const DISCOUNT_BUCKETS = [
  { id: '10', label: '10% or more', min: 10 },
  { id: '25', label: '25% or more', min: 25 },
  { id: '50', label: '50% or more', min: 50 },
];

export interface FilterState {
  priceRange: number;
  selectedCategories: string[];
  inStockOnly: boolean;
  selectedDiscounts: string[];
}

interface FilterSidebarProps {
  priceRange: number;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxPrice: number;
  // When the URL pins a category (e.g. /products?category=Sale) we still
  // render the filter rail but the category group is locked to that one value
  // — the visitor can refine price / stock / discount but cannot escape the
  // category from the sidebar.
  lockedCategory?: string | null;
  inStockOnly: boolean;
  onInStockChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  selectedDiscounts: string[];
  onDiscountToggle: (bucketId: string) => void;
  onClearAll: () => void;
  // True when the user has actually narrowed results beyond the defaults.
  // Drives the "Clear all" button's enabled state.
  hasActiveFilters: boolean;
}

const FilterSidebar = ({
  priceRange,
  onPriceChange,
  maxPrice,
  lockedCategory,
  inStockOnly,
  onInStockChange,
  selectedCategories,
  onCategoryToggle,
  selectedDiscounts,
  onDiscountToggle,
  onClearAll,
  hasActiveFilters,
}: FilterSidebarProps) => {
  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3>Filter</h3>
        <button
          type="button"
          className="filter-clear-btn"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      </div>

      {/* Price */}
      <div className="filter-group">
        <h4>Price</h4>
        <input
          type="range"
          min="0"
          max={maxPrice}
          value={priceRange}
          onChange={onPriceChange}
          className="price-slider"
          style={{ ['--fill' as any]: maxPrice > 0 ? `${(priceRange / maxPrice) * 100}%` : '0%' }}
          aria-label="Maximum price"
        />
        <div className="price-label">
          <span>Up to</span>
          <strong>{formatPrice(priceRange)}</strong>
        </div>
      </div>

      {/* Category — checkbox group. When a category is locked by the URL
          (e.g. user clicked "Sale" in the navbar) we render a single locked
          pill instead of the list, so they can still refine within that view. */}
      <div className="filter-group">
        <h4>Category</h4>
        {lockedCategory ? (
          <div className="filter-locked-pill" aria-label={`Locked to ${lockedCategory}`}>
            <span className="filter-locked-pill-dot" aria-hidden="true" />
            {lockedCategory}
          </div>
        ) : (
          <ul className="filter-checkbox-list">
            {FILTER_CATEGORIES.map((cat) => {
              const id = `filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`;
              const checked = selectedCategories.includes(cat);
              return (
                <li key={cat}>
                  <label htmlFor={id} className="filter-checkbox-row">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => onCategoryToggle(cat)}
                    />
                    <span className="filter-checkbox-box" aria-hidden="true" />
                    <span className="filter-checkbox-label">{cat}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* In stock only */}
      <div className="filter-group">
        <h4>Availability</h4>
        <label htmlFor="filter-instock" className="filter-checkbox-row">
          <input
            id="filter-instock"
            type="checkbox"
            checked={inStockOnly}
            onChange={onInStockChange}
          />
          <span className="filter-checkbox-box" aria-hidden="true" />
          <span className="filter-checkbox-label">In stock only</span>
        </label>
      </div>

      {/* Discount buckets */}
      <div className="filter-group">
        <h4>Discount</h4>
        <ul className="filter-checkbox-list">
          {DISCOUNT_BUCKETS.map((bucket) => {
            const id = `filter-discount-${bucket.id}`;
            const checked = selectedDiscounts.includes(bucket.id);
            return (
              <li key={bucket.id}>
                <label htmlFor={id} className="filter-checkbox-row">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onDiscountToggle(bucket.id)}
                  />
                  <span className="filter-checkbox-box" aria-hidden="true" />
                  <span className="filter-checkbox-label">{bucket.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default FilterSidebar;
