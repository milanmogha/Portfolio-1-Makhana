import React, { useEffect, useState } from 'react';
import AdminNavbar from './Navbar';
import '../css/Blog.css';
import { createBlog, fetchBlogById, updateBlog } from '../api/BlogApi.js';
import { useNavigate, useParams } from 'react-router-dom';

export default function BlogForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', tags: [], status: 'draft', seoTitle: '', seoDescription: '' });
  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const b = await fetchBlogById(adminToken, id);
        setForm({
          title: b.title || '', slug: b.slug || '', excerpt: b.excerpt || '', content: b.content || '', tags: b.tags || [], status: b.status || 'draft', seoTitle: b.seoTitle || '', seoDescription: b.seoDescription || ''
        });
      } catch (err) {
        console.error(err);
        alert('Failed to load blog');
      }
    })();
  }, [editing, id, adminToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addTagsFromString = (str) => {
    const parts = (str || '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setForm(prev => ({ ...prev, tags: Array.from(new Set([...(prev.tags || []), ...parts])) }));
  };

  const handleTagChange = (e) => setTagInput(e.target.value);

  const handleTagKeyDown = (e) => {
    // Add tag on Enter, comma, or Space
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTagsFromString(tagInput);
      setTagInput('');
    }
  };

  const handleTagBlur = () => {
    addTagsFromString(tagInput);
    setTagInput('');
  };

  const removeTagAt = (index) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter((_, i) => i !== index) }));
  };

  const handleFile = (e) => setCoverImage(e.target.files[0]);

  useEffect(() => {
    if (!coverImage) { setPreview(null); return; }
    const url = URL.createObjectURL(coverImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverImage]);

  useEffect(() => {
    // keep input cleared after adding tags; do not auto-fill from tags
  }, [form.tags]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateBlog(adminToken, id, { ...form, coverImage });
        alert('Updated');
      } else {
        await createBlog(adminToken, { ...form, coverImage });
        alert('Created');
      }
      navigate('/admin/blogs');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="admin-container blog-form-page">
        <div className="page-header">
          <h2>{editing ? 'Edit Blog' : 'Add Blog'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="blog-form">
          <div className="form-grid">
            <div className="form-col">
              <label className="field">
                <span className="field-label">Title</span>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="Enter blog title" />
              </label>

              <label className="field">
                <span className="field-label">Slug</span>
                <input name="slug" value={form.slug} onChange={handleChange} placeholder="short-url-slug" />
              </label>

              <label className="field">
                <span className="field-label">Excerpt</span>
                <textarea name="excerpt" value={form.excerpt} onChange={handleChange} required rows={3} placeholder="Short summary" />
              </label>

              <label className="field">
                <span className="field-label">Content</span>
                <textarea name="content" value={form.content} onChange={handleChange} rows={10} required placeholder="Full content / HTML or markdown" />

                {/* Live preview: show exact text as typed (preserve spaces, line breaks, commas, etc.) */}
                <div className="field-label" style={{ marginTop: '8px', fontSize: '0.85rem', color: '#556' }}>Preview</div>
                <div className="content-preview" aria-live="polite">{form.content}</div>
              </label>

              <label className="field">
                <span className="field-label">Tags</span>
                <input
                  name="tags"
                  value={tagInput}
                  onChange={handleTagChange}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleTagBlur}
                  placeholder="type tags, separate with comma or space (or press Enter)"
                />

                {form.tags && form.tags.length > 0 && (
                  <div className="tag-list">
                    {form.tags.map((t, idx) => (
                      <span key={t + idx} className="tag-chip">
                        {t}
                        <button type="button" className="tag-remove" onClick={() => removeTagAt(idx)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <div className="form-side">
              {/* Template removed — templates are no longer used */}

              <label className="field">
                <span className="field-label">Status</span>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">Cover Image</span>
                <input type="file" accept="image/*" onChange={handleFile} />
              </label>

              {preview && (
                <div className="cover-preview">
                  <img src={preview} alt="cover preview" />
                </div>
              )}

              <label className="field">
                <span className="field-label">SEO Title</span>
                <input name="seoTitle" value={form.seoTitle} onChange={handleChange} />
              </label>

              <label className="field">
                <span className="field-label">SEO Description</span>
                <input name="seoDescription" value={form.seoDescription} onChange={handleChange} />
              </label>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/blogs')}>Cancel</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
