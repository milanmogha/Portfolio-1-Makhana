// src/hooks/useAuth.js

import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Simple re-export for compatibility
export const useAuth = () => {
  return useAuthContext();
};