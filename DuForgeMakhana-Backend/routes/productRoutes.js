// Makhana-Backend/routes/productRoutes.js

import express from 'express';
import multer from 'multer';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductSuggestions,
  addProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 5 } });
const uploadFields = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
  { name: 'image5', maxCount: 1 }
]);

// Public routes
router.get('/', getAllProducts);                        // GET    /api/products
router.get('/suggest', getProductSuggestions);          // GET    /api/products/suggest?q=
router.get('/:id', getProductById);                     // GET    /api/products/:id
router.get('/category/:category', getProductsByCategory); // GET   /api/products/category/:category

// Admin routes — catalog writes require an admin JWT
router.post('/', verifyAdminToken, verifyAdminRole, uploadFields, addProduct);
router.put('/:id', verifyAdminToken, verifyAdminRole, uploadFields, updateProduct);
router.delete('/:id', verifyAdminToken, verifyAdminRole, deleteProduct);

export default router;
