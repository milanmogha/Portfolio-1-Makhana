import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

/**
 * Fetch all users (admin only)
 * @param {string} adminToken – Admin JWT
 * @returns {Promise<Array>} – array of user objects
 */
export const fetchAllUsers = async (adminToken) => {
  if (!adminToken) {
    throw new Error('Missing admin authentication token');
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    return res.data; // array of { _id, phone, name, email, role, createdAt }
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Failed to fetch users';
    throw new Error(msg);
  }
};
