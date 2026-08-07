// src/api/wishlistApi.js

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';
const BASE_URL = `${API_URL}/api/wishlist`;

// Helper to get auth headers
const getAuthHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Fetch the user's wishlist
export const fetchWishlist = async (token: string) => {
  const response = await axios.get(BASE_URL, getAuthHeaders(token));
  return response.data;
};

// Add a product to the wishlist
export const addItemToWishlist = async (token: string, productId: string) => {
  const response = await axios.post(BASE_URL, { productId }, getAuthHeaders(token));
  return response.data;
};

// Remove a product from the wishlist
export const removeItemFromWishlist = async (token: string, productId: string) => {
  const response = await axios.delete(`${BASE_URL}/${productId}`, getAuthHeaders(token));
  return response.data;
};