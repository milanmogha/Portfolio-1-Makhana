
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null; // or a spinner
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
