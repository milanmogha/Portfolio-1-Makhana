// src/pages/ProductCard.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useToast } from "../contexts/ToastContext";
import { useTilt } from "../hooks/useTilt";
import { firstProductImage } from "../utils/productImages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as solidHeart,
  faCartShopping,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import Price from "../components/ui/Price";
import RatingStars from "../components/ui/RatingStars";
import Badge from "../components/ui/Badge";

interface ProductCardProps {
  product: any;
  openCart?: () => void;
  isCarouselContext?: boolean;
}

export default function ProductCard({ product, openCart, isCarouselContext = false }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart: { items }, addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();
  const tilt = useTilt(6);
  const [imageLoaded, setImageLoaded] = useState(false);

  const itemId = product._id;
  const isWished = wishlistItems.some((item) => item?._id === itemId);
  const isInCart = items.some((item) => item.product?._id === itemId);
  const stockCount = product.stock ?? 0;

  const handleWishlistToggle = () => {
    if (isWished) {
      removeFromWishlist(itemId);
      showToast("Removed from wishlist");
    } else {
      addToWishlist(product);
      showToast("Added to wishlist");
    }
  };

  const handleCartButtonClick = () => {
    if (stockCount <= 0) return;
    if (isInCart) {
      if (typeof openCart === "function") openCart();
      return;
    }
    if (!user) return navigate("/login");

    addToCart(product, 1);
    showToast("Added to cart");
  };
  
  const imageSrc =
    firstProductImage(product, 400) || product.image || "/images/placeholder.jpg";
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  const discount = product.discount || 0;
  const avgRating = product.rating?.average || 0;
  const reviewCount = product.rating?.count || 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  // Add carousel context class for styling
  const cardClasses = `product-card tilt ${isCarouselContext ? 'carousel-context' : ''}`;

  return (
    <div className="tilt-wrap">
    <div className={cardClasses} {...tilt}>
      <div className="tilt-glare" />
      <div className="product-badges">
        {discount > 0 && <Badge variant="sale">{discount}% OFF</Badge>}
        {stockCount <= 0 && <Badge variant="stock-out">Out of stock</Badge>}
        {isLowStock && <Badge variant="stock-low">Only {stockCount} left</Badge>}
      </div>

      <div className="image-section">
        <Link to={`/products/${itemId}`} className="image-link">
          {!imageLoaded && <div className="image-placeholder"></div>}
          <img
            src={imageSrc}
            alt={product.name}
            className={`product-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              // Guard against retry loops if the placeholder itself 404s
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = "/images/placeholder.jpg";
              }
              setImageLoaded(true);
            }}
          />
        </Link>
        <div className="actions-icons">
          <div className="action-icon" onClick={handleWishlistToggle}>
            <FontAwesomeIcon icon={isWished ? solidHeart : regularHeart} />
          </div>
        </div>
      </div>

      <div className="product-info">
        {product.category && (
          <p className="product-category">{String(product.category).toLowerCase()}</p>
        )}
        <Link to={`/products/${itemId}`} className="name-link">
          <h4 className="product-name">{product.name}</h4>
        </Link>
        <div className="rating-row">
          <RatingStars rating={avgRating} count={reviewCount} />
        </div>
      </div>

      <div className="card-footer">
        <Price price={product.price} discount={discount} size="md" />

        <button
          className={`cart-button ${isInCart ? 'is-in-cart' : ''} ${stockCount <= 0 ? 'out-of-stock' : ''}`}
          onClick={handleCartButtonClick}
          disabled={stockCount <= 0}
        >
          <FontAwesomeIcon icon={faCartShopping} />
          <span className="cart-tooltip">
            {stockCount <= 0 ? 'Out of Stock' : isInCart ? 'View Cart' : 'Add to Cart'}
          </span>
          {isInCart && (
            <div className="added-checkmark">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
          )}
        </button>
      </div>
    </div>
    </div>
  );
};