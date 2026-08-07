// Utility to format price as INR currency
const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// src/pages/CheckoutPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../api/orderApi';
import { fetchAddresses, createAddress } from '../api/addressApi';
import { fetchAvailableCoupons, applyCoupon as applyCouponAPI } from '../api/couponApi';
import { useAuth } from '../hooks/useAuth';
import { productThumbUrl } from '../utils/productImages';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faPlus, faShieldHalved, faCreditCard, faMoneyBill1, faTruckFast } from '@fortawesome/free-solid-svg-icons';

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  flat: string;
  area: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type Coupon = {
  code: string;
  heading: string;
  description: string;
};

type Charges = {
  itemsTotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string | null;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayErrorResponse = {
  error: { description?: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';

const BLANK_ADDRESS_FORM: Address = {
  fullName: '', phone: '', flat: '', area: '', landmark: '', pincode: '', city: '', state: '', isDefault: false,
};

const loadRazorpayScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Razorpay script can only be loaded in the browser.'));
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load.'));
    document.body.appendChild(script);
  });

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth() as { user: any; loading: boolean };
  const { cart, clearCart, cartTotal } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<Address>(BLANK_ADDRESS_FORM);

  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // --- New Coupon State ---
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [customCouponInput, setCustomCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [discountValue, setDiscountValue] = useState(0);

  // --- Fetch Addresses and Coupons on User Load ---
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoadingAddresses(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Not authenticated');
          const [fetchedAddresses, fetchedCoupons] = await Promise.all([
            fetchAddresses(token),
            fetchAvailableCoupons()
          ]);

          setAddresses(fetchedAddresses || []);
          if (fetchedAddresses?.length > 0) {
            const defaultAddress = fetchedAddresses.find((a: Address) => a.isDefault) || fetchedAddresses[0];
            setSelectedAddressId(defaultAddress?._id ?? '');
            setShowAddressForm(false);
          } else {
            setShowAddressForm(true);
          }

          setAvailableCoupons(fetchedCoupons || []);

        } catch (err) {
          setError("Could not load page data.");
          console.error(err);
        } finally {
          setLoadingAddresses(false);
        }
      };
      loadData();
    } else {
      setLoadingAddresses(false);
    }
  }, [user]);

  // --- Price Calculation ---
  // The server is the single source of truth: whenever the address, cart or
  // coupon changes we ask the API for the exact charges it will enforce at
  // payment verification. The local numbers are only a pre-address estimate.
  const [charges, setCharges] = useState<Charges | null>(null);
  const [loadingCharges, setLoadingCharges] = useState(false);

  useEffect(() => {
    if (!user || !selectedAddressId || cart.items.length === 0) {
      setCharges(null);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    let cancelled = false;
    const fetchCharges = async () => {
      setLoadingCharges(true);
      try {
        const { data } = await axios.post(
          `${API_URL}/api/charges/calculate-dynamic`,
          {
            addressId: selectedAddressId,
            products: cart.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
            couponCode: selectedCouponCode || null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setCharges(data);
      } catch (err) {
        console.error('Failed to fetch charges', err);
        if (!cancelled) setCharges(null);
      } finally {
        if (!cancelled) setLoadingCharges(false);
      }
    };
    fetchCharges();
    return () => { cancelled = true; };
  }, [user, selectedAddressId, cart.items, selectedCouponCode]);

  const itemsTotal = charges?.itemsTotal ?? cartTotal;
  const effectiveDiscount = charges?.discount ?? discountValue;
  const tax = charges?.tax ?? Math.round((itemsTotal - effectiveDiscount) * 0.1);
  const deliveryFee = charges?.shipping ?? (itemsTotal > 0 ? 99 : 0);
  const grandTotal = charges?.total ?? (itemsTotal - effectiveDiscount + tax + deliveryFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setNewAddressForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCancelAddNew = () => {
    setShowAddressForm(false);
    setNewAddressForm(BLANK_ADDRESS_FORM);
    setError('');
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress?._id ?? '');
    }
  };

  const getFinalAddressId = async (token: string) => {
    if (showAddressForm) {
      if (!newAddressForm.fullName || !newAddressForm.flat || !newAddressForm.pincode) {
        throw new Error('Please fill in all required fields for the new address.');
      }
      const newAddress = await createAddress(token, newAddressForm);
      if (!newAddress?._id) throw new Error('Address could not be saved.');
      return newAddress._id;
    }
    if (!selectedAddressId) {
      throw new Error('Please select a delivery address.');
    }
    return selectedAddressId;
  };

  // --- Coupon Logic ---
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || customCouponInput).trim().toUpperCase();
    if (!code) return;
    setCouponError('');

    if (!user) {
      setCouponError('Please sign in to apply coupons.');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Not authenticated');
      // Use the API to validate the coupon and get the discount amount
      const { discount } = await applyCouponAPI(code, itemsTotal, token);
      setDiscountValue(discount);
      setSelectedCouponCode(code);
      setCustomCouponInput(''); // Clear input on success
    } catch (err: unknown) {
      console.error('Apply coupon failed', err);
      if (err instanceof Error) {
        setCouponError(err.message);
      } else {
        setCouponError("An unknown error occurred while applying the coupon.");
      }
      setDiscountValue(0);
      setSelectedCouponCode('');
    }
  };

  // --- Place Order Logic ---
  const handlePlaceOrder = async () => {
    setError('');
    if ((!selectedAddressId && !showAddressForm) || couponError) {
      setError(couponError || 'Please select or add a shipping address.');
      return;
    }
    setPlacingOrder(true);

    if (!user) {
      setError('Please sign in to place an order.');
      setPlacingOrder(false);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Not authenticated');
      const finalAddressId = await getFinalAddressId(token);

      const orderPayload = {
        userAddress: finalAddressId,
        paymentMethod,
        products: cart.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
        // Indicative only — the backend always recomputes the breakdown
        paymentBreakdown: { itemsTotal, tax, shipping: deliveryFee, discount: effectiveDiscount, total: grandTotal },
        couponCode: selectedCouponCode || null, // Pass applied coupon code
      };

      if (paymentMethod === 'Online') {
        try {
          await loadRazorpayScript();
        } catch (scriptErr) {
          console.error('Failed to load Razorpay script', scriptErr);
          setError('Failed to load payment gateway. Please try again.');
          setPlacingOrder(false);
          return;
        }

        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          console.error('Razorpay key is missing in environment');
          setError('Payment gateway is not configured. Please try another method or contact support.');
          setPlacingOrder(false);
          return;
        }

        try {
          // The API computes the payable amount itself from the cart contents
          const { data: razorpayOrder } = await axios.post(`${API_URL}/api/payment/create-order`,
            {
              products: orderPayload.products,
              addressId: finalAddressId,
              couponCode: orderPayload.couponCode,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const options = {
            key: razorpayKey,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "Makhana E-Store",
            description: "Order Payment",
            order_id: razorpayOrder.id,
            handler: async (response: RazorpaySuccessResponse) => {
              setPlacingOrder(true);
              try {
                const verificationPayload = {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: razorpayOrder.id,
                  razorpay_signature: response.razorpay_signature,
                  // Wrap order data as expected by backend
                  orderCreationData: {
                    products: orderPayload.products,
                    paymentBreakdown: orderPayload.paymentBreakdown,
                    userAddress: orderPayload.userAddress,
                    couponCode: orderPayload.couponCode || null,
                  },
                };
                const { data: verifyResponse } = await axios.post(`${API_URL}/api/payment/verify`, verificationPayload, { headers: { Authorization: `Bearer ${token}` } });

                // Backend already created the order during verification, just navigate to it
                clearCart();
                navigate(`/orders/${verifyResponse.order._id}`);
              } catch (err: unknown) {
                console.error('Payment verification failed', err);
                if (err instanceof Error) {
                  setError(`Payment verification failed: ${err.message}`);
                } else {
                  setError("Payment verification failed. Please contact support.");
                }
                setPlacingOrder(false);
              }
            },
            prefill: { name: user.displayName || user.name || 'Customer', email: user.email, contact: user.phoneNumber || user.phone },
            theme: { color: "#1B4D3E" },
          };

          if (typeof window !== 'undefined') {
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (response: RazorpayErrorResponse) => {
              setError(`Payment Failed: ${response.error.description || 'An unknown error occurred.'}`);
              setPlacingOrder(false);
            });
            rzp.open();
            setPlacingOrder(false); // Allow user to close Razorpay popup without being stuck
          }
        } catch (err: unknown) {
          console.error('Payment setup failed', err);
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An error occurred while setting up payment.');
          }
          setPlacingOrder(false);
        }

      } else if (paymentMethod === 'CashOnDelivery') {
        const createdOrder = await createOrder(token, orderPayload);
        clearCart();
        navigate(`/orders/${createdOrder._id}`);
      }
    } catch (err: unknown) {
      console.error('Place order failed', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
      setPlacingOrder(false);
    }
  };

  // --- JSX Rendering ---
  if (authLoading || loadingAddresses) {
    return <div className="loading-container">Loading Checkout…</div>;
  }

  if (!cart.items.length) {
    return <div className="empty-cart-message">Your cart is empty. <Link to="/products">Continue shopping</Link>.</div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-head">
        <nav className="checkout-crumbs" aria-label="Breadcrumb">
          <Link to="/products">Shop</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Checkout</span>
        </nav>
        <h1>Checkout</h1>
        <p className="checkout-secure-note"><FontAwesomeIcon icon={faShieldHalved} /> Secure, encrypted checkout</p>
      </div>

      <div className="checkout-grid">
        <div className="checkout-main">
          {/* --- Step 1: Shipping Address --- */}
          <section className="co-section">
            <div className="co-section-head">
              <span className="co-step">1</span>
              <h2>Shipping Address</h2>
            </div>
            {addresses.length > 0 && !showAddressForm
              ? (
                <div className="co-address-list">
                  {addresses.map(addr => (
                    <label key={addr._id} className={`co-address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}>
                      <input type="radio" name="address" value={addr._id} checked={selectedAddressId === addr._id}
                        onChange={() => { setSelectedAddressId(addr._id ?? ''); setShowAddressForm(false); setError(''); }}
                      />
                      <span className="co-radio-dot" aria-hidden="true" />
                      <div className="co-address-body">
                        <p className="co-address-name">{addr.fullName} {addr.isDefault && <span className="co-tag">Default</span>}</p>
                        <p>{addr.flat}, {addr.area}</p>
                        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="co-address-phone">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button className="co-add-address" onClick={() => { setShowAddressForm(true); setSelectedAddressId(''); }}>
                    <FontAwesomeIcon icon={faPlus} /> Add a New Address
                  </button>
                </div>
              )
              : (
                <form className="co-address-form">
                  <input className="co-input" type="text" name="fullName" value={newAddressForm.fullName} onChange={handleInputChange} placeholder="Full Name*" required />
                  <input className="co-input" type="text" name="flat" value={newAddressForm.flat} onChange={handleInputChange} placeholder="Flat, House No., Building*" required />
                  <input className="co-input" type="text" name="area" value={newAddressForm.area} onChange={handleInputChange} placeholder="Area, Street, Sector" />
                  <div className="co-form-row">
                    <input className="co-input" type="text" name="pincode" value={newAddressForm.pincode} onChange={handleInputChange} placeholder="PIN Code*" required />
                    <input className="co-input" type="tel" name="phone" value={newAddressForm.phone} onChange={handleInputChange} placeholder="Mobile*" required />
                  </div>
                  <div className="co-form-row">
                    <input className="co-input" type="text" name="city" value={newAddressForm.city} onChange={handleInputChange} placeholder="Town/City*" required />
                    <input className="co-input" type="text" name="state" value={newAddressForm.state} onChange={handleInputChange} placeholder="State*" required />
                  </div>
                  {addresses.length > 0 && (
                    <div className="co-form-actions">
                      <button type="button" className="co-btn-ghost" onClick={handleCancelAddNew}>Cancel</button>
                    </div>
                  )}
                </form>
              )
            }
          </section>

          {/* --- Step 2: Coupon --- */}
          <section className="co-section">
            <div className="co-section-head">
              <span className="co-step">2</span>
              <h2>Apply Coupon</h2>
            </div>
            <div className="co-coupon-input">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={customCouponInput}
                onChange={(e) => setCustomCouponInput(e.target.value)}
                className="co-input"
              />
              <button onClick={() => handleApplyCoupon()} className="co-btn-outline">Apply</button>
            </div>
            {couponError && <p className="co-coupon-error">{couponError}</p>}
            {selectedCouponCode && !couponError && <p className="co-coupon-success">Coupon “{selectedCouponCode}” applied!</p>}

            {availableCoupons.length > 0 && (
              <div className="co-coupons">
                {availableCoupons.map((c) => (
                  <button type="button" key={c.code} className="co-coupon-card" onClick={() => handleApplyCoupon(c.code)}>
                    <span className="co-coupon-tag">{c.code}</span>
                    <span className="co-coupon-body">
                      <span className="co-coupon-heading">{c.heading}</span>
                      <span className="co-coupon-desc">{c.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* --- Step 3: Payment Method --- */}
          <section className="co-section">
            <div className="co-section-head">
              <span className="co-step">3</span>
              <h2>Payment Method</h2>
            </div>
            <div className="co-pay-options">
              <label className={`co-pay-option ${paymentMethod === 'Online' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="Online" checked={paymentMethod === 'Online'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <FontAwesomeIcon icon={faCreditCard} className="co-pay-icon" />
                <span className="co-pay-text">
                  <span className="co-pay-title">Pay Online</span>
                  <span className="co-pay-sub">Card, UPI, Netbanking</span>
                </span>
                <span className="co-radio-dot" aria-hidden="true" />
              </label>
              <label className={`co-pay-option ${paymentMethod === 'CashOnDelivery' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="CashOnDelivery" checked={paymentMethod === 'CashOnDelivery'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <FontAwesomeIcon icon={faMoneyBill1} className="co-pay-icon" />
                <span className="co-pay-text">
                  <span className="co-pay-title">Cash on Delivery</span>
                  <span className="co-pay-sub">Pay when it arrives</span>
                </span>
                <span className="co-radio-dot" aria-hidden="true" />
              </label>
            </div>
          </section>
        </div>

        {/* --- Right Column: Order Summary --- */}
        <aside className="checkout-summary">
          <div className="co-summary-card">
            <h2>Order Summary</h2>

            <ul className="co-summary-items">
              {cart.items.map(({ product, quantity }) => {
                const unit = (product.price * (100 - (product.discount || 0))) / 100;
                return (
                  <li className="co-summary-item" key={product._id}>
                    <div className="co-summary-thumb">
                      <img
                        src={productThumbUrl(product, 200) || '/images/placeholder.jpg'}
                        alt={product.name || 'Product'}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = '/images/placeholder.jpg'; }
                        }}
                      />
                      <span className="co-summary-qty">{quantity}</span>
                    </div>
                    <span className="co-summary-name">{product.name}</span>
                    <span className="co-summary-line">{formatPrice(unit * quantity)}</span>
                  </li>
                );
              })}
            </ul>

            <div className="co-breakdown">
              <div className="co-row"><span>Items total</span><span>{formatPrice(itemsTotal)}</span></div>
              {effectiveDiscount > 0 && <div className="co-row co-savings"><span>Coupon discount</span><span>-{formatPrice(effectiveDiscount)}</span></div>}
              <div className="co-row"><span>Subtotal</span><span>{formatPrice(itemsTotal - effectiveDiscount)}</span></div>
              <div className="co-row"><span>Tax (10%)</span><span>{formatPrice(tax)}</span></div>
              <div className="co-row">
                <span>Delivery{!charges && ' (estimated)'}</span>
                <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE'}</span>
              </div>
              <div className="co-row co-total">
                <span>Total amount</span>
                <span>{loadingCharges ? 'Calculating…' : formatPrice(grandTotal)}</span>
              </div>
            </div>

            {error && <p className="co-error">{error}</p>}

            <button className="co-pay-btn" onClick={handlePlaceOrder} disabled={placingOrder || authLoading || loadingAddresses || loadingCharges}>
              <FontAwesomeIcon icon={faLock} />
              {placingOrder ? 'Processing…' : 'Proceed to Pay'}
            </button>

            <div className="co-summary-trust">
              <span><FontAwesomeIcon icon={faShieldHalved} /> Secure payment</span>
              <span><FontAwesomeIcon icon={faTruckFast} /> Fast delivery</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


