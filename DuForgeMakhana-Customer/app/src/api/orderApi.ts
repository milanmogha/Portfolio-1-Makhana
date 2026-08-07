// src/api/orderApi.js

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000/';

/**
 * Create a new order
 * @param {string} token       Firebase ID token
 * @param {Object} orderData   {
 *   userAddress: string (Address _id),
 *   paymentMethod: string,
 *   paymentBreakdown: { itemsTotal, tax, shipping, discount?, total },
 *   products: [ { product: string, quantity: number } ],
 *   couponCode: string (optional, uppercase trimmed)
 * }
 * @returns {Promise<Object>}  The created order
 */
export const createOrder = async (token: string, orderData: any) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      const msg = errorObj.response?.data?.message || errorObj.message || 'Failed to create order';
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || 'Failed to create order';
      throw new Error(errorMsg);
    }
  }
};

/**
 * Fetch current user’s orders
 * @param {string} token  Firebase ID token
 * @returns {Promise<Array>} List of orders
 */
export const getMyOrders = async (token: string) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/orders/my`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      const msg = errorObj.response?.data?.message || errorObj.message || 'Failed to fetch your orders';
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || 'Failed to fetch your orders';
      throw new Error(errorMsg);
    }
  }
};


/**
 * Fetch a single order by its Mongo _id or business orderId
 * @param {string} token    Firebase ID token (or admin JWT)
 * @param {string} orderId  Mongo _id or orderId (e.g. "OD-31_05_2025_1")
 * @returns {Promise<Object>} The order details
 */
export const getOrder = async (token: string, orderId: string) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      const msg = errorObj.response?.data?.message || errorObj.message || `Failed to fetch order ${orderId}`;
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || `Failed to fetch order ${orderId}`;
      throw new Error(errorMsg);
    }
  }
};


/**
 * Update the status of an order
 * @param {string} token    Firebase ID token (or admin JWT)
 * @param {string} orderId  Mongo _id of the order
 * @param {string} status   New status ('Pending','Confirmed','Shipped','Delivered','Cancelled')
 * @returns {Promise<Object>} The updated order
 */
export const updateOrderStatus = async (token: string, orderId: string, status: string) => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/orders/${orderId}/status`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const errorObj = err as any;
      const msg = errorObj.response?.data?.message || errorObj.message || `Failed to update order ${orderId}`;
      throw new Error(msg);
    } else {
      const errorMsg = (err as Error).message || `Failed to update order ${orderId}`;
      throw new Error(errorMsg);
    }
  }
};
