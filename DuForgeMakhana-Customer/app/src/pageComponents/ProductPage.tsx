// src/pages/ProductPage.tsx

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSort, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getAllProducts } from '../api/productApi';
import socket from '../sockets';
import ProductCard from './ProductCard';
import FilterSidebar, { DISCOUNT_BUCKETS } from '../components/FilterSidebar';

/** Sort options — shared by the desktop <select> and the mobile dropdown. */
const SORT_OPTIONS = [
  { value: 'default', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

type Product = {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
  price: number;
  discount?: number;
  stock?: number;
};

type ProductPageProps = { openCart?: () => void };

const ProductPage = ({ openCart }: ProductPageProps) => {
  // --- STATE MANAGEMENT ---
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State for interactive filters
  const [sortOrder, setSortOrder] = useState('default');
  const [priceRange, setPriceRange] = useState(0);

  // New: sidebar filter state (categories, in-stock, discount buckets)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

  const [searchParams] = useSearchParams();
  const rawCategory = searchParams.get('category');
  // When the URL pins a category we treat the filter as "locked" — the
  // sidebar shows a pill, the category checkbox group is hidden.
  const urlCategory = rawCategory?.toUpperCase();
  const searchTerm = searchParams.get('search');

  // Mobile detection (matches the bottom-nav breakpoint) + filter overlay
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 1080 : false
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        setAllProducts(Array.isArray(data) ? data as Product[] : []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAllProducts();
  }, []);

  // --- REAL-TIME STOCK UPDATES ---
  useEffect(() => {
    const handleStockUpdate = (data: { productId: string; stock: number; name: string }) => {
      setAllProducts(prevProducts =>
        prevProducts.map(product => {
          if (product._id === data.productId) {
            return { ...product, stock: data.stock };
          }
          return product;
        })
      );
    };

    socket.on('stock-updated', handleStockUpdate);

    return () => {
      socket.off('stock-updated', handleStockUpdate);
    };
  }, []);

  // --- NEW: Calculate max price and initialize priceRange ---
  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) return 100000; // Default max
    return Math.max(...allProducts.map(p => p.price));
  }, [allProducts]);

  useEffect(() => {
    if (maxPrice > 0) {
      setPriceRange(maxPrice);
    }
  }, [maxPrice]);

  // Reset sidebar filters when the URL category or search term changes
  // so the visitor doesn't carry stale filters from a previous view.
  useEffect(() => {
    setSelectedCategories([]);
    setInStockOnly(false);
    setSelectedDiscounts([]);
    setPriceRange(maxPrice);
  }, [urlCategory, searchTerm, maxPrice]);

  // --- UNIFIED FILTERING & SORTING LOGIC ---
  useEffect(() => {
    let processedProducts = [...allProducts];

    // 1. Filter by main category from URL (always wins)
    if (urlCategory) {
      processedProducts = processedProducts.filter(product =>
        (product.category || '').toUpperCase() === urlCategory
      );
    } else if (selectedCategories.length > 0) {
      // When no URL category is set, the sidebar checkbox group takes over.
      const wanted = selectedCategories.map(c => c.toUpperCase());
      processedProducts = processedProducts.filter(product =>
        wanted.includes((product.category || '').toUpperCase())
      );
    }

    // 2. Filter by price range
    if (priceRange < maxPrice) {
      processedProducts = processedProducts.filter(product =>
        product.price <= priceRange
      );
    }

    // 3. Filter by in-stock toggle
    if (inStockOnly) {
      processedProducts = processedProducts.filter(
        product => (product.stock ?? 0) > 0
      );
    }

    // 4. Filter by discount buckets (union — any selected bucket matches)
    if (selectedDiscounts.length > 0) {
      const minDiscounts = selectedDiscounts
        .map(id => DISCOUNT_BUCKETS.find(b => b.id === id)?.min ?? 0);
      const minRequired = Math.min(...minDiscounts);
      processedProducts = processedProducts.filter(product =>
        (product.discount ?? 0) >= minRequired
      );
    }

    // 5. Filter by search term from URL
    if (searchTerm) {
      processedProducts = processedProducts.filter(product =>
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 6. Apply sorting
    switch (sortOrder) {
      case 'price-asc':
        processedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        processedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        processedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        processedProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'newest':
        processedProducts.sort((a, b) => {
          const at = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const bt = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return bt - at;
        });
        break;
      default:
        break;
    }

    setDisplayProducts(processedProducts);
  }, [
    allProducts,
    urlCategory,
    searchTerm,
    sortOrder,
    priceRange,
    maxPrice,
    selectedCategories,
    inStockOnly,
    selectedDiscounts,
  ]);

  // -- Sidebar handlers --
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleDiscount = (id: string) => {
    setSelectedDiscounts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setInStockOnly(false);
    setSelectedDiscounts([]);
    setPriceRange(maxPrice);
    setSortOrder('default');
  };

  // A filter is "active" when it would actually narrow the result set.
  const hasActiveFilters =
    priceRange < maxPrice ||
    selectedCategories.length > 0 ||
    inStockOnly ||
    selectedDiscounts.length > 0 ||
    sortOrder !== 'default';

  // Active filter chip count for the mobile filter button
  const activeFilterCount =
    (priceRange < maxPrice ? 1 : 0) +
    selectedCategories.length +
    (inStockOnly ? 1 : 0) +
    selectedDiscounts.length;

  const titleCase = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const getHeading = () => {
    if (searchTerm) return `Results for “${searchTerm}”`;
    return urlCategory ? titleCase(urlCategory) : "All Products";
  };

  // Update mobile breakpoint on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= 1080);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close the mobile sort / filter dropdowns on outside click or Escape
  useEffect(() => {
    if (!showSortMenu && !showFilterDropdown) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showSortMenu && sortRef.current && !sortRef.current.contains(target)) {
        setShowSortMenu(false);
      }
      if (showFilterDropdown && filterRef.current && !filterRef.current.contains(target)) {
        setShowFilterDropdown(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSortMenu(false);
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showSortMenu, showFilterDropdown]);

  // Locked category shown in the sidebar when the URL pins one.
  const lockedCategoryLabel = urlCategory ? titleCase(urlCategory) : null;

  return (
    <div className="product-page">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <FilterSidebar
          priceRange={priceRange}
          onPriceChange={(e) => setPriceRange(Number(e.target.value))}
          maxPrice={maxPrice}
          lockedCategory={lockedCategoryLabel}
          inStockOnly={inStockOnly}
          onInStockChange={(e) => setInStockOnly(e.target.checked)}
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          selectedDiscounts={selectedDiscounts}
          onDiscountToggle={toggleDiscount}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <main className="main-content">
        <nav className="plp-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          {urlCategory ? (
            <>
              <Link to="/products">Shop</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{titleCase(urlCategory)}</span>
            </>
          ) : (
            <span aria-current="page">Shop</span>
          )}
        </nav>
        <div className="page-header">
          <div>
            <h2>{getHeading()}</h2>
            {!loading && (
              <p className="plp-count">
                {displayProducts.length} product{displayProducts.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
          {isMobile ? (
            /* Compact controls: icon filter button + sort dropdown */
            <div className="plp-mobile-controls">
              <div className="plp-filter" ref={filterRef}>
                <button
                  type="button"
                  className={`plp-icon-btn ${showFilterDropdown ? 'open' : ''}`}
                  onClick={() => {
                    setShowFilterDropdown((v) => !v);
                    setShowSortMenu(false);
                  }}
                  aria-haspopup="true"
                  aria-expanded={showFilterDropdown}
                  aria-label="Filters"
                >
                  <FontAwesomeIcon icon={faFilter} />
                  {activeFilterCount > 0 && (
                    <span className="filter-badge" aria-label={`${activeFilterCount} filters active`}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {showFilterDropdown && (
                  <div className="plp-filter-menu" role="dialog" aria-label="Filter products">
                    <FilterSidebar
                      priceRange={priceRange}
                      onPriceChange={(e) => setPriceRange(Number(e.target.value))}
                      maxPrice={maxPrice}
                      lockedCategory={lockedCategoryLabel}
                      inStockOnly={inStockOnly}
                      onInStockChange={(e) => setInStockOnly(e.target.checked)}
                      selectedCategories={selectedCategories}
                      onCategoryToggle={toggleCategory}
                      selectedDiscounts={selectedDiscounts}
                      onDiscountToggle={toggleDiscount}
                      onClearAll={clearAllFilters}
                      hasActiveFilters={hasActiveFilters}
                    />
                  </div>
                )}
              </div>

              <div className="plp-sort" ref={sortRef}>
                <button
                  type="button"
                  className={`plp-sort-btn ${showSortMenu ? 'open' : ''}`}
                  onClick={() => {
                    setShowSortMenu((v) => !v);
                    setShowFilterDropdown(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={showSortMenu}
                >
                  <FontAwesomeIcon icon={faSort} />
                  <span>Sort</span>
                </button>
                {showSortMenu && (
                  <ul className="plp-sort-menu" role="listbox" aria-label="Sort products">
                    {SORT_OPTIONS.map((opt) => (
                      <li key={opt.value} role="option" aria-selected={sortOrder === opt.value}>
                        <button
                          type="button"
                          className={sortOrder === opt.value ? 'active' : ''}
                          onClick={() => {
                            setSortOrder(opt.value);
                            setShowSortMenu(false);
                          }}
                        >
                          <span>{opt.label}</span>
                          {sortOrder === opt.value && <FontAwesomeIcon icon={faCheck} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="sort-container">
              <label htmlFor="sort">Sort by: </label>
              <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="sort-dropdown">
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="product-grid-skeleton" key={i}>
                <div className="skeleton product-grid-skeleton-img" />
                <div className="skeleton product-grid-skeleton-line" />
                <div className="skeleton product-grid-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="product-grid">
            {displayProducts.map((product) => (
              <ProductCard key={product._id} product={product} openCart={openCart} />
            ))}
          </div>
        ) : (
          <div className="product-grid-empty">
            <span className="product-grid-empty-icon" aria-hidden="true">🔍</span>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search for something else.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
