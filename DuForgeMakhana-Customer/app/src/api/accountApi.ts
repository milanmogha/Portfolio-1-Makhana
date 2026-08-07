// src/api/accountApi.js

// import { getAuth } from 'firebase/auth';

// Use the same env var as the rest of the app (NEXT_PUBLIC_API_URL). The old
// NEXT_PUBLIC_API_BASE was never set, so this silently hit the dead production
// domain and the account page hung on "loading" forever.
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000').replace(/\/$/, '');
const API_BASE = `${API_ROOT}/api/users/profile`;

/**
 * Fetch the current user’s profile.
 * @returns {Promise<{ name: string, email: string, phone: string, ... }>}
 * @throws {Error} if the request fails
 */
export async function getProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const res = await fetch(API_BASE, {
    method: 'GET',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errMsg = `Failed to fetch profile (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errMsg = json.error;
    } catch {
      /* ignore JSON parse */
    }
    throw new Error(errMsg);
  }

  return res.json();
}

/**
 * Update the current user’s profile fields.
 * @param {Partial<{ name: string, email: string, phone: string }>} updates
 * @returns {Promise<{ name: string, email: string, phone: string, ... }>}
 * @throws {Error} if validation fails or server error occurs
 */
export async function updateProfile(updates: Partial<{ name: string; email: string; phone: string }>) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const res = await fetch(API_BASE, {
    method: 'PUT',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
    }),
  });

  if (!res.ok) {
    let errMsg = `Failed to update profile (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errMsg = json.error;
    } catch {
      /* ignore JSON parse */
    }
    throw new Error(errMsg);
  }

  return res.json();
}

/**
 * Delete the current logged‐in user’s account.
 * @returns {Promise<{ message: string }>}
 * @throws {Error} if deletion fails
 */
export async function deleteProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const res = await fetch(API_BASE, {
    method: 'DELETE',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errMsg = `Failed to delete account (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errMsg = json.error;
    } catch {
      /* ignore JSON parse */
    }
    throw new Error(errMsg);
  }

  return res.json(); // { message: 'User account deleted successfully' }
}
