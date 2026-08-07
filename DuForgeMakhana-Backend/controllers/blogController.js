// controllers/blogController.js

import Blog from '../models/Blog.js';

// Convert a blog document to a JSON-safe object with base64 image data
const serializeBlog = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.coverImage && obj.coverImage.data) {
    // If it's already a Buffer
    if (Buffer.isBuffer(obj.coverImage.data)) {
      obj.coverImage.data = obj.coverImage.data.toString('base64');
    } else if (Array.isArray(obj.coverImage.data)) {
      // Document may serialize buffer as an array of bytes
      obj.coverImage.data = Buffer.from(obj.coverImage.data).toString('base64');
    } else if (obj.coverImage.data && obj.coverImage.data.type === 'Buffer' && Array.isArray(obj.coverImage.data.data)) {
      // Mongoose may serialize Buffer as { type: 'Buffer', data: [...] }
      obj.coverImage.data = Buffer.from(obj.coverImage.data.data).toString('base64');
    } else if (obj.coverImage.data && obj.coverImage.data.data && Array.isArray(obj.coverImage.data.data)) {
      // Another possible nested shape: { data: [...] }
      obj.coverImage.data = Buffer.from(obj.coverImage.data.data).toString('base64');
    }
  }
  return obj;
};

export const listBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Blog.countDocuments({ status: 'published' });
    res.json({ items: blogs.map(serializeBlog), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
};

// Admin listing: return all blogs (any status) for admin panel
export const adminListBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Blog.countDocuments({});
    res.json({ items: blogs.map(serializeBlog), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch blogs (admin)' });
  }
};

export const getBlog = async (req, res) => {
  try {
    const idOrSlug = req.params.idOrSlug || req.params.id;
    // Try slug first (safe for arbitrary strings). Only attempt _id lookup when it's a valid ObjectId.
    const mongoose = await import('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    let blog = await Blog.findOne({ slug: idOrSlug });
    if (!blog && isObjectId) {
      blog = await Blog.findById(idOrSlug);
    }
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(serializeBlog(blog));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, slug: incomingSlug, excerpt, content, tags, status, seoTitle, seoDescription } = req.body;

    // Validate required fields (title, excerpt, content)
    if (!title || !excerpt || !content) {
      return res.status(400).json({
        message: 'Missing required fields: title, excerpt, and content are mandatory.',
      });
    }

    // Helper to generate a slug from title if not provided
    const generateSlug = (text) =>
      String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 200);

    const slug = incomingSlug && String(incomingSlug).trim() !== '' ? String(incomingSlug).trim().toLowerCase() : generateSlug(title);

    const blogData = {
      title,
      slug,
      excerpt,
      content,
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
      status: status || 'draft',
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    };

    // Handle uploaded cover image (multer memory storage)
    if (req.file && req.file.buffer) {
      blogData.coverImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const blog = new Blog(blogData);
    await blog.save();
    res.status(201).json(serializeBlog(blog));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create blog', error: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    // If tags provided as comma string convert to array
    if (update.tags && !Array.isArray(update.tags)) update.tags = String(update.tags).split(',').map(s=>s.trim()).filter(Boolean);

    // Handle cover image upload
    if (req.file && req.file.buffer) {
      update.coverImage = { data: req.file.buffer, contentType: req.file.mimetype };
    }

    const blog = await Blog.findByIdAndUpdate(id, update, { new: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(serializeBlog(blog));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update blog' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
};
