// src/pages/OrderDetailsPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getOrder, updateOrderStatus } from '../api/orderApi';
import axios from 'axios';
import socket from '../sockets';
import ProductReview from './ProductReview';
import OrderTracker from '../components/OrderTracker';

type Product = {
  _id?: string;
  name?: string;
  price: number;
  discount?: number;
  description?: string;
  imageUrl?: string;
};

type Order = {
  _id: string;
  orderId: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentBreakdown: { itemsTotal: number; tax: number; shipping: number; discount: number; total: number };
  trackingLink?: string;
  products: { product?: Product; quantity: number }[];
  userAddress: { fullName: string; flat: string; area?: string; city: string; state: string; pincode: string; phone: string };
};

type Props = { id?: string };
export default function OrderDetailsPage({ id: propId }: Props) {
  const { id: routeId } = useParams();
  const id = propId || routeId;
  const navigate = useNavigate();
  const { user } = useAuth() as { user: any };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) throw new Error('Not authenticated');
        if (!id) throw new Error('Order ID is missing');
        const data: Order = await getOrder(token, id as string);
        setOrder(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Failed to load order', err);
          setError(err.message || 'Could not load order');
        } else {
          setError('Could not load order');
        }
      } finally {
        setLoading(false);
      }
    })();

    // Listen for real-time order status updates
    interface OrderStatusUpdateData {
      orderId: string;
      status: string;
      order?: Partial<Order>;
    }

    const handleOrderStatusUpdate = (data: OrderStatusUpdateData) => {
      console.log('🔔 Order status updated (details page):', data);

      // Only update if this is the current order
      if (data.orderId === id) {
      setOrder(prevOrder =>
        prevOrder
        ? {
          ...prevOrder,
          status: data.status,
          ...data.order,
          }
        : prevOrder
      );
      }
    };

    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [id, user]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      if (!id) throw new Error('Order ID is missing');
      const updated: Order = await updateOrderStatus(token, id as string, 'Cancelled');
      setOrder(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Unable to cancel order');
      } else {
        alert('Unable to cancel order');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      if (!user) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Not authenticated');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/'}/api/orders/${id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        if (!order) return;
        link.setAttribute('download', `invoice_${order.orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      alert('Failed to download invoice');
      console.error(err);
    }
  };

  if (loading) return <p className="center">Loading order details…</p>;
  if (error) return <p className="center error">{error}</p>;
  if (!order) return <p className="center">Order not found.</p>;

  const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered';
  const canDownload = order.status === 'Delivered';

  return (
    <div className="order-details-page">

      <div className="order-info">
        <h2>Order #{order.orderId}</h2>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></p>
        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
      </div>

      <div className="payment-breakdown">
        <h3>Payment Breakdown</h3>
        <div><span>Items Total:</span><span>₹{order.paymentBreakdown.itemsTotal.toLocaleString()}</span></div>
        <div><span>Tax:</span><span>₹{order.paymentBreakdown.tax.toLocaleString()}</span></div>
        <div><span>Shipping:</span><span>₹{order.paymentBreakdown.shipping.toLocaleString()}</span></div>
        {order.paymentBreakdown.discount > 0 && (
          <div><span>Discount:</span><span>-₹{order.paymentBreakdown.discount.toLocaleString()}</span></div>
        )}
        <hr />
        <div className="grand-total">
          <strong>Total:</strong>
          <strong>₹{order.paymentBreakdown.total.toLocaleString()}</strong>
        </div>
      </div>

      <div className="order-products">
        <h3>Products</h3>
        <div className="products-grid">
          {order.products.filter((item): item is { product: Product; quantity: number } => !!item.product).map(({ product, quantity }) => {
            
            // FIXED: Always use product.imageUrl
            const imageSrc = product.imageUrl || "/images/placeholder.jpg";
            const discountPct = product.discount ?? 0;
            const discountedPrice = (product.price * (100 - discountPct)) / 100;

            return (
              <div key={product._id} className="product-tab">
                <Link 
                  to={`/products/${product._id}`} 
                  className="product-tab-link"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <img
                    src={imageSrc}
                    alt={product.name}
                    onError={(e) => ((e.target as HTMLImageElement).src = "/images/placeholder.jpg")}
                  />
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <p className="product-price-detail">
                      Price: ₹{product.price.toLocaleString()}
                      {discountPct > 0 && (
                        <span className="product-discount-detail"> ({discountPct}% off)</span>
                      )}
                    </p>
                    <p>Quantity: {quantity}</p>
                    {product.description && (
                      <p className="product-desc">{product.description}</p>
                    )}
                    <p className="product-subtotal">
                      <strong>Subtotal: ₹{(discountedPrice * quantity).toLocaleString()}</strong>
                    </p>
                  </div>
                </Link>

                {order.status === 'Delivered' && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ProductReview productId={product._id ?? ''} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <OrderTracker 
        status={order.status} 
        trackingLink={order.trackingLink} 
        createdAt={order.createdAt}
      />

      <div className="order-address">
        <h3>Delivery Address</h3>
        {order.userAddress ? (
          <>
            <p>{order.userAddress.fullName}</p>
            <p>{order.userAddress.flat}, {order.userAddress.area}</p>
            <p>{order.userAddress.city} – {order.userAddress.pincode}</p>
            <p>{order.userAddress.state}</p>
            <p>Phone: {order.userAddress.phone}</p>
          </>
        ) : (
          <p>No address available</p>
        )}
      </div>

      <div className="order-actions">
        {canCancel && (
          <button className="cancel-btn" onClick={handleCancel} disabled={actionLoading}>
            {actionLoading ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}

        <button
          className={`invoice-btn ${!canDownload ? 'disabled' : ''}`}
          onClick={handleDownloadInvoice}
          disabled={!canDownload}
        >
          Download Invoice
        </button>
      </div>
    </div>
  );
}
