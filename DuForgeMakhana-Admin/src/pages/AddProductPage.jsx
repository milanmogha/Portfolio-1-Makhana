// AddProductPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../api/ProductApi';
import AdminNavbar from './Navbar';
import '../css/AddProductPage.css';

const CATEGORY_OPTIONS = [
  "Flavored Makhana",
  "Plain Makhana",
  "Makhana Mixes",
  "Dry Fruits",
  "Gift Boxes",
  "Sale",
  "Pulses",
  "Rice",
  "Spices",
];

// Max image size = 1 MB
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

const AddProductPage = () => {
  const [form, setForm] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    price: '',
    stock: '',
    discount: '',
    weightKg: '',
    details: '',
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Image validation
    if (files && files.length > 0) {
      const file = files[0];

      if (file.size > MAX_IMAGE_SIZE) {
        alert('Image size must be less than or equal to 1 MB');
        e.target.value = '';
        return;
      }

      setForm(prev => ({
        ...prev,
        [name]: file,
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(form);

      setShowSuccessMessage(true);

      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add product');
    }
  };

  return (
    <>
      <AdminNavbar />

      <div className="add-product-page">
        <div className="add-product-card">
          <h2 className="heading">Add New Product</h2>

          <form className="add-product-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <FormInput label="Name" name="name" value={form.name} onChange={handleChange} />
              <FormInput label="Price" name="price" type="number" value={form.price} onChange={handleChange} />
            </div>

            <div className="form-row">
              <FormInput
                label="Weight (kg)"
                name="weightKg"
                type="number"
                step="0.01"
                value={form.weightKg}
                onChange={handleChange}
              />
              <FormInput
                label="Stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <FormInput
                label="Discount (%)"
                name="discount"
                type="number"
                value={form.discount}
                onChange={handleChange}
              />

              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-group full-width">
              <label>Upload Images</label>

              <p className="image-note">
                • Each image must be less than <strong>1 MB</strong><br />
                • Recommended image ratio: <strong>1:1 (square)</strong>
              </p>

              <div className="image-grid">
                {[1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i}
                    name={`image${i}`}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="file-input"
                  />
                ))}
              </div>
            </div>

            <div className="form-group text-center">
              <button type="submit" className="submit-btn">
                Create Product
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success message (no button) */}
      {showSuccessMessage && (
        <div className="success-toast">
          ✅ Product added into the inventory
        </div>
      )}
    </>
  );
};

const FormInput = ({ label, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <input {...props} required />
  </div>
);

export default AddProductPage;
