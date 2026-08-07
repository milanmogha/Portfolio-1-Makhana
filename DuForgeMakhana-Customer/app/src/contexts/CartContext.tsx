// src/pages/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  getCart as fetchCartApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi
} from '../api/cartApi';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';

type Product = {
  _id: string;
  price: number;
  discount?: number;
  name?: string;
  subtext?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  stock?: number;
  details?: string;
  description?: string;
  rating?: { average?: number; count?: number };
  images?: Record<string, { data?: string; contentType?: string; [key: string]: unknown }>;
  // Allow passthrough fields from the API without typing them all
  [key: string]: unknown;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Cart = {
  items: CartItem[];
};

type CartContextValue = {
  cart: Cart;
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void> | void;
  updateCartItem: (productId: string, quantity: number) => Promise<void> | void;
  removeFromCart: (productId: string) => Promise<void> | void;
  clearCart: () => Promise<void> | void;
  cartTotal: number;
};

const defaultCart: Cart = { items: [] };

const CartContext = createContext<CartContextValue>({
  cart: defaultCart,
  cartItems: [],
  addToCart: () => {},
  updateCartItem: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  cartTotal: 0,
});

export const useCart = () => useContext(CartContext);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cart, setCart] = useState<Cart>(defaultCart);

  useEffect(() => {
    // Use localStorage token for cart loading
    const token = localStorage.getItem('token');
    if (token) {
      fetchCartApi(token)
        .then(data => setCart(data ?? defaultCart))
        .catch(e => {
          console.error('Failed to load cart', e);
          setCart(defaultCart);
        });
    } else {
      setCart(defaultCart);
    }
  }, []);

  const addToCart = async (product: Product, quantity: number = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Not signed in – cannot add to cart');
      return;
    }
    try {
      const updated = await addToCartApi(token, product._id, quantity);
      setCart(updated);
    } catch (e) {
      console.error('Add to cart failed', e);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const updated = await updateCartItemApi(token, productId, quantity);
      setCart(updated);
    } catch (e) {
      console.error('Update cart item failed', e);
    }
  };
  
  const removeFromCart = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const updated = await removeFromCartApi(token, productId);
      setCart(updated);
    } catch (e) {
      console.error('Remove from cart failed', e);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await clearCartApi(token);
      setCart(defaultCart);
    } catch (e) {
      console.error('Clear cart failed', e);
    }
  };

  // Memoize the items array for performance and convenience
  const cartItems = useMemo(() => cart?.items || [], [cart]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const discountedPrice = (item.product.price * (100 - (item.product.discount || 0))) / 100;
      return sum + discountedPrice * item.quantity;
    }, 0);
  }, [cartItems]);


  return (
    <CartContext.Provider
      value={{ 
        cart,          // The full cart object { items: [...] }
        cartItems,     // --- The convenient items array ---
        addToCart, 
        updateCartItem, 
        removeFromCart, 
        clearCart, 
        cartTotal 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};