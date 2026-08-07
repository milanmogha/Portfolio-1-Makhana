import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All wishlist routes are protected and require a user to be logged in
router.use(verifyToken);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.route('/:productId')
  .delete(removeFromWishlist);

export default router;