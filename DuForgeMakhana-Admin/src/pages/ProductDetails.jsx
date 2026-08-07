// src/components/AdminProductDetails.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { fetchProductById } from "../api/ProductApi";
import AdminNavbar from "./Navbar";
import ReviewList from "./ReviewList";

import "../css/ProductDetails.css";

export default function AdminProductDetails() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const REVIEW_BASE_URL = "https://localhost:5000/api/reviews";

  useEffect(() => {
    if (!productId) {
      setLoadingProduct(false);
      return;
    }
    const fetchProduct = async () => {
      try {
        const data = await fetchProductById(productId);
        console.log("DEBUG: fetched product data:", data);
        setProduct(data);
        // set initial selected image (first available)
        const keys = ["image1", "image2", "image3", "image4", "image5"];
        const firstKey = keys.find((k) => data.images?.[k]?.data);
        if (firstKey) setSelectedImage(`data:${data.images[firstKey].contentType};base64,${data.images[firstKey].data}`);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setLoadingReviews(false);
      return;
    }
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${REVIEW_BASE_URL}/${productId}`);
        console.log("DEBUG: fetched reviews array:", response.data);
        setReviews(response.data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productId]);

  if (loadingProduct) return <p className="loading-text">Loading product…</p>;

  if (!product)
    return (
      <div>
        <AdminNavbar />
        <p className="error-text">Product not found.</p>
      </div>
    );

  return (
    <>
      <AdminNavbar />
      <div className="admin-product-details">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to Products
        </button>
        {/* Top area: images + product info side-by-side on wide screens */}
        <div className="product-top">
          <div className="product-images">
            <div className="gallery">
              <div className="main-image-wrap">
                {selectedImage ? (
                  <img src={selectedImage} alt={product.name} className="main-image" />
                ) : (
                  <div className="no-image">No image available</div>
                )}
              </div>
              <div className="thumbnails">
                {["image1", "image2", "image3", "image4", "image5"].map((key) => {
                  if (product.images?.[key]?.data) {
                    const src = `data:${product.images[key].contentType};base64,${product.images[key].data}`;
                    return (
                      <button
                        key={key}
                        className={`thumb-btn ${selectedImage === src ? 'active' : ''}`}
                        onClick={() => setSelectedImage(src)}
                        type="button"
                        aria-label={`Show ${key}`}
                      >
                        <img src={src} alt={`${product.name}-${key}`} />
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          <div className="product-info ecommerce-info">
            <h2 className="product-name">{product.name}</h2>
            <p className="product-category">
              <strong>Category:</strong> {product.category}
            </p>
            <div className="price-row">
              <div className="product-price">₹{product.price.toFixed(2)}</div>
              <div className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}
              </div>
            </div>

            {product.rating && (
              <div className="rating-row">
                <span className="rating-value">{product.rating.average?.toFixed(1)} / 5</span>
                <span className="rating-count">({product.rating.count} reviews)</span>
              </div>
            )}

            {product.details && (
              <div className="product-description">
                <h3>Overview</h3>
                <p>{product.details}</p>
              </div>
            )}

            <div className="purchase-actions">
              <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/products/edit/${product._id}`)}>Edit Product</button>
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h3 className="reviews-heading">
            Reviews ({product.rating?.count || 0})
          </h3>
          {product.rating?.count > 0 && (
            <div className="overall-rating">
              <span className="avg-value">
                Average: {product.rating.average.toFixed(1)} / 5
              </span>
            </div>
          )}
          {loadingReviews ? (
            <p className="loading-text">Loading reviews…</p>
          ) : (
            <ReviewList reviews={reviews} />
          )}
        </div>
      </div>
    </>
  );
}
