// Local development seeder — SAMPLE DATA ONLY.
// Refuses to run when NODE_ENV=production. Populates the local database with
// a dev admin and a small catalog so the storefront/admin are usable offline.
// Run: npm run seed:dev

import mongoose from 'mongoose';
import '../config/env.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ seed:dev refuses to run in production');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/makhanaDB_dev';

// Clearly-labelled sample products (no real nutrition/sourcing claims)
const SAMPLE_PRODUCTS = [
  { name: 'Classic Salted Makhana [DEV SAMPLE]',   category: 'PLAIN MAKHANA',    price: 199, stock: 40, discount: 0,  weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Peri Peri Makhana [DEV SAMPLE]',        category: 'FLAVORED MAKHANA', price: 249, stock: 35, discount: 10, weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Pudina Makhana [DEV SAMPLE]',           category: 'FLAVORED MAKHANA', price: 249, stock: 25, discount: 0,  weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Cheese Makhana [DEV SAMPLE]',           category: 'FLAVORED MAKHANA', price: 269, stock: 4,  discount: 15, weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Himalayan Salt Makhana [DEV SAMPLE]',   category: 'FLAVORED MAKHANA', price: 259, stock: 20, discount: 0,  weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Caramel Makhana [DEV SAMPLE]',          category: 'FLAVORED MAKHANA', price: 279, stock: 18, discount: 5,  weightKg: 0.1,  details: 'Dev sample product for local testing.' },
  { name: 'Makhana Trail Mix [DEV SAMPLE]',        category: 'MAKHANA MIXES',    price: 349, stock: 22, discount: 0,  weightKg: 0.2,  details: 'Dev sample product for local testing.' },
  { name: 'Premium Dry Fruit Mix [DEV SAMPLE]',    category: 'DRY FRUITS',       price: 549, stock: 15, discount: 8,  weightKg: 0.25, details: 'Dev sample product for local testing.' },
  { name: 'Festive Gift Box [DEV SAMPLE]',         category: 'GIFT BOXES',       price: 899, stock: 10, discount: 12, weightKg: 0.6,  details: 'Dev sample product for local testing.' },
  { name: 'Roasted Makhana Value Pack [DEV SAMPLE]', category: 'SALE',           price: 449, stock: 0,  discount: 20, weightKg: 0.3,  details: 'Dev sample product for local testing (out of stock).' },
];

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`✅ Connected: ${MONGO_URI}`);

  // Idempotent: clear previous dev samples only (never touches real products)
  const removed = await Product.deleteMany({ name: /\[DEV SAMPLE\]/ });
  console.log(`🧹 Removed ${removed.deletedCount} old dev samples`);

  const created = await Product.insertMany(SAMPLE_PRODUCTS);
  console.log(`📦 Seeded ${created.length} sample products`);
  created.forEach((p) => console.log(`   • ${p.name} (${p.category}) ₹${p.price}`));

  // Ratings so Bestsellers/Snack Finder have signal
  await Promise.all(
    created.map((p, i) =>
      Product.updateOne(
        { _id: p._id },
        { rating: { average: 3.5 + (i % 3) * 0.5, count: 3 + i * 2 } }
      )
    )
  );

  // Dev admin (local only)
  const email = 'dev-admin@localhost';
  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({ name: 'DEV ADMIN', email, password: 'dev-admin-123' });
    console.log(`👤 Dev admin created → ${email} / dev-admin-123`);
  } else {
    console.log(`👤 Dev admin already exists → ${email}`);
  }

  console.log('✅ Dev seed complete. Products have no images — the storefront placeholder is expected; upload images via the admin app if needed.');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Dev seed failed:', err);
  process.exit(1);
});
