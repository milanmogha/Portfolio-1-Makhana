// src/api/cartApi.js

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';

/**
 * Fetch the current user's cart (creates one if none exists).
 * @param {string} token  JWT auth token
 * @returns {Promise<Object>}  The cart object
 */
export const getCart = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

/**
 * Add a product to the cart (or increase its quantity).
 * @param {string} token      JWT auth token
 * @param {string} productId  ID of the product to add
 * @param {number} quantity   Quantity to add (default = 1)
 * @returns {Promise<Object>} The updated cart
 */
export const addToCart = async (token: string, productId: string, quantity: number = 1) => {
  const res = await axios.post(
    `${BASE_URL}/api/cart`,
    { productId, quantity },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

/**
 * Update the quantity of a specific cart item.
 * @param {string} token      JWT auth token
 * @param {string} productId  ID of the product to update
 * @param {number} quantity   New quantity (set to 0 to remove)
 * @returns {Promise<Object>} The updated cart
 */
export const updateCartItem = async (token: string, productId: string, quantity: number) => {
  const res = await axios.put(
    `${BASE_URL}/api/cart`,
    { productId, quantity },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

/**
 * Remove a specific product from the cart.
 * @param {string} token      JWT auth token
 * @param {string} productId  ID of the product to remove
 * @returns {Promise<Object>} The updated cart
 */
export const removeFromCart = async (token: string, productId: string) => {
  const res = await axios.delete(`${BASE_URL}/api/cart/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

/**
 * Clear all items from the cart.
 * @param {string} token  JWT auth token
 * @returns {Promise<Object>} Confirmation message
 */
export const clearCart = async (token: string) => {
  const res = await axios.delete(`${BASE_URL}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
