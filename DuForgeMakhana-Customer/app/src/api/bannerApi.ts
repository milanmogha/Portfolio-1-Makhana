// src/api/bannerApi.js

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';

/**
 * Fetch all public banners to display in the customer portal
 * @returns {Promise<Array>}
 */
export const getPublicBanners = async () => {
  const res = await axios.get(`${BASE_URL}/api/banners/public`);
  return res.data;
};
