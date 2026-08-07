// src/pages/AdminOrderDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOrderById as fetchOrderByAdmin,
  updateOrderStatus as updateOrderStatusAdmin,
} from '../api/orderApi';
import axios from 'axios';
import '../css/OrderDetails.css'; // Reuse existing CSS
import AdminNavbar from './Navbar';

// Helper function to get product image
const getProductImage = (product) => {
  if (!product) return "https://placehold.co/100x100?text=No+Product";
  
  // 1. Check if we have the binary data (Buffer) from MongoDB
  if (product.images?.image1?.data) {
    const bufferData = product.images.image1.data;
    
    // If it's already a base64 string, use it directly
    if (typeof bufferData === 'string') {
      return `data:${product.images.image1.contentType};base64,${bufferData}`;
    }
    
    // If it's a Buffer object with data property, convert it in chunks
    if (bufferData.data && Array.isArray(bufferData.data)) {
      try {
        // Convert array to Uint8Array for better handling
        const uint8Array = new Uint8Array(bufferData.data);
        let binary = '';
        const chunkSize = 8192; // Process in chunks to avoid stack overflow
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        
        const base64String = btoa(binary);
        return `data:${product.images.image1.contentType};base64,${base64String}`;
      } catch (error) {
        console.error('Error converting image buffer:', error);
        return "https://placehold.co/100x100?text=Error";
      }
    }
  }
  
  // 2. Check for legacy URL
  if (product.imageUrl) return product.imageUrl;

  // 3. Fallback
  return "https://placehold.co/100x100?text=No+Image";
};

export default function AdminOrderDetailsPage() {
  const { id } = useParams(); // the order _id or business orderId
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingLink, setTrackingLink] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Not authenticated as admin');

        const data = await fetchOrderByAdmin(token, id);
        setOrder(data);
        setTrackingLink(data.trackingLink || '');
      } catch (err) {
        console.error('Failed to load order (admin):', err);
        const msg = err.response?.data?.message || err.message || 'Could not load order';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated as admin');

      const updated = await updateOrderStatusAdmin(token, id, newStatus, trackingLink);
      setOrder(updated);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Unable to change status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Not authenticated as admin');
        return;
      }
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://localhost:5000'}/api/admin/orders/${id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${order.orderId || order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice');
      console.error(err);
    }
  };

  if (loading) return <p className="center">Loading order details…</p>;
  if (error) return <p className="center error">{error}</p>;
  if (!order) return null;

  // Must match backend enum: ['Pending','Confirmed','Shipped','Delivered','Cancelled']
  const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  const canDownload = order.status === 'Delivered';

  return (
    <>
      <AdminNavbar />
      <div className="order-details-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Orders
        </button>

        <div className="order-info">
          <h2>Order #{order.orderId || order._id}</h2>
          <p>
            <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={actionLoading}
              className="status-select"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {actionLoading && <span style={{ marginLeft: '0.5rem' }}>Updating…</span>}
          </p>
          <p>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </p>
        </div>

        <div className="payment-breakdown">
          <h3>Payment Breakdown</h3>
          <div>
            <span>Items Total:</span>
            <span>₹{order.paymentBreakdown.itemsTotal.toLocaleString()}</span>
          </div>
          <div>
            <span>Tax:</span>
            <span>₹{order.paymentBreakdown.tax.toLocaleString()}</span>
          </div>
          <div>
            <span>Shipping:</span>
            <span>₹{order.paymentBreakdown.shipping.toLocaleString()}</span>
          </div>
          {order.paymentBreakdown.discount > 0 && (
            <div>
              <span>Discount:</span>
              <span>−₹{order.paymentBreakdown.discount.toLocaleString()}</span>
            </div>
          )}
          <hr />
          <div className="grand-total">
            <strong>Total:</strong>
            <strong>₹{order.paymentBreakdown.total.toLocaleString()}</strong>
          </div>
        </div>

        <div className="order-products">
          <h3>Products</h3>
          <div className="products-list">
            {order.products.map(({ product, quantity }) => (
              <div key={product._id} className="product-detail-card">
                <div className="product-image-section">
                  <img
                    src={getProductImage(product)}
                    alt={product?.name || 'Product'}
                    className="product-detail-image"
                    onError={(e) => e.target.src = "https://placehold.co/100x100?text=Error"}
                  />
                </div>
                <div className="product-info-section">
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-details-row">
                    <div className="product-detail-item">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">₹{product.price?.toLocaleString()}</span>
                    </div>
                    <div className="product-detail-item">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{quantity}</span>
                    </div>
                    <div className="product-detail-item">
                      <span className="detail-label">Subtotal:</span>
                      <span className="detail-value total-amount">₹{(product.price * quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  {product.description && (
                    <div className="product-description">
                      <span className="detail-label">Description:</span>
                      <p className="description-text">{product.description}</p>
                    </div>
                  )}
                  {product.category && (
                    <div className="product-meta">
                      <span className="meta-badge">Category: {product.category}</span>
                      {product.stock !== undefined && (
                        <span className={`meta-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-address">
          <h3>Delivery Address</h3>
          {order.userAddress ? (
            <>
              <p>{order.userAddress.fullName}</p>
              <p>
                {order.userAddress.flat}, {order.userAddress.area}
              </p>
              <p>
                {order.userAddress.city} – {order.userAddress.pincode}
              </p>
              <p>{order.userAddress.state}</p>
              <p>Phone: {order.userAddress.phone}</p>
            </>
          ) : (
            <p className="address-not-available">Address information not available</p>
          )}
        </div>

        <div className="order-actions">
          <button
            className={`invoice-btn ${!canDownload ? 'disabled' : ''}`}
            onClick={handleDownloadInvoice}
            disabled={!canDownload}
          >
            Download Invoice
          </button>
        </div>

        <div className="order-tracking">
          <h3>Shipment Tracking</h3>
          <div className="tracking-input-section">
            <label htmlFor="trackingLink">Tracking Link (from shipping company):</label>
            <input
              id="trackingLink"
              type="url"
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
              placeholder="https://tracking.example.com/track?id=123456"
              className="tracking-input"
            />
            <p className="tracking-note">
              ℹ️ Add the tracking link here. It will only be visible to customers when order status is "Shipped" or "Delivered".
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
