import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BannerPage from './pages/Banner';   
import ProtectedRoute from './components/ProtectedRoute';
import ProductPage from './pages/Product';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import CouponPage from './pages/Coupon';
import AdminOrders from './pages/Orders';
import AdminOrderDetails from './pages/OrderDetails';
import UsersPage from './pages/Users';
import AdminProductDetails from './pages/ProductDetails';
import BlogPage from './pages/Blog';
import BlogForm from './pages/BlogForm';
import './css/ConfirmationModal.css'; 


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public/customer routes */}
        <Route path="/login" element={<Login />} />
        
        {/* admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/banners" 
          element={
            <ProtectedRoute>
              <BannerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/coupon" 
          element={
            <ProtectedRoute>
              <CouponPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/admin/products" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
        <Route path="/admin/products/add" element={<ProtectedRoute><AddProductPage /></ProtectedRoute>} />
        <Route path="/admin/products/edit/:id" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
        <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/products/:id" element={<AdminProductDetails />} />
        <Route path="/admin/blogs" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
        <Route path="/admin/blogs/add" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
        <Route path="/admin/blogs/edit/:id" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

