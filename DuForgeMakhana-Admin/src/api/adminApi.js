import axios from 'axios';

// Use env first, fallback to localhost for dev
const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';
const ADMIN_BASE = `${BASE_URL}/api/admin`;

export async function loginAdmin(email, password) {
  const { data } = await axios.post(`${ADMIN_BASE}/login`, { email, password });
  return data; // { token, adminInfo… }
}

// e.g. fetch dashboard stats
export async function fetchStats() {
  const token = localStorage.getItem('adminToken');
  const { data } = await axios.get(`${ADMIN_BASE}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}
