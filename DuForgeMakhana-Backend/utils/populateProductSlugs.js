import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import shortid from 'shortid';

const slugifyText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const ensureUniqueSlug = async (base) => {
  let slug = slugifyText(base);
  const exists = await Product.findOne({ slug }).lean();
  if (!exists) return slug;
  return `${slug}-${shortid.generate()}`;
};

(async () => {
  try {
    await connectDB();
    console.log('Connected to DB');
    const products = await Product.find({}).lean();
    for (const p of products) {
      if (!p.slug) {
        const newSlug = await ensureUniqueSlug(p.name || p._id);
        await Product.findByIdAndUpdate(p._id, { slug: newSlug });
        console.log(`Updated ${p._id} -> ${newSlug}`);
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
