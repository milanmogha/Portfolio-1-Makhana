import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, updateProduct } from '../api/ProductApi';
import AdminNavbar from './Navbar';

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

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const STORAGE_KEY = `editProductDraft_${id}`;

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ---------------- Load product or draft ----------------
  useEffect(() => {
    (async () => {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);

        if (savedDraft) {
          setForm(JSON.parse(savedDraft));
        } else {
          const prod = await fetchProductById(id);
          setForm({
            name: prod.name,
            category: prod.category,
            price: prod.price,
            weightKg: prod.weightKg ?? 0.5,
            stock: prod.stock,
            discount: prod.discount,
            details: prod.details,
            image1: null,
            image2: null,
            image3: null,
            image4: null,
            image5: null,
          });
        }
      } catch (err) {
        console.error('Failed to load product data:', err);
        alert('Could not load product data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---------------- Save draft to localStorage ----------------
  useEffect(() => {
    if (!form) return;

    const safeForm = { ...form };
    delete safeForm.image1;
    delete safeForm.image2;
    delete safeForm.image3;
    delete safeForm.image4;
    delete safeForm.image5;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeForm));
  }, [form]);

  // ---------------- Handle input change ----------------
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // ---------------- Submit update ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(id, form);

      // Show toast (same as AddProductPage)
      setShowSuccessMessage(true);

      localStorage.removeItem(STORAGE_KEY);

      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update product');
    }
  };

  if (loading || !form) return <p>Loading…</p>;

  return (
    <>
      <AdminNavbar />

      <div style={outerContainerStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>✏️ Edit Product</h2>

          <form onSubmit={handleSubmit} style={formStyle}>
            <FormInput label="Name" name="name" value={form.name} onChange={handleChange} />
            <FormInput label="Price" name="price" type="number" value={form.price} onChange={handleChange} />
            <FormInput label="Weight (kg)" name="weightKg" type="number" step="0.01" value={form.weightKg} onChange={handleChange} />
            <FormInput label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} />
            <FormInput label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} />

            <div>
              <label style={labelStyle}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                style={textareaStyle}
                rows={4}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>
                Upload New Images (optional, will overwrite existing)
              </label>

              <p style={imageNoteStyle}>
                • Each image must be less than <strong>1 MB</strong><br />
                • Recommended image ratio: <strong>1:1 (square)</strong>
              </p>

              <div style={imageGridStyle}>
                {[1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i}
                    name={`image${i}`}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    style={fileInputStyle}
                  />
                ))}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', textAlign: 'center' }}>
              <button type="submit" style={submitBtnStyle}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Success toast (same as AddProductPage) */}
      {showSuccessMessage && (
        <div className="success-toast">
          ✅ Product updated in the inventory
        </div>
      )}
    </>
  );
};

// ---------------- Helpers & Styles ----------------

const FormInput = ({ label, ...props }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input {...props} required style={inputStyle} />
  </div>
);

const outerContainerStyle = {
  minHeight: '100vh',
  padding: '2rem',
  background: 'linear-gradient(to bottom right, #e0f2fe, #f8fafc)',
};

const cardStyle = {
  padding: '2rem',
  maxWidth: '720px',
  margin: 'auto',
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(203, 213, 225, 0.4)',
};

const headingStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  marginBottom: '1.5rem',
  color: '#1f2937',
  textAlign: 'center',
};

const formStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.5rem',
};

const labelStyle = {
  fontSize: '0.95rem',
  fontWeight: '500',
  color: '#1f2937',
  marginBottom: '6px',
  display: 'block',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  backgroundColor: '#f9fafb',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
};

const fileInputStyle = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  background: '#f1f5f9',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const imageGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '0.75rem',
};

const imageNoteStyle = {
  fontSize: '0.85rem',
  color: '#475569',
  background: '#f1f5f9',
  padding: '10px 12px',
  borderRadius: '8px',
  marginBottom: '1rem',
};

const submitBtnStyle = {
  padding: '14px 28px',
  background: 'linear-gradient(to right, #3b82f6, #2563eb)',
  color: '#fff',
  border: 'none',
  borderRadius: '14px',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer',
};

export default EditProductPage;
