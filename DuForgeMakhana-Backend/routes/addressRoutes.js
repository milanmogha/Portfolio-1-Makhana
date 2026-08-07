// src/routes/addressRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/addressController.js';

const router = express.Router();

// all routes under /api/addresses require a valid JWT
router.use(verifyToken);

// GET   /api/addresses       → list all for the logged-in user
// POST  /api/addresses       → add a new address
router
  .route('/')
  .get(listAddresses)
  .post(addAddress);

// PUT   /api/addresses/:id   → update an existing address
// DELETE /api/addresses/:id  → delete an address
router
  .route('/:id')
  .put(updateAddress)
  .delete(deleteAddress);

export default router;
