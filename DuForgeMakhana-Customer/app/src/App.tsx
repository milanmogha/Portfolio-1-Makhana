// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// CONTEXT PROVIDERS
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';

// LAYOUT & PROTECTED ROUTE COMPONENTS
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './api/ProtectedRoute';
import CartPage from './pageComponents/CartPage';

// PAGE COMPONENTS
import HomePage from './pageComponents/HomePage';
import ProductPage from './pageComponents/ProductPage';
import CategoriesPage from './pageComponents/CategoriesPage';
import BuildYourBox from './pageComponents/BuildYourBox';
import ProductDetailsPage from './pageComponents/ProductDetails';
import WishList from './pageComponents/WishList';
import AddressBook from './pageComponents/AddressBook';
import CheckoutPage from './pageComponents/CheckoutPage';
import OrderDetailsPage from './pageComponents/OrderDetailsPage';
import ProfilePanel from './pageComponents/ProfilePanel';

// --- FIX: Import missing auth components ---
import Login from './pageComponents/Login';
import Signup from './pageComponents/Signup';

// Scrolls to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname]);
  return null;
}


// Re-runs the page enter animation on every navigation
function RouteTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="route-fade">
      {children}
    </div>
  );
}

function App() {
  const [isCartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
          <Router>
            <ScrollToTop />
            {!isCartOpen && <Navbar openCart={openCart} />}

            <RouteTransition>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<HomePage openCart={openCart} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* --- Product Routes --- */}
              {/* FIX: Removed duplicate route and corrected function name */}
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/products" element={<ProductPage openCart={openCart} />} />
              <Route path="/products/:id" element={<ProductDetailsPage openCart={openCart} />} />
              <Route path="/build-your-box" element={<BuildYourBox openCart={openCart} />} />

              {/* --- Protected User Routes --- */}
              <Route path="/wishlist" element={<ProtectedRoute><WishList openCart={openCart} /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              
              {/* FIX: Consolidated account section route */}
              <Route path="/account/*" element={<ProtectedRoute><ProfilePanel /></ProtectedRoute>} />

            </Routes>
            </RouteTransition>

            {/* The Cart Slider is rendered outside Routes to act as an overlay */}
            <CartPage isOpen={isCartOpen} onClose={closeCart} />

            <Footer />
            {!isCartOpen && <MobileBottomNav openCart={openCart} />}
          </Router>
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;