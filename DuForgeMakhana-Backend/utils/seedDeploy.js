// Deploy seeder — seeds an admin + a small sample catalog into the deploy DB.
// Unlike devSeed.js this is allowed to run under NODE_ENV=production (it's the
// self-hosted demo). Connects to process.env.MONGO_URI (the compose mongo).
// Idempotent: replaces the admin and any products, leaves others.
import mongoose from 'mongoose';
import '../config/env.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

const ADMIN = { name: 'admin', email: 'admin@admin.com', password: 'admin', role: 'admin' };

const SAMPLE_PRODUCTS = [
  { name: 'Classic Salted Makhana',   category: 'PLAIN MAKHANA',    price: 199, stock: 40, discount: 0,  weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Peri Peri Makhana',        category: 'FLAVORED MAKHANA', price: 249, stock: 35, discount: 10, weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Pudina Makhana',           category: 'FLAVORED MAKHANA', price: 249, stock: 25, discount: 0,  weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Cheese Makhana',           category: 'FLAVORED MAKHANA', price: 269, stock: 4,  discount: 15, weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Himalayan Salt Makhana',   category: 'FLAVORED MAKHANA', price: 259, stock: 20, discount: 0,  weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Caramel Makhana',          category: 'FLAVORED MAKHANA', price: 279, stock: 18, discount: 5,  weightKg: 0.1,  details: 'Sample product.' },
  { name: 'Makhana Trail Mix',        category: 'MAKHANA MIXES',    price: 349, stock: 22, discount: 0,  weightKg: 0.2,  details: 'Sample product.' },
  { name: 'Premium Dry Fruit Mix',    category: 'DRY FRUITS',       price: 549, stock: 15, discount: 8,  weightKg: 0.25, details: 'Sample product.' },
  { name: 'Festive Gift Box',         category: 'GIFT BOXES',       price: 899, stock: 10, discount: 12, weightKg: 0.6,  details: 'Sample product.' },
  { name: 'Roasted Makhana Value Pack', category: 'SALE',           price: 449, stock: 30, discount: 20, weightKg: 0.3,  details: 'Sample product.' },
];

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected:', mongoose.connection.name);

  // Admin (replace so credentials are deterministic)
  await Admin.deleteMany({ email: ADMIN.email });
  await new Admin(ADMIN).save();            // pre-save hook hashes the password
  console.log(`👤 Admin ready → ${ADMIN.email} / ${ADMIN.password} (role ${ADMIN.role})`);

  // Sample catalog (replace only these seeded rows, matched by exact name)
  const names = SAMPLE_PRODUCTS.map(p => p.name);
  const del = await Product.deleteMany({ name: { $in: names } });
  const ins = await Product.insertMany(SAMPLE_PRODUCTS);
  console.log(`📦 Products: removed ${del.deletedCount} old sample(s), seeded ${ins.length}`);

  await mongoose.disconnect();
  console.log('✅ Deploy seed complete');
})().catch(err => { console.error(err); process.exit(1); });
