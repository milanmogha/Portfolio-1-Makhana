// routes/blogRoutes.js
import express from 'express';
import multer from 'multer';
import {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.js';

const router = express.Router();

// Use memory storage so controllers can access `req.file.buffer`
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public routes
router.get('/', listBlogs);
router.get('/:idOrSlug', getBlog);

// Admin routes (accept multipart/form-data for coverImage)
router.post('/', upload.single('coverImage'), createBlog);
router.put('/:id', upload.single('coverImage'), updateBlog);
router.delete('/:id', deleteBlog);

export default router;
