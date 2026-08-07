// src/api/BannerApi.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';
const ADMIN_BASE = `${BASE_URL}/api/banners`;

function authHeaders(multipart = false) {
  const token = localStorage.getItem('adminToken'); // ✅ fixed key
  return {
    Authorization: `Bearer ${token}`,
    ...(multipart ? {} : { 'Content-Type': 'application/json' })
  };
}

// GET all banners
export const fetchBanners = () =>
  axios
    .get(ADMIN_BASE, { headers: authHeaders() })
    .then((res) => res.data);

// POST create banner (formData)
export const createBanner = (formData) =>
  axios
    .post(ADMIN_BASE, formData, {
      headers: authHeaders(true), // ✅ multipart = true
    })
    .then((res) => res.data);

// DELETE a banner by ID
export const deleteBanner = (id) =>
  axios
    .delete(`${ADMIN_BASE}/${id}`, { headers: authHeaders() })
    .then((res) => res.data);
