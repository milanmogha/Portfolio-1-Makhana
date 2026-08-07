// Makhana-Backend/controllers/productController.js

import Product from "../models/Product.js";
import mongoose from "mongoose";
import shortid from 'shortid';


// Helper: Validate ObjectID
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: escape user input before embedding it in a RegExp
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ------------------------------------------------------------------
// Image shaping (redesign Phase 1.5)
// Every product response now carries `imageUrls` pointing at the streamed
// media route (cacheable, WebP-transcoded, resizable via ?w=).
// Clients that pass ?images=urls get NO base64 payload (storefront).
// Without the flag the legacy base64 `images` object is still included so
// the admin app keeps working unchanged during the transition.
// ------------------------------------------------------------------
const buildImageUrls = (p) => {
  const urls = {};
  Object.keys(p.images || {}).forEach((key) => {
    if (p.images[key]?.data) urls[key] = `/images/products/${p._id}/${key}`;
  });
  return urls;
};

const toBase64Images = (p) => {
  const images = {};
  Object.keys(p.images || {}).forEach((key) => {
    if (p.images[key]?.data) {
      images[key] = {
        contentType: p.images[key].contentType,
        data: p.images[key].data.toString("base64"),
      };
    }
  });
  return images;
};

const shapeProduct = (p, lightMode) => ({
  ...p,
  imageUrls: buildImageUrls(p),
  images: lightMode ? {} : toBase64Images(p),
});

const wantsLightImages = (req) => req.query.images === "urls";

// ------------------------------------------------------------------
// 1) GET ALL PRODUCTS (MODIFIED to handle backend filtering and sorting)
// ------------------------------------------------------------------
export const getAllProducts = async (req, res) => {
  try {
    const { category, priceRange, sort, search } = req.query;

    const filter = {};
    
    // Build the filter object based on query parameters
    if (category) {
      filter.category = category.toUpperCase();
    }
    if (priceRange) {
      filter.price = { $lte: Number(priceRange) };
    }
    if (search) {
      // Case-insensitive search on the product name
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    // Build the sort object
    const sortOptions = {};
    switch (sort) {
      case 'price-asc':
        sortOptions.price = 1;
        break;
      case 'price-desc':
        sortOptions.price = -1;
        break;
      case 'name-asc':
        sortOptions.name = 1;
        break;
      case 'name-desc':
        sortOptions.name = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default:
        // Default sort or no sort
        break;
    }

    // Fetch filtered and sorted products
    const products = await Product.find(filter).sort(sortOptions).lean();

    const light = wantsLightImages(req);
    const formatted = products.map((p) => shapeProduct(p, light));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};


// ------------------------------------------------------------------
// 1b) LIGHTWEIGHT SEARCH SUGGESTIONS (no images — fast autocomplete)
// ------------------------------------------------------------------
export const getProductSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (q.length < 2) return res.json([]);

    const products = await Product.find({ name: { $regex: escapeRegex(q), $options: "i" } })
      .select("name price discount category")
      .limit(6)
      .lean();

    return res.json(products);
  } catch (error) {
    console.error("Error fetching suggestions:", error.message);
    return res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

// ------------------------------------------------------------------
// 2) GET PRODUCT BY ID (No changes needed)
// ------------------------------------------------------------------
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(shapeProduct(product, wantsLightImages(req)));
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// 3) GET PRODUCTS BY CATEGORY (This is now handled by getAllProducts, but we can keep it for direct links)
// ------------------------------------------------------------------
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const products = await Product.find({ category: category.toUpperCase() }).lean(); // Ensure case consistency
    const light = wantsLightImages(req);
    const formatted = products.map((p) => shapeProduct(p, light));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    return res.status(500).json({ message: "Failed to fetch products for category" });
  }
};

// ------------------------------------------------------------------
// 4) ADD A NEW PRODUCT (No changes needed from the last version)
// ------------------------------------------------------------------
export const addProduct = async (req, res) => {
  try {
    const { name, category, subCategory, color, price, stock, discount, details, weightKg } = req.body;
    if (!name || !category || price == null || stock == null) {
      return res.status(400).json({ message: "Name, category, price, and stock are required" });
    }

    
    const images = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        images[key] = { data: req.files[key][0].buffer, contentType: req.files[key][0].mimetype };
      });
    }


    // Ensure slug exists
    if (!req.body.slug && req.body.name) {
      req.body.slug = await ensureUniqueSlug(req.body.name);
    }

    const newProduct = new Product({ name, category, subCategory, color, price, stock, weightKg: weightKg ? Number(weightKg) : 0.5, discount: discount || 0, details, images });
    await newProduct.save();
    return res.status(201).json({ success: true, message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error.message);
    return res.status(500).json({ message: "Failed to add product" });
  }
};

// ------------------------------------------------------------------
// 5) UPDATE A PRODUCT (No changes needed from the last version)
// ------------------------------------------------------------------
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, subCategory, color, price, stock, discount, details, weightKg } = req.body;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.subCategory = subCategory ?? product.subCategory;
    product.color = color ?? product.color;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.discount = discount ?? product.discount;
    product.weightKg = (weightKg !== undefined) ? Number(weightKg) : product.weightKg;
    product.details = details ?? product.details;
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        product.images[key] = { data: req.files[key][0].buffer, contentType: req.files[key][0].mimetype };
      });
    }
    await product.save();
    return res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error.message);
    return res.status(500).json({ message: "Failed to update product" });
  }
};

// ------------------------------------------------------------------
// 6) DELETE A PRODUCT (No changes needed)
// ------------------------------------------------------------------
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    return res.status(500).json({ message: "Failed to delete product" });
  }
};

// ------------------------------------------------------------
// SITEMAP GENERATOR
// Returns a dynamic sitemap.xml generated from product URLs
// ------------------------------------------------------------
export const generateSitemap = async (req, res) => {
  try {
    // Use FRONTEND_URL environment variable when available
    const baseUrl = process.env.FRONTEND_URL || 'https://makhanahealthking.com';

    // Fetch minimal product info for sitemap
    const products = await Product.find({})
      .select('_id updatedAt createdAt')
      .lean();

    // helper: escape xml
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe.replace(/[<>&'\"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
        }
      });
    };

    // helper: simple slugify fallback
    const slugify = (text) => {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    // Build XML with image namespace
    const urls = products.map((p) => {
      const identifier = p.slug || slugify(p.name) || p._id;
      const loc = `${baseUrl.replace(/\/$/, '')}/products/${identifier}`;
      const lastmod = (p.updatedAt || p.createdAt || new Date()).toISOString();

      // image URL if image stored in DB (served via media route)
      let imageTag = '';
      if (p.images && p.images.image1 && p.images.image1.data) {
        const imgUrl = `${baseUrl.replace(/\/$/, '')}/images/products/${p._id}/image1`;
        imageTag = `\n    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:caption>${escapeXml(p.name || '')}</image:caption>\n    </image:image>`;
      }

      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>${imageTag}\n  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    // Cache sitemap for a short period to reduce DB load (adjust as needed)
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    res.status(500).send('Sitemap generation failed');
  }
};

// Generate SEO-friendly slug, ensure uniqueness by appending shortid if needed
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