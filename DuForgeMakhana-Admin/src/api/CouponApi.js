// src/api/CouponApi.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

/**
 * Create a new coupon (admin only)
 * @param {string} adminToken – Admin JWT
 * @param {Object} data – Coupon details. Possible properties:
 * {
 * code:              string,   // required, e.g. "SPRING2025"
 * heading:           string,   // required
 * description:       string,   // required
 * expiryDate:        string,   // required, ISO timestamp
 * usageLimit:        number,   // optional (default 1)
 * minOrderValue:     number,   // optional (default 0)
 * discountPercent:   number,   // optional (default 0)
 * discountAmount:    number,   // optional (default 0)
 * maxDiscountAmount: number,   // optional (default 0), cap for percentage discount
 * visible:           boolean,  // optional (default true)
// ...existing code...
 * }
 */
export const createCoupon = async (adminToken, data) => {
  if (!adminToken) {
    throw new Error('Missing admin authentication token');
  }

  const res = await axios.post(
    `${BASE_URL}/api/admin/coupons`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  return res.data;
};

/**
 * Fetch all coupons (admin only)
 * @param {string} adminToken – Admin JWT
 */
export const fetchAllCoupons = async (adminToken) => {
  if (!adminToken) {
    throw new Error('Missing admin authentication token');
  }

  const res = await axios.get(`${BASE_URL}/api/admin/coupons`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  return res.data;
};

/**
 * Update a coupon by ID (admin only)
 * @param {string} adminToken – Admin JWT
 * @param {string} id         – Coupon ID
 * @param {Object} data       – Updated coupon data. Possible properties:
 * {
 * code:              string,   // required
 * heading:           string,   // required
 * description:       string,   // required
 * expiryDate:        string,   // required, ISO timestamp
 * usageLimit:        number,   // optional
 * minOrderValue:     number,   // optional
 * discountPercent:   number,   // optional
 * discountAmount:    number,   // optional
 * maxDiscountAmount: number,   // optional
 * visible:           boolean,  // optional
 * assignedTo:        string    // optional
 * }
 */
export const updateCoupon = async (adminToken, id, data) => {
  if (!adminToken) {
    throw new Error('Missing admin authentication token');
  }

  const res = await axios.put(
    `${BASE_URL}/api/admin/coupons/${id}`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  return res.data;
};

/**
 * Delete a coupon by ID (admin only)
 * @param {string} adminToken – Admin JWT
 * @param {string} id         – Coupon ID
 */
export const deleteCoupon = async (adminToken, id) => {
  if (!adminToken) {
    throw new Error('Missing admin authentication token');
  }

  const res = await axios.delete(`${BASE_URL}/api/admin/coupons/${id}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  return res.data;
};