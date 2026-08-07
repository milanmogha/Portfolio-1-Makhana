import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';
// Admin API base - use admin-specific endpoint which returns drafts and published
const ADMIN_BLOGS_URL = `${BASE_URL}/api/admin/blogs`;

export const fetchAllBlogs = async (adminToken) => {
  const res = await axios.get(`${ADMIN_BLOGS_URL}?limit=1000`, { headers: { Authorization: `Bearer ${adminToken}` } });
  return res.data;
};

export const fetchBlogById = async (adminToken, id) => {
  // fetch single blog (admin) from admin endpoint
  const res = await axios.get(`${ADMIN_BLOGS_URL}/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  return res.data;
};

export const createBlog = async (adminToken, data) => {
  // If there's a file, send as multipart/form-data; otherwise send JSON
  if (data.coverImage) {
    const form = new FormData();
    ['title','slug','excerpt','content','seoTitle','seoDescription','status'].forEach(k=>{ if (data[k]!=null) form.append(k, data[k]); });
    form.append('coverImage', data.coverImage);
    if (data.tags) data.tags.forEach(tag=>form.append('tags', tag));
    const res = await axios.post(ADMIN_BLOGS_URL, form, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  } else {
    const payload = { ...data };
    // ensure tags sent as array (or omit)
    if (payload.tags && !Array.isArray(payload.tags)) payload.tags = String(payload.tags).split(',').map(s=>s.trim()).filter(Boolean);
    const res = await axios.post(ADMIN_BLOGS_URL, payload, { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } });
    return res.data;
  }
};

export const updateBlog = async (adminToken, id, data) => {
  if (data.coverImage) {
    const form = new FormData();
    ['title','slug','excerpt','content','seoTitle','seoDescription','status'].forEach(k=>{ if (data[k]!=null) form.append(k, data[k]); });
    form.append('coverImage', data.coverImage);
    if (data.tags) data.tags.forEach(tag=>form.append('tags', tag));
    const res = await axios.put(`${ADMIN_BLOGS_URL}/${id}`, form, { headers: { Authorization: `Bearer ${adminToken}` } });
    return res.data;
  } else {
    const payload = { ...data };
    if (payload.tags && !Array.isArray(payload.tags)) payload.tags = String(payload.tags).split(',').map(s=>s.trim()).filter(Boolean);
    const res = await axios.put(`${ADMIN_BLOGS_URL}/${id}`, payload, { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } });
    return res.data;
  }
};

export const deleteBlog = async (adminToken, id) => {
  const res = await axios.delete(`${ADMIN_BLOGS_URL}/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  return res.data;
};
