import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// GET /api/wishlist - Get the user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.userId })
      .populate({
        path: 'items',
        model: Product
      });

    if (!wishlist) {
      // If no wishlist exists, create one and return it empty
      const newWishlist = new Wishlist({ user: req.user.userId, items: [] });
      await newWishlist.save();
      return res.status(200).json(newWishlist);
    }
    
    // Convert populated items' images to base64 for the frontend
    const formattedItems = wishlist.items.map(p => {
        if (!p) return null; // Handle if a product was deleted
        const images = {};
        Object.keys(p.images || {}).forEach((key) => {
            if (p.images[key]?.data) {
            images[key] = {
                contentType: p.images[key].contentType,
                data: p.images[key].data.toString("base64"),
            };
            }
        });
        // Return a plain object to avoid Mongoose doc issues
        return { ...p.toObject(), images };
    }).filter(Boolean); // Remove any null items

    res.status(200).json({ ...wishlist.toObject(), items: formattedItems });

  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching wishlist.' });
  }
};

// POST /api/wishlist - Add an item to the wishlist
export const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    const wishlist = await Wishlist.forUser(req.user.userId);
    // Use $addToSet to prevent duplicate product IDs
    await wishlist.updateOne({ $addToSet: { items: productId } });
    res.status(200).json({ message: 'Item added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while adding to wishlist.' });
  }
};

// DELETE /api/wishlist/:productId - Remove an item
export const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  try {
    const wishlist = await Wishlist.forUser(req.user.userId);
    // Use $pull to remove the product ID
    await wishlist.updateOne({ $pull: { items: productId } });
    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while removing from wishlist.' });
  }
};