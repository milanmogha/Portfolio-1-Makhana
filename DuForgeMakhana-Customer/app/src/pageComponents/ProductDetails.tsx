// src/pages/ProductDetails.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { getProductById } from "../api/productApi";
import { allProductImages } from "../utils/productImages";
import { getReviewsByProduct } from "../api/reviewApi";
import socket from "../sockets";
import ReviewList from "./ReviewList";
import Price from "../components/ui/Price";
import Badge from "../components/ui/Badge";
import RatingStars from "../components/ui/RatingStars";
import QuantityStepper from "../components/ui/QuantityStepper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faLeaf,
  faTruckFast,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

type Product = {
  _id: string;
  name?: string;
  category?: string;
  price: number;
  discount?: number;
  stock?: number;
  details?: string;
  description?: string;
  images?: Record<string, { data?: string; contentType?: string }>;
  rating?: { average?: number; count?: number };
};

type Review = {
  _id?: string;
  userName?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
};

type ProductDetailsPageProps = { openCart?: () => void };

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function ProductDetailsPage({ openCart }: ProductDetailsPageProps) {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { addRecentlyViewed } = useRecentlyViewed();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const displayName = useMemo(() => product?.name?.trim() || "Product", [product?.name]);

  const imageList = useMemo<string[]>(
    () => allProductImages(product as any, 800),
    [product]
  );

  const itemInCart = useMemo(() =>
    cartItems?.find(item => item?.product?._id === product?._id),
    [cartItems, product]
  );

  // Record the visit for the "Recently Viewed" strip on the home page.
  // Images are stored as data-URLs on products, which would blow the
  // localStorage quota — so only lightweight fields are persisted.
  useEffect(() => {
    if (product?._id && product.name) {
      addRecentlyViewed({
        _id: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount,
        category: product.category,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  useEffect(() => {
    if (!productId) {
      setLoadingProduct(false);
      return;
    }
    const fetchProduct = async () => {
      setProduct(null);
      setCurrentImageIndex(0);
      setQuantity(1);
      setLoadingProduct(true);
      try {
        const data = await getProductById(productId);
        setProduct(data as Product);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // --- REAL-TIME STOCK UPDATES ---
  useEffect(() => {
    const handleStockUpdate = (data: { productId: string; stock: number; name: string }) => {
      if (product && product._id === data.productId) {
        setProduct(prevProduct => prevProduct ? { ...prevProduct, stock: data.stock } : null);
      }
    };

    socket.on('stock-updated', handleStockUpdate);

    return () => {
      socket.off('stock-updated', handleStockUpdate);
    };
  }, [product?._id]);

  useEffect(() => {
    if (!productId) {
      setLoadingReviews(false);
      return;
    }
    const fetchReviews = async () => {
      try {
        const revData = await getReviewsByProduct(productId, "");
        setReviews(Array.isArray(revData) ? revData as Review[] : []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const handleCartButtonClick = () => {
    if (!product) return;
    if (!currentUser) {
      return navigate("/login");
    }

    // If item is already in cart, just open the cart slider
    if (itemInCart) {
      if (typeof openCart === 'function') {
        openCart();
      }
      return;
    }

    // If item is NOT in cart, add the chosen quantity and confirm
    addToCart(product, quantity);
    showToast(quantity > 1 ? `Added ${quantity} to cart` : "Added to cart");
  };

  if (loadingProduct) return <p className="loading-text">Loading product…</p>;
  if (!product) return <p className="empty-text">Product not found.</p>;

  const nextImage = () =>
    setCurrentImageIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));
  const prevImage = () =>
    setCurrentImageIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));

  const discount = product.discount || 0;
  const stockCount = product.stock ?? 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;
  const ratingAverage = product.rating?.average ?? 0;
  const ratingCount = product.rating?.count ?? 0;

  const ctaLabel = itemInCart ? "Go to Cart" : stockCount > 0 ? "Add to Cart" : "Unavailable";
  const description = product.details || product.description;

  const AddToCartButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`pdp-cart-btn ${className}`}
      onClick={handleCartButtonClick}
      disabled={stockCount === 0}
    >
      <FontAwesomeIcon icon={faCartShopping} />
      {ctaLabel}
    </button>
  );

  return (
    <div className="pdp">
      <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to="/products">Shop</Link>
        {product.category && (
          <>
            <span aria-hidden="true">›</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
              {titleCase(product.category)}
            </Link>
          </>
        )}
        <span aria-hidden="true">›</span>
        <span aria-current="page">{displayName}</span>
      </nav>

      <div className="pdp-grid">
        {/* Image Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-main-image">
            <img
              key={currentImageIndex}
              src={imageList[currentImageIndex] || "/images/placeholder.jpg"}
              alt={`${displayName} view ${currentImageIndex + 1}`}
              className="pdp-image"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "1";
                  img.src = "/images/placeholder.jpg";
                }
              }}
            />
            {imageList.length > 1 && (
              <>
                <button onClick={prevImage} className="pdp-slider-btn prev" aria-label="Previous image">‹</button>
                <button onClick={nextImage} className="pdp-slider-btn next" aria-label="Next image">›</button>
              </>
            )}
          </div>
          {imageList.length > 1 && (
            <div className="pdp-thumbnails">
              {imageList.map((src, idx) => (
                <button
                  key={`thumb-${idx}`}
                  className={`pdp-thumb ${idx === currentImageIndex ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={src} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="pdp-details">
          {product.category && (
            <p className="pdp-eyebrow">{titleCase(product.category)}</p>
          )}
          <h1 className="pdp-name">{displayName}</h1>

          {ratingCount > 0 && (
            <a href="#reviews" className="pdp-rating-link">
              <RatingStars rating={ratingAverage} count={ratingCount} />
            </a>
          )}

          <div className="pdp-price-row">
            <Price price={product.price} discount={discount} size="lg" />
          </div>

          <div className="pdp-stock">
            {stockCount === 0 ? (
              <Badge variant="stock-out">Out of stock</Badge>
            ) : isLowStock ? (
              <Badge variant="stock-low">Only {stockCount} left</Badge>
            ) : (
              <span className="pdp-in-stock">
                <FontAwesomeIcon icon={faLeaf} /> In stock
              </span>
            )}
          </div>

          {description && (
            <div className="pdp-description">
              <p>{description}</p>
            </div>
          )}

          <div className="pdp-buy-row">
            {stockCount > 0 && !itemInCart && (
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, stockCount)}
                onChange={setQuantity}
                label={displayName}
              />
            )}
            <AddToCartButton className="pdp-cart-btn-primary" />
          </div>

          <div className="pdp-trust">
            <div className="pdp-trust-item">
              <FontAwesomeIcon icon={faLeaf} />
              <span>100% Natural</span>
            </div>
            <div className="pdp-trust-item">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>Secure Payment</span>
            </div>
            <div className="pdp-trust-item">
              <FontAwesomeIcon icon={faTruckFast} />
              <span>Fast Shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="pdp-reviews" id="reviews">
        <div className="pdp-reviews-head">
          <h2>Reviews {ratingCount > 0 && <span className="pdp-reviews-count">({ratingCount})</span>}</h2>
          {ratingCount > 0 && (
            <div className="pdp-reviews-summary">
              <span className="pdp-reviews-avg">{ratingAverage.toFixed(1)}</span>
              <RatingStars rating={ratingAverage} />
            </div>
          )}
        </div>

        {loadingReviews ? (
          <p className="loading-text">Loading reviews…</p>
        ) : ratingCount === 0 && reviews.length === 0 ? (
          <p className="pdp-be-first">Be the first to write a review!</p>
        ) : (
          <ReviewList reviews={reviews} />
        )}
      </section>

    </div>
  );
}
