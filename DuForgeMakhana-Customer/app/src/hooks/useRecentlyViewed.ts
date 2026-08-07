import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mk_recently_viewed";
const MAX_ITEMS = 8;

export interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  category?: string;
  imageUrl?: string;
  viewedAt: number;
}

const readStore = (): RecentProduct[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Track and read products the shopper has recently opened. */
export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    setItems(readStore());
  }, []);

  const addRecentlyViewed = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    if (typeof window === "undefined" || !product?._id) return;
    const next = [
      { ...product, viewedAt: Date.now() },
      ...readStore().filter((p) => p._id !== product._id),
    ].slice(0, MAX_ITEMS);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full/unavailable — feature degrades silently
    }
    setItems(next);
  }, []);

  return { recentlyViewed: items, addRecentlyViewed };
}
