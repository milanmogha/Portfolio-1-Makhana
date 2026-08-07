import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faStore, faHeart, faCartShopping, faUser } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';

interface MobileBottomNavProps {
  openCart: () => void;
}

/**
 * Mobile bottom navigation (brief §15) — thumb-zone tabs, <1080px only.
 * Hidden while the cart drawer is open (App controls mounting).
 */
export default function MobileBottomNav({ openCart }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { isLoggedIn } = useAuth();
  const cartCount = cart?.items?.length || 0;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      <NavLink to="/" end className={({ isActive }) => `mbn-item ${isActive ? 'active' : ''}`}>
        <FontAwesomeIcon icon={faHouse} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/categories"
        className={({ isActive }) => `mbn-item ${isActive ? 'active' : ''}`}
      >
        <FontAwesomeIcon icon={faStore} />
        <span>Shop</span>
      </NavLink>

      <NavLink
        to="/wishlist"
        className={({ isActive }) => `mbn-item ${isActive ? 'active' : ''}`}
      >
        <FontAwesomeIcon icon={faHeart} />
        <span>Wishlist</span>
      </NavLink>

      <button type="button" className="mbn-item" onClick={openCart} aria-label={`Cart, ${cartCount} items`}>
        <span className="mbn-cart-wrap">
          <FontAwesomeIcon icon={faCartShopping} />
          {cartCount > 0 && <span className="mbn-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
        </span>
        <span>Cart</span>
      </button>

      <button
        type="button"
        className={`mbn-item ${location.pathname.startsWith('/account') ? 'active' : ''}`}
        onClick={() => navigate(isLoggedIn ? '/account' : '/login')}
      >
        <FontAwesomeIcon icon={faUser} />
        <span>Account</span>
      </button>
    </nav>
  );
}
