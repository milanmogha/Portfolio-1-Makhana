import express from 'express';
import { generateSitemap } from '../controllers/productController.js';

const router = express.Router();

// Serve sitemap at /sitemap.xml
router.get('/sitemap.xml', generateSitemap);

export default router;
