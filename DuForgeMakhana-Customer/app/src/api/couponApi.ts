// src/api/couponApi.js

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';

/**
 * Fetch all visible + non-expired coupons (public)
 * GET /api/coupons
 */
export const fetchAvailableCoupons = async () => {
  console.log('[couponApi] fetchAvailableCoupons → GET /api/coupons');
  try {
    const res = await axios.get(`${BASE_URL}/api/coupons`);
    console.log('[couponApi] fetchAvailableCoupons response:', res.data);
    return res.data;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      console.error('[couponApi] fetchAvailableCoupons error:', errorObj.response?.data || errorObj.message);
      const msg = errorObj.response?.data?.error || errorObj.message || 'Failed to fetch coupons';
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || 'Failed to fetch coupons';
      console.error('[couponApi] fetchAvailableCoupons error:', errorMsg);
      throw new Error(errorMsg);
    }
  }
};

/**
 * Apply a coupon code (requires Firebase auth)
 * POST /api/coupons/apply
 *
 * @param {string} code       Coupon code (string)
 * @param {number} orderTotal Total amount before discount
 * @param {string} token      Firebase ID token (Bearer)
 * @returns {Promise<{ code: string, discount: number }>}
 */
export const applyCoupon = async (code: string, orderTotal: number, token: string) => {
  console.log(
    '[couponApi] applyCoupon called with:',
    { code, orderTotal, token: token ? '<<REDACTED>>' : null }
  );
  if (!token) {
    console.warn('[couponApi] applyCoupon missing token');
    throw new Error('Missing authentication token');
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/api/coupons/apply`,
      { code, orderTotal },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('[couponApi] applyCoupon success:', res.data);
    return res.data; // { code: 'XXXX', discount: Number }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      console.error('[couponApi] applyCoupon error response data:', errorObj.response.data);
      console.error('[couponApi] applyCoupon error response status:', errorObj.response.status);
      const msg = errorObj.response?.data?.error || errorObj.message || 'Failed to apply coupon';
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || 'Failed to apply coupon';
      console.error('[couponApi] applyCoupon network/error:', errorMsg);
      throw new Error(errorMsg);
    }
  }
};
