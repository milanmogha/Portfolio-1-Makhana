import axios from 'axios';


// Respect env first, fallback to localhost for dev
const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

/**
 * Attempt to log in as admin
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string }>} JWT token on success
 */
export async function loginAdmin({ email, password }) {
  const response = await axios.post(
    `${BASE_URL}/api/admin/login`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}
