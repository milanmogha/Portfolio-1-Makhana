// src/pages/BannerPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchBanners, createBanner, deleteBanner } from '../api/BannerApi';
import '../css/Banner.css';
import AdminNavbar from './Navbar';

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchBanners();
      setBanners(data);
    } catch {
      setError('Failed to load banners');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      return setError('Please choose an image file');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('link', link);
    formData.append('text', text);

    try {
      const adminToken = localStorage.getItem('adminToken');
      await createBanner(formData, adminToken);
      setFile(null);
      setLink('');
      setText('');
      load();
    } catch (err) {
      setError('Upload failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      await deleteBanner(id, adminToken);
      load();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <>
      <AdminNavbar />

      <div className="banner-page">
        <h2>📸 Create New Banner</h2>

        <form onSubmit={handleAdd} className="banner-form">
          {error && <p className="error">{error}</p>}

          <label>
            Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <label>
            Text (optional)
            <input
              type="text"
              placeholder="Banner text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>

          <label>
            Link (optional)
            <input
              type="text"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </label>

          <button type="submit">Upload Banner</button>
        </form>

        <h2 className="banner-list-title">📋 Existing Banners</h2>

        <div className="banner-list">
          {banners.map((b) => (
            <div key={b._id} className="banner-item">
              <img src={b.image} alt={b.text || 'Banner'} />
              {b.text && <p>{b.text}</p>}
              {b.link && (
                <p>
                  <a href={b.link} target="_blank" rel="noreferrer">
                    Visit link
                  </a>
                </p>
              )}
              <button onClick={() => handleDelete(b._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
