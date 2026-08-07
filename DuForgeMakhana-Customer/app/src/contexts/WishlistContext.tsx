// src/pages/WishlistContext.tsx


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fetchWishlist, addItemToWishlist, removeItemFromWishlist } from '../api/wishlistApi';

type WishlistProduct = {
  _id: string;
  name?: string;
  category?: string;
  price?: number;
  image?: string;
  imageUrl?: string;
  images?: Record<string, { data?: string; contentType?: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

type WishlistContextValue = {
  wishlistItems: WishlistProduct[];
  addToWishlist: (product: WishlistProduct) => Promise<void> | void;
  removeFromWishlist: (productId: string) => Promise<void> | void;
};

const WishlistContext = createContext<WishlistContextValue>({
  wishlistItems: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
});

export const useWishlist = () => useContext(WishlistContext);

type WishlistProviderProps = { children: ReactNode };

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  // Effect to load wishlist when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchWishlist(token)
        .then(serverWishlist => setWishlistItems(serverWishlist.items || []))
        .catch(error => {
          console.error("Failed to fetch wishlist:", error);
          setWishlistItems([]);
        });
    } else {
      setWishlistItems([]);
    }
  }, []);

  const addToWishlist = async (product: WishlistProduct) => {
    const token = localStorage.getItem('token');
    if (!token || !product?._id) return;

    // Optimistic UI update: Add immediately to the frontend state
    setWishlistItems((prev) => {
      const exists = prev.some((p) => p._id === product._id);
      return exists ? prev : [...prev, product];
    });

    // Call the backend to save the change
    try {
      await addItemToWishlist(token, product._id);
    } catch (error) {
      console.error("Failed to add item to wishlist:", error);
      // Revert optimistic update on error
      setWishlistItems((prev) => prev.filter((p) => p._id !== product._id));
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token || !productId) return;

    const originalItems = [...wishlistItems];
    // Optimistic UI update: Remove immediately
    setWishlistItems((prev) => prev.filter((p) => p._id !== productId));
    
    // Call the backend
    try {
      await removeItemFromWishlist(token, productId);
    } catch (error) {
      console.error("Failed to remove item from wishlist:", error);
      // Revert on error
      setWishlistItems(originalItems);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};