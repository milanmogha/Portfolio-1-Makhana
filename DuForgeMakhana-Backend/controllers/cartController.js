import { Cart } from '../models/Cart.js';
import mongoose from 'mongoose';

// Helper: Validate ObjectID
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper: Given a plain JS “product” (with .images.{ image1, image2, … }.data as Buffer),
 * convert each Buffer → base64 string.
 */
function serializeProductImages(product) {
  if (!product.images) return {};

  const imagesOut = {};
  Object.keys(product.images).forEach((key) => {
    const imgObj = product.images[key];
    if (imgObj && imgObj.data) {
      imagesOut[key] = {
        contentType: imgObj.contentType,
        data: imgObj.data.toString('base64'),
      };
    }
  });
  return imagesOut;
}

// backend/src/controllers/cartController.js

// ------------------------------------------------------------------
// 1) GET CURRENT USER'S CART (create if not exists)
// ------------------------------------------------------------------
export const getCart = async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cartDoc = await Cart.forUser(uid);
    await cartDoc.populate('items.product');

    // --- START: FIX for DELETED PRODUCTS ---
    const originalItemCount = cartDoc.items.length;

    // Filter out cart items where the referenced product is null (deleted)
    cartDoc.items = cartDoc.items.filter(item => item.product !== null);

    // If any items were removed, it means the cart had invalid data.
    // We save the cleaned cart back to the database.
    if (originalItemCount !== cartDoc.items.length) {
      await cartDoc.save();
    }
    // --- END: FIX ---

    const cartObj = cartDoc.toObject();

    // This mapping will now only run on items with valid products, preventing the crash.
    cartObj.items = cartObj.items.map((item) => {
      const p = item.product;
      p.images = serializeProductImages(p); // This function is now safe to call

      return {
        product: p,
        quantity: item.quantity,
      };
    });

    return res.status(200).json(cartObj);
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    return res.status(500).json({ message: 'Failed to fetch cart' });
  }
};
// ------------------------------------------------------------------
// 2) ADD A PRODUCT TO CART (or increase qty)
// ------------------------------------------------------------------
export const addToCart = async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, quantity = 1 } = req.body;
    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: 'A valid productId is required' });
    }
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ message: 'quantity must be between 1 and 100' });
    }

    const cartDoc = await Cart.forUser(uid);
    const idx = cartDoc.items.findIndex((i) => i.product.equals(productId));
    if (idx > -1) {
      cartDoc.items[idx].quantity = Math.min(cartDoc.items[idx].quantity + qty, 100);
    } else {
      cartDoc.items.push({ product: productId, quantity: qty });
    }

    const updatedCartDoc = await cartDoc.save();
    await updatedCartDoc.populate('items.product');

    // Convert to plain object and serialize images exactly like above
    const cartObj = updatedCartDoc.toObject();
    cartObj.items = cartObj.items.map((item) => {
      const p = item.product;
      p.images = serializeProductImages(p);
      return {
        product: p,
        quantity: item.quantity,
      };
    });

    return res.status(200).json(cartObj);
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// 3) UPDATE QUANTITY OF A CART ITEM
// ------------------------------------------------------------------
export const updateCartItem = async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, quantity } = req.body;
    if (!productId || !isValidObjectId(productId) || typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      return res.status(400).json({ message: 'productId and numeric quantity are required' });
    }

    const cartDoc = await Cart.forUser(uid);
    const idx = cartDoc.items.findIndex((i) => i.product.equals(productId));
    if (idx === -1) {
      return res.status(404).json({ message: 'Product not in cart' });
    }

    if (quantity <= 0) {
      cartDoc.items.splice(idx, 1);
    } else {
      cartDoc.items[idx].quantity = Math.min(Math.floor(quantity), 100);
    }

    const updatedCartDoc = await cartDoc.save();
    await updatedCartDoc.populate('items.product');

    const cartObj = updatedCartDoc.toObject();
    cartObj.items = cartObj.items.map((item) => {
      const p = item.product;
      p.images = serializeProductImages(p);
      return {
        product: p,
        quantity: item.quantity,
      };
    });

    return res.status(200).json(cartObj);
  } catch (err) {
    console.error('Error updating cart item:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// 4) REMOVE A PRODUCT FROM CART
// ------------------------------------------------------------------
export const removeFromCart = async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const cartDoc = await Cart.forUser(uid);
    cartDoc.items = cartDoc.items.filter((i) => !i.product.equals(productId));
    const updatedCartDoc = await cartDoc.save();
    await updatedCartDoc.populate('items.product');

    const cartObj = updatedCartDoc.toObject();
    cartObj.items = cartObj.items.map((item) => {
      const p = item.product;
      p.images = serializeProductImages(p);
      return {
        product: p,
        quantity: item.quantity,
      };
    });

    return res.status(200).json(cartObj);
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

// ------------------------------------------------------------------
// 5) CLEAR ALL ITEMS FROM CART
// ------------------------------------------------------------------
export const clearCart = async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cartDoc = await Cart.forUser(uid);
    cartDoc.items = [];
    await cartDoc.save();

    // Return a simple “cart cleared” response (no products to serialize)
    return res.status(200).json({ message: 'Cart cleared', items: [] });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    return res.status(500).json({ message: err.message });
  }
};
