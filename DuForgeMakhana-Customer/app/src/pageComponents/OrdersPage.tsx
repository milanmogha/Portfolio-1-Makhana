// src/pages/OrdersPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyOrders } from '../api/orderApi';

type Product = {
  _id?: string;
  name?: string;
  price: number;
  discount?: number;
  imageUrl?: string;
};

type OrderProduct = { product?: Product; quantity: number };
type OrderProductWithProduct = { product: Product; quantity: number };

type Order = {
  _id: string;
  orderId: string;
  createdAt: string;
  status: string;
  paymentBreakdown: { total: number };
  products: OrderProduct[];
};

interface FormatPrice {
  (amount: number): string;
}

const formatPrice: FormatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth() as { user: any };
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const data = await getMyOrders(token);
        const safeData = Array.isArray(data) ? data as Order[] : [];
        setOrders(safeData);
        setFilteredOrders(safeData);
      } catch (err) {
        console.error('Failed to load orders', err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Could not load your orders."
        );
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user]);

  // Filter orders based on active tab
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(
        orders.filter(o =>
          ['pending', 'shipped', 'confirmed'].includes(o.status.toLowerCase())
        )
      );
    } else if (activeTab === 'delivered') {
      setFilteredOrders(orders.filter(o => o.status.toLowerCase() === 'delivered'));
    } else if (activeTab === 'cancelled') {
      setFilteredOrders(orders.filter(o => o.status.toLowerCase() === 'cancelled'));
    }
  }, [activeTab, orders]);

  const handleTabClick = (tabName: string) => setActiveTab(tabName);

  if (loading) return <p className="center">Loading your orders…</p>;
  if (error) return <p className="center error">{error}</p>;
  if (!orders.length) return <p className="center">You have no orders yet.</p>;

  // FIXED: Read product.imageUrl ONLY
  const renderProductItem = (product: Product, quantity: number) => {
    let imageSrc = "/images/placeholder.jpg";

    if (product.imageUrl) {
      imageSrc = product.imageUrl;
    }

    const discountedPrice =
      (product.price * (100 - (product.discount || 0))) / 100;

    return { imageSrc, discountedPrice };
  };

  return (
    <>
      {toastMessage && <div className="order-toast">{toastMessage}</div>}

      <div className="orders-container">
        <h1>My Orders</h1>

        {/* Tabs */}
        <div className="status-tabs">
          <button
            className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            On Shipping
          </button>
          <button
            className={`status-tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => handleTabClick('delivered')}
          >
            Arrived
          </button>
          <button
            className={`status-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => handleTabClick('cancelled')}
          >
            Canceled
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="center">No orders found.</p>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-header-info">
                  <div>
                    <strong>Order ID</strong>
                    <span className="order-id">{order.orderId}</span>
                  </div>
                  <div>
                    <strong>Estimated arrival</strong>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <span className={`status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <strong>Total</strong>
                    <span className="order-total">
                      {formatPrice(order.paymentBreakdown.total)}
                    </span>
                  </div>
                </div>

                <div className="order-header-actions">
                  <button
                    className="buy-again-btn"
                    onClick={() =>
                      setToastMessage(`Feature simulation for ${order.orderId}`)
                    }
                  >
                    Buy Again
                  </button>
                  <Link to={`/orders/${order._id}`} className="view-order-btn">
                    Details
                  </Link>
                </div>
              </div>

              {/* Product Rendering */}
              {order.products.length < 3 ? (
                <div className="order-products-list">
                      {order.products.filter((p): p is OrderProductWithProduct => !!p.product).map(({ product, quantity }) => {
                        const { imageSrc, discountedPrice } = renderProductItem(product, quantity);
                    return (
                      <div key={product._id} className="list-item">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="list-item-image"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/images/placeholder.jpg")}
                        />
                        <div className="list-item-details">
                          <span className="list-item-name">{product.name}</span>
                          <span className="list-item-qty">Qty: {quantity}</span>
                          <span className="list-item-price">
                            {formatPrice(discountedPrice * quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="order-products-grid">
                  {order.products.filter((p): p is OrderProductWithProduct => !!p.product).map(({ product, quantity }) => {
                    const { imageSrc, discountedPrice } = renderProductItem(product, quantity);
                    return (
                      <div key={product._id} className="product-cell">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="product-thumb"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/images/placeholder.jpg")}
                        />
                        <div className="product-info">
                          <p className="product-name">{product.name}</p>
                          <p className="product-qty">Qty: {quantity}</p>
                          <p className="product-price">
                            {formatPrice(discountedPrice * quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
