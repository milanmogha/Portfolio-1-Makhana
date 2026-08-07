// index.js

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Load env & DB
import './config/env.js';
import connectDB from './config/db.js';

// Routes
import adminRoutes from './routes/adminRoutes.js';    
import productRoutes from './routes/productRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import authRoutes  from './routes/authRoutes.js';           

import bannerRoutes  from './routes/bannerRoutes.js'; 
import CouponRoutes from './routes/couponRoutes.js';
import userRoutes from './routes/userRoutes.js';      
import addressRoutes from './routes/addressRoutes.js';
import customerOrderRoutes from './routes/customerOrderRoutes.js'; 
import adminOrderRoutes    from './routes/adminOrderRoutes.js';   
import cartRoutes from './routes/cartRoutes.js';
import publicCouponRoutes from './routes/publicCouponRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chargesRoutes from './routes/chargesRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import { initSocket } from './socket.js';


const app    = express();
const server = http.createServer(app);

// Behind nginx/ingress in production — needed so rate limiting sees real client IPs
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers. crossOriginResourcePolicy relaxed so product images can be
// embedded by the storefront/admin apps on other origins.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// serve uploaded images
app.use('/uploads', express.static('uploads'));

// Streamed product images (WebP transcode + cache) at /images/products/:id/:key
// Was previously defined but never mounted — products were shipped as base64
// blobs inside JSON instead. Mounted outside /api so the general API rate
// limiter doesn't count image loads.
app.use('/', mediaRoutes);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = initSocket(server);
// keep existing broadcast helpers
io.on('connection', (socket) => {
  console.log('🟢 A user connected:', socket.id);
  socket.on('wishlist:add',    (item) => socket.broadcast.emit('wishlist:added',    item));
  socket.on('wishlist:remove', (id)   => socket.broadcast.emit('wishlist:removed',   id));
  socket.on('product:add',     (prod) => socket.broadcast.emit('product:added',     prod));
  socket.on('product:delete',  (id)   => socket.broadcast.emit('product:deleted',   id));
  socket.on('disconnect', () => console.log('🔴 User disconnected:', socket.id));
});

// ─── Middleware ────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: [
    'https://www.makhanahealthking.com',
    'https://makhanahealthking.com',
    'https://admin.makhanahealthking.com',
    'https://api.makhanahealthking.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Strip $/. operators from user-supplied keys to block NoSQL injection
app.use(mongoSanitize());

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// OTP / login / payment endpoints get a much tighter budget: they trigger
// paid SMS sends and gate account access, so brute force must be expensive.
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', strictLimiter);
app.use('/api/admin/login', strictLimiter);
app.use('/api/payment', strictLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('✅ API is running...'));

// ─── API Routes ────────────────────────────────────────────────────────────────
// Admin (login + protected banner CRUD)
app.use('/api/admin', adminRoutes);

// Auth (OTP login + JWT issuance)
app.use('/api/auth', authRoutes);

// Products
app.use('/api/products', productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

// User profile routes (get/update/delete own profile)
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
//Coupons
app.use('/api/admin/coupons', CouponRoutes);
app.use('/api/coupons', publicCouponRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Public banners (GET-only)
app.use('/api/banners', bannerRoutes);
// ─── Customer orders ─────────────────────────────────────────────────────────
app.use('/api/orders', customerOrderRoutes);

// ─── Admin orders ────────────────────────────────────────────────────────────
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/charges', chargesRoutes);
app.use('/api/shipping', chargesRoutes);
// Blogs
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);
// ─── 404 & Error Handler ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  // Never leak internal error details (stack traces, driver messages) in prod
  const message =
    status < 500 || process.env.NODE_ENV !== 'production'
      ? err.message || 'Server error'
      : 'Server error';
  res.status(status).json({ message });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();