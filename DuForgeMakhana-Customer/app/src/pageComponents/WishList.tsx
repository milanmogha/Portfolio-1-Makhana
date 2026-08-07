// src/pages/WishList.tsx

import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { productThumbUrl } from '../utils/productImages';

type WishlistItem = {
  _id: string;
  name?: string;
  category?: string;
  price: number;
  images?: Record<string, { data?: string; contentType?: string }> & { image1?: { data?: string; contentType?: string } };
};

type WishListProps = { openCart?: () => void };

// Accept openCart as a prop
const WishList = ({ openCart }: WishListProps) => {
  const { cart: { items }, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist() as { wishlistItems: WishlistItem[]; removeFromWishlist: (id: string) => void };

  // Use an object to manage toast state for each item individually
  const [toastStates, setToastStates] = useState<Record<string, boolean>>({});

  const handleCartButtonClick = (item: WishlistItem) => {
    // Check if the item is already in the cart
    const isInCart = items.some(cartItem => cartItem.product?._id === item._id);

    if (isInCart) {
      // If it is, open the cart slider
      if (typeof openCart === 'function') {
        openCart();
      }
    } else {
      // If not, add it to the cart
      addToCart(item, 1);
      
      // Show a toast message for this specific item
      setToastStates(prev => ({ ...prev, [item._id]: true }));
      setTimeout(() => {
        setToastStates(prev => ({ ...prev, [item._id]: false }));
      }, 3000); // Hide toast after 3 seconds
      
      // Optionally, remove from wishlist after adding to cart
      // removeFromWishlist(item._id); 
    }
  };
  
  const handleRemoveFromWishlist = (itemId: string) => {
    removeFromWishlist(itemId);
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">WISHLIST</h1>
      <div className="wishlist-grid">
        {wishlistItems.length === 0 ? (
          <p className="empty-text">Your wishlist is empty.</p>
        ) : (
          wishlistItems.map((item) => {
            const imageSrc = productThumbUrl(item, 400) || "/images/placeholder.jpg";
            
            const isInCart = items.some(cartItem => cartItem.product?._id === item._id);

            return (
              <div key={item._id} className="wishlist-card">
                {toastStates[item._id] && (
                  <div className="wishlist-toast">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Item added to cart</span>
                  </div>
                )}
                <img
                  src={imageSrc}
                  alt={item.name}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = "1";
                      img.src = "/images/placeholder.jpg";
                    }
                  }}
                />
                <div className="wishlist-card-content">
                  <h3>{item.name}</h3>
                  <p className="category-link">{item.category}</p>
                  <p className="price">₹{item.price}</p>
                  <div className="wishlist-action-row">
                    <button 
                      className={`add-cart-btn ${isInCart ? 'in-cart' : ''}`}
                      onClick={() => handleCartButtonClick(item)}
                    >
                      {isInCart ? 'VIEW CART' : 'ADD TO CART'}
                    </button>
                    <button
                      className="remove-icon-btn"
                      onClick={() => handleRemoveFromWishlist(item._id)}
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WishList;