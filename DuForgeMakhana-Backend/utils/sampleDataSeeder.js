// sampleDataSeeder.js — seed local DB with sample products (all categories) + an admin.
// Run inside the makhana-api container (has MONGO_URI + models):
//   docker cp Makhana_Backend/utils/sampleDataSeeder.js makhana-api:/app/utils/
//   docker exec makhana-api node utils/sampleDataSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/makhanaDB';

// Canonical category list (from Makhana_Admin AddProductPage CATEGORY_OPTIONS).
// 4 products each — every product mirrors the Product schema fields.
const CATALOG = {
  'Flavored Makhana': [
    ['Peri Peri Makhana',       299, 0.2, 'Fiery peri peri roasted fox nuts — crunchy, guilt-free munching.', 10],
    ['Cheese Makhana',          319, 0.2, 'Roasted makhana coated in savoury cheese seasoning.', 5],
    ['Pudina Makhana',          289, 0.2, 'Tangy mint & spice roasted lotus seeds.', 0],
    ['Cream & Onion Makhana',   309, 0.2, 'Classic cream and onion flavoured makhana snack.', 8],
  ],
  'Plain Makhana': [
    ['Premium Plain Makhana 250g', 349, 0.25, 'Hand-picked jumbo phool makhana, unroasted and natural.', 0],
    ['Roasted Plain Makhana',      279, 0.2,  'Lightly roasted, zero-oil plain fox nuts.', 5],
    ['Jumbo Suta Makhana',         399, 0.25, 'Extra-large 5-suta grade lotus seeds.', 12],
    ['Organic Plain Makhana',      429, 0.25, 'Certified organic, pesticide-free makhana.', 0],
  ],
  'Makhana Mixes': [
    ['Makhana Trail Mix',        359, 0.3, 'Makhana with almonds, cashews and raisins.', 10],
    ['Spicy Makhana Namkeen',    299, 0.25,'Makhana mixed with roasted chana and masala.', 0],
    ['Makhana Chivda',           269, 0.25,'Traditional chivda mix with makhana base.', 5],
    ['Protein Power Mix',        449, 0.3, 'Makhana, seeds and nuts protein blend.', 15],
  ],
  'Dry Fruits': [
    ['California Almonds 500g',  649, 0.5, 'Premium grade whole California almonds.', 8],
    ['Cashew Nuts W240 500g',    799, 0.5, 'Jumbo W240 whole cashews.', 5],
    ['Green Raisins 250g',       229, 0.25,'Seedless long green kishmish.', 0],
    ['Walnut Kernels 250g',      549, 0.25,'Light-halves walnut kernels, no shell.', 10],
  ],
  'Gift Boxes': [
    ['Festive Dry Fruit Hamper', 1299, 0.8, 'Assorted dry fruits in a premium gift box.', 12],
    ['Makhana Gift Pack',         899, 0.5, 'Curated flavoured makhana assortment gift set.', 10],
    ['Diwali Special Box',       1599, 1.0, 'Luxury Diwali hamper with makhana & nuts.', 15],
    ['Corporate Wellness Box',   1999, 1.2, 'Healthy snacking hamper for corporate gifting.', 8],
  ],
  'Sale': [
    ['Combo Pack of 3 Makhana',  799,  0.6, 'Any 3 flavoured makhana packs — clearance price.', 25],
    ['Bulk Plain Makhana 1kg',   1099, 1.0, 'Value 1kg plain makhana pack.', 20],
    ['Mixed Nuts Value Pack',    699,  0.5, 'Assorted nuts at a discounted price.', 30],
    ['Snack Lovers Bundle',      599,  0.5, 'Makhana + namkeen combo on sale.', 22],
  ],
  'Pulses': [
    ['Toor Dal 1kg',    149, 1.0, 'Unpolished premium arhar/toor dal.', 0],
    ['Moong Dal 1kg',   139, 1.0, 'Split yellow moong dal.', 5],
    ['Chana Dal 1kg',   129, 1.0, 'Bengal gram split dal.', 0],
    ['Rajma 1kg',       189, 1.0, 'Jammu red kidney beans.', 8],
  ],
  'Rice': [
    ['Basmati Rice 1kg',      179, 1.0, 'Aged long-grain basmati rice.', 0],
    ['Brown Rice 1kg',        159, 1.0, 'Whole-grain unpolished brown rice.', 5],
    ['Sona Masoori 1kg',      119, 1.0, 'Lightweight aromatic sona masoori rice.', 0],
    ['Kolam Rice 1kg',        139, 1.0, 'Everyday soft-cooking kolam rice.', 3],
  ],
  'Spices': [
    ['Turmeric Powder 200g',  99,  0.2, 'High-curcumin pure haldi powder.', 0],
    ['Red Chilli Powder 200g',119, 0.2, 'Stone-ground lal mirch powder.', 5],
    ['Garam Masala 100g',     149, 0.1, 'Freshly ground whole-spice garam masala.', 0],
    ['Cumin Seeds 200g',      129, 0.2, 'Whole jeera / cumin seeds.', 8],
  ],
};

function buildProducts() {
  const docs = [];
  for (const [category, items] of Object.entries(CATALOG)) {
    for (const [name, price, weightKg, details, discount] of items) {
      docs.push({
        name, category, price, weightKg, details, discount,
        subCategory: '',
        stock: 100,
        rating: {
          count: Math.floor(Math.random() * 40) + 5,
          average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5–5.0
        },
      });
    }
  }
  return docs;
}

const ADMIN = {
  name: 'Local Admin',
  email: 'admin@makhana.local',
  password: 'Admin@123',
  role: 'owner',
};

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    // Products: clear only the sample set's categories, then insert fresh.
    const products = buildProducts();
    const delP = await Product.deleteMany({ category: { $in: Object.keys(CATALOG) } });
    const insP = await Product.insertMany(products);
    console.log(`🛒 Products: removed ${delP.deletedCount}, inserted ${insP.length} across ${Object.keys(CATALOG).length} categories`);

    // Admin: idempotent upsert (delete + create so the pre-save hash hook runs).
    await Admin.deleteOne({ email: ADMIN.email });
    const admin = await Admin.create(ADMIN);
    console.log(`👤 Admin ready -> email: ${admin.email}  password: ${ADMIN.password}  role: ${admin.role}`);

    await mongoose.disconnect();
    console.log('✅ Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
})();
