import express from 'express';
import multer from 'multer';
import { getBanners, addBanner, deleteBanner } from '../controllers/bannerController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fetch all banners
router.get('/', getBanners);

// Add a new banner (with optional text & link)
// Expect multipart/form-data with fields:
//  - image: the banner image file
//  - text:  optional banner text
//  - link:  optional URL to apply to the banner
router.post('/', upload.single('image'), addBanner);

// Delete a banner by ID
router.delete('/:id', deleteBanner);

/**
 * @route   GET /api/banners/public
 * @desc    Fetch all banners for the public/customer portal
 * @access  Public
 */
router.get('/public', getBanners);

export default router;
