// frontend/src/api/productApi.js

import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/').replace(/\/$/, '');
const BASE_URL = `${API_URL}/api/products`;

// Ask the backend for URL-based images (no base64 payload). Falls back
// gracefully: older backends ignore the param and still send base64,
// which utils/productImages.ts knows how to render.
const LIGHT_IMAGES = { images: 'urls' };
interface ProductFilters {
  category?: string;
  priceRange?: string;
  sort?: string;
  search?: string;
}

// --- MODIFIED: This function now sends filters to the backend ---
export const getAllProducts = async (filters: ProductFilters = {}) => {
  // Use URLSearchParams to easily build the query string
  const params = new URLSearchParams(LIGHT_IMAGES);

  if (filters.category) params.append('category', filters.category);
  if (filters.priceRange) params.append('priceRange', filters.priceRange);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.search) params.append('search', filters.search);

  // axios will automatically append the params as a query string (e.g., "?category=BEDROOM&...")
  const res = await axios.get(BASE_URL, { params });
  return res.data;
};

// This can now be removed or kept if you have direct category links elsewhere
export const getProductsByCategory = async (category: string) => {
  if (!category) return getAllProducts();
  const res = await axios.get(`${BASE_URL}/category/${encodeURIComponent(category)}`, { params: LIGHT_IMAGES });
  return res.data;
};

// This function remains the same
export const getProductById = async (id: string) => {
  const res = await axios.get(`${BASE_URL}/${id}`, { params: LIGHT_IMAGES });
  return res.data;
};

// Lightweight autocomplete for the navbar search (no images in payload)
export const getProductSuggestions = async (q: string) => {
  const res = await axios.get(`${BASE_URL}/suggest`, { params: { q } });
  return res.data;
};