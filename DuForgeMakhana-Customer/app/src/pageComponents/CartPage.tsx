// src/pages/CartPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faBagShopping } from '@fortawesome/free-solid-svg-icons';
import { productThumbUrl } from '../utils/productImages';
import QuantityStepper from '../components/ui/QuantityStepper';

type CartPageProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const CartPage = ({ isOpen, onClose }: CartPageProps) => {
  const navigate = useNavigate();
  const {
    cart: { items },
    updateCartItem,
    cartTotal
  } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  const handleBrowse = () => {
    navigate('/products');
    onClose();
  };

  // Total saved through product discounts — a small, honest delight
  const totalSavings = items.reduce((sum, { product, quantity }) => {
    const discount = product.discount || 0;
    return sum + ((product.price * discount) / 100) * quantity;
  }, 0);

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />

      <div
        className={`cart-slider ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="cart-slider-header">
          <h2>Your Cart {items.length > 0 && <span className="cart-count-pill">{items.length}</span>}</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close cart">&times;</button>
        </div>

        <div className="cart-slider-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <FontAwesomeIcon icon={faBagShopping} className="cart-empty-icon" />
              <p>Your cart is empty</p>
              <span>Crunchy, healthy makhana is one click away.</span>
              <button className="mk-btn mk-btn-primary" onClick={handleBrowse}>
                Browse Products
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => {
              const imageSrc = productThumbUrl(product, 200) || '/images/placeholder.jpg';
              const discountedPrice = (product.price * (100 - (product.discount || 0))) / 100;

              return (
                <div className="cart-slider-item" key={product._id}>
                  <img
                    src={imageSrc}
                    alt={product.name || 'Product image'}
                    className="cart-item-image"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = '1';
                        img.src = '/images/placeholder.jpg';
                      }
                    }}
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-info">
                      <div>
                        <h4>{product.name}</h4>
                        {product.category && (
                          <p className="cart-item-subtext">{product.category}</p>
                        )}
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => updateCartItem(product._id, 0)}
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </div>
                    <div className='quantity-price'>
                      <QuantityStepper
                        value={quantity}
                        min={1}
                        max={product.stock && product.stock > 0 ? product.stock : 99}
                        onChange={(next) => updateCartItem(product._id, next)}
                        size="sm"
                        label={product.name || 'item'}
                      />

                      <div className="cart-item-price">{formatPrice(discountedPrice * quantity)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-slider-footer">
            {totalSavings > 0 && (
              <div className="cart-savings">
                🎉 You're saving {formatPrice(totalSavings)} on this order
              </div>
            )}
            <div className="subtotal">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={handleCheckout} className="checkout-btn mk-btn mk-btn-gold">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;
