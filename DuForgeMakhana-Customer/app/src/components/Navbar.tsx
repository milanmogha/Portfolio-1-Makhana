import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faHeart, faCartShopping, faBars, faXmark,
  faBox, faMapMarkerAlt, faSignOutAlt, faUserPlus, faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
import UtilityBar from './header/UtilityBar';
import SearchBar from './header/SearchBar';

interface NavbarProps {
  openCart: () => void;
}

/**
 * PRANA 3-layer commerce header:
 *   A — UtilityBar (contact, brand line, track order) — hides on scroll
 *   B — Main header (logo · search · account/wishlist/cart)
 *   C — Category navigation — sticky
 * Mobile: compact bar + slide-out menu (search, links, account actions).
 */
const Navbar: React.FC<NavbarProps> = ({ openCart }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { isLoggedIn, logout } = useAuth();
  const cartCount = useMemo(() => cart?.items?.length || 0, [cart]);

  // Category navigation — existing catalog categories only
  const navigationItems = useMemo(() => [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Shop All' },
    { path: '/products?category=Flavored%20Makhana', label: 'Flavored' },
    { path: '/products?category=Plain%20Makhana', label: 'Plain' },
    { path: '/products?category=Makhana%20Mixes', label: 'Mixes' },
    { path: '/build-your-box', label: 'Build Your Box' },
    { path: '/products?category=Dry%20Fruits', label: 'Dry Fruits' },
    { path: '/products?category=Gift%20Boxes', label: 'Gifting' },
    { path: '/products?category=Sale', label: 'Offers', className: 'sale-link' }
  ], []);

  const closeAllMenus = useCallback(() => {
    setMenuOpen(false);
    setShowDropdown(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    closeAllMenus();
    navigate('/login');
  }, [logout, closeAllMenus, navigate]);

  const handleCartClick = useCallback(() => {
    openCart();
    closeAllMenus();
  }, [openCart, closeAllMenus]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (typeof window === 'undefined' || !showDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Compact header on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body scroll lock while the mobile menu is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { body, documentElement } = window.document;
    if (menuOpen) {
      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';
      body.classList.add('menu-open');
      const preventScroll = (e: TouchEvent) => {
        if (menuContentRef.current && !menuContentRef.current.contains(e.target as Node)) {
          e.preventDefault();
        }
      };
      window.document.addEventListener('touchmove', preventScroll, { passive: false });
      return () => {
        window.document.removeEventListener('touchmove', preventScroll);
        body.style.overflow = '';
        documentElement.style.overflow = '';
        body.classList.remove('menu-open');
      };
    }
    body.style.overflow = '';
    documentElement.style.overflow = '';
    body.classList.remove('menu-open');
    return undefined;
  }, [menuOpen]);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname, location.search]);

  // Expose header height so .page-content offset stays exact (no layout shift)
  const applyHeaderHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = headerRef.current;
    if (!el) return;
    const h = el.offsetHeight || el.getBoundingClientRect().height || 0;
    window.document.documentElement.style.setProperty('--header-offset', `${h}px`);
    const pageContent = window.document.querySelector('.page-content') as HTMLElement | null;
    if (pageContent) pageContent.style.paddingTop = `${h}px`;
  }, []);

  useEffect(() => {
    applyHeaderHeight();
    const el = headerRef.current;
    let ro: ResizeObserver | null = null;
    if (typeof window !== 'undefined') {
      if (el && (window as any).ResizeObserver) {
        ro = new ResizeObserver(applyHeaderHeight);
        ro.observe(el);
      }
      window.addEventListener('resize', applyHeaderHeight);
    }
    return () => {
      if (ro) ro.disconnect();
      if (typeof window !== 'undefined') window.removeEventListener('resize', applyHeaderHeight);
    };
  }, [applyHeaderHeight]);

  useEffect(() => {
    applyHeaderHeight();
  }, [location.pathname, isScrolled, applyHeaderHeight]);

  return (
    <>
      {menuOpen && (
        <div className="navbar-overlay visible" onClick={closeAllMenus} role="presentation" />
      )}

      <header ref={headerRef} className={`header ${isScrolled ? 'scrolled' : ''}`} role="banner">
        {/* Layer A — utility bar (collapses when scrolled) */}
        <UtilityBar />

        {/* Layer B — main header */}
        <div className="main-header">
          <div className="main-header-inner">
            <button
              className="icon navbar-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
            </button>

            <div className="navbar-logo">
              <Link to="/" className="logo-link" onClick={closeAllMenus}>
                <img
                  src="/images/makhana-logo.png"
                  alt="Makhana E-Store"
                  className="navbar_logo_img"
                />
              </Link>
            </div>

            <div className="main-header-search">
              <SearchBar onNavigated={closeAllMenus} />
            </div>

            <div className="main-header-actions">
              <div className="profile-dropdown" ref={dropdownRef}>
                <button
                  className="icon profile-toggle"
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate('/login');
                      closeAllMenus();
                    } else {
                      setShowDropdown((p) => !p);
                    }
                  }}
                  aria-expanded={showDropdown}
                  aria-label="Account menu"
                >
                  <FontAwesomeIcon icon={faUser} />
                  <span className="icon-label">Account</span>
                </button>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/account" state={{ defaultTab: 'account' }} onClick={closeAllMenus}>
                      <FontAwesomeIcon icon={faUser} /> My Account
                    </Link>
                    <Link to="/account" state={{ defaultTab: 'address', action: 'saved' }} onClick={closeAllMenus}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Saved Addresses
                    </Link>
                    <Link to="/account" state={{ defaultTab: 'orders' }} onClick={closeAllMenus}>
                      <FontAwesomeIcon icon={faBox} /> My Orders
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                      <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              <Link to="/wishlist" className="icon wishlist-icon" aria-label="Wishlist" onClick={closeAllMenus}>
                <FontAwesomeIcon icon={faHeart} />
                <span className="icon-label">Wishlist</span>
              </Link>

              <button
                className="icon cart-icon-wrapper"
                onClick={handleCartClick}
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <FontAwesomeIcon icon={faCartShopping} />
                <span className="icon-label">Cart</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Layer C — category navigation (desktop) */}
        <nav className="category-nav" aria-label="Categories">
          <ul className="navbar-links">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={item.className || ''}
                  aria-current={
                    location.pathname + location.search === item.path ? 'page' : undefined
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Mobile slide-out menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-header">
          <h3>Menu</h3>
          <button className="close-menu" onClick={closeAllMenus} aria-label="Close navigation menu">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="mobile-menu-content" ref={menuContentRef}>
          <div className="mobile-search">
            <SearchBar onNavigated={closeAllMenus} compact />
          </div>

          <ul className="mobile-nav-links">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link to={item.path} onClick={closeAllMenus} className={item.className || ''}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mobile-user-actions">
            {isLoggedIn ? (
              <>
                <Link to="/account" state={{ defaultTab: 'account' }} className="mobile-action-btn" onClick={closeAllMenus}>
                  <FontAwesomeIcon icon={faUser} /> My Account
                </Link>
                <Link to="/account" state={{ defaultTab: 'orders' }} className="mobile-action-btn" onClick={closeAllMenus}>
                  <FontAwesomeIcon icon={faBox} /> My Orders
                </Link>
                <button onClick={handleLogout} className="mobile-action-btn logout">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-action-btn" onClick={closeAllMenus}>
                  <FontAwesomeIcon icon={faSignInAlt} /> Sign In
                </Link>
                <Link to="/signup" className="mobile-action-btn" onClick={closeAllMenus}>
                  <FontAwesomeIcon icon={faUserPlus} /> Create Account
                </Link>
              </>
            )}
          </div>

          <div className="mobile-bottom-actions">
            <Link to="/wishlist" className="mobile-bottom-btn" onClick={closeAllMenus}>
              <FontAwesomeIcon icon={faHeart} />
              <span>Wishlist</span>
            </Link>
            <button onClick={handleCartClick} className="mobile-bottom-btn cart">
              <FontAwesomeIcon icon={faCartShopping} />
              <span>Cart ({cartCount})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
