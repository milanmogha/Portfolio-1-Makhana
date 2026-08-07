import React, { useEffect, useState } from 'react';
import AdminNavbar from './Navbar';
import '../css/Blog.css';
import { fetchAllBlogs, deleteBlog } from '../api/BlogApi.js';
import { useNavigate, Link } from 'react-router-dom';
import { Pen, Trash2, PlusCircle } from 'lucide-react';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const data = await fetchAllBlogs(adminToken);
        setBlogs(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error(err);
        alert('Failed to load blogs');
      }
    };
    loadBlogs();
  }, [adminToken]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await deleteBlog(adminToken, id);
      setBlogs(blogs.filter(b => b._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete blog post.');
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="admin-container blog-page">
        <div className="page-header">
          <h2>Manage Blogs</h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin/blogs/add')}>
            <PlusCircle size={20} />
            Add New Blog
          </button>
        </div>

        <div className="blog-list">
          {blogs.length === 0 ? (
            <div className="empty-state">
              <p>No blog posts yet.</p>
              <p>Click on "Add New Blog" to get started.</p>
            </div>
          ) : (
            blogs.map(b => (
              <div key={b._id} className="blog-card">
                <div className="card-content">
                  <h3 className="card-title">{b.title}</h3>
                  <p className="card-excerpt">{b.excerpt}</p>
                  <div className="card-meta">
                    <span className={`tag-status status-${b.status?.toLowerCase()}`}>{b.status}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <Link to={`/admin/blogs/edit/${b._id}`} className="btn btn-icon btn-outline">
                    <Pen size={18} />
                  </Link>
                  <button onClick={() => handleDelete(b._id)} className="btn btn-icon btn-danger">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
