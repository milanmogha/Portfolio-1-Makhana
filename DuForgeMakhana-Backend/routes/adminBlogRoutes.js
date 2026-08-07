import express from 'express';
import multer from 'multer';
import {
	adminListBlogs,
	getBlog,
	createBlog,
	updateBlog,
	deleteBlog,
} from '../controllers/blogController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /api/admin/blogs - admin-only listing
router.get('/', verifyAdminToken, verifyAdminRole, adminListBlogs);
// GET /api/admin/blogs/:id - fetch a single blog (admin)
router.get('/:id', verifyAdminToken, verifyAdminRole, getBlog);
// POST /api/admin/blogs - create blog (with cover image)
router.post('/', verifyAdminToken, verifyAdminRole, upload.single('coverImage'), createBlog);
// PUT /api/admin/blogs/:id - update blog
router.put('/:id', verifyAdminToken, verifyAdminRole, upload.single('coverImage'), updateBlog);
// DELETE /api/admin/blogs/:id - delete blog
router.delete('/:id', verifyAdminToken, verifyAdminRole, deleteBlog);

export default router;
