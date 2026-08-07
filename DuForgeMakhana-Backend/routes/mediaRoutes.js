import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import sharp from 'sharp';

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Tiny in-memory LRU for transcoded buffers so sharp doesn't re-encode the
// same image on every request. Keyed by id:key:width:updatedAt so entries
// self-invalidate when a product image is replaced.
const CACHE_MAX = 200;
const cache = new Map();
const cacheGet = (k) => {
  if (!cache.has(k)) return null;
  const v = cache.get(k);
  cache.delete(k);
  cache.set(k, v); // refresh recency
  return v;
};
const cacheSet = (k, v) => {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(k, v);
};

// Allowed thumbnail widths (prevents cache-busting via arbitrary ?w= values)
const ALLOWED_WIDTHS = [200, 400, 800];

// Serve product images stored in MongoDB at /images/products/:id/:key
// Optional ?w=200|400|800 resizes for card thumbnails.
router.get('/images/products/:id/:key', async (req, res) => {
  try {
    const { id, key } = req.params;
    if (!isValidObjectId(id)) return res.status(400).send('Invalid ID');
    if (!/^image[1-5]$/.test(key)) return res.status(400).send('Invalid image key');

    const width = ALLOWED_WIDTHS.includes(Number(req.query.w)) ? Number(req.query.w) : null;
    const wantsWebp = (req.get('Accept') || '').includes('image/webp');

    const product = await Product.findById(id).select('images updatedAt').lean();
    if (!product) return res.status(404).send('Not found');

    const image = product.images && product.images[key];
    if (!image || !image.data) return res.status(404).send('Image not found');

    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.set('Vary', 'Accept');

    // Original bytes, no processing needed
    if (!width && !wantsWebp) {
      res.set('Content-Type', image.contentType || 'image/jpeg');
      return res.send(image.data.buffer ? Buffer.from(image.data.buffer) : image.data);
    }

    const cacheKey = `${id}:${key}:${width || 0}:${wantsWebp ? 'webp' : 'orig'}:${product.updatedAt?.getTime?.() || 0}`;
    const hit = cacheGet(cacheKey);
    if (hit) {
      res.set('Content-Type', hit.contentType);
      return res.send(hit.buffer);
    }

    try {
      let pipeline = sharp(image.data.buffer ? Buffer.from(image.data.buffer) : image.data);
      if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
      const contentType = wantsWebp ? 'image/webp' : (image.contentType || 'image/jpeg');
      const buffer = wantsWebp
        ? await pipeline.webp({ quality: 80 }).toBuffer()
        : await pipeline.toBuffer();
      cacheSet(cacheKey, { buffer, contentType });
      res.set('Content-Type', contentType);
      return res.send(buffer);
    } catch (err) {
      console.warn('Image processing failed, serving original', err.message);
      res.set('Content-Type', image.contentType || 'image/jpeg');
      return res.send(image.data.buffer ? Buffer.from(image.data.buffer) : image.data);
    }
  } catch (err) {
    console.error('Failed to serve product image', err);
    res.status(500).send('Server error');
  }
});

export default router;
