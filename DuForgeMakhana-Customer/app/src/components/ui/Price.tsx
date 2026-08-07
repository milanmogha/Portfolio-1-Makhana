import React from 'react';
import { formatPrice } from '../../utils/formatters';

interface PriceProps {
  price: number;
  discount?: number; // percent
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Commerce price block: final price, strikethrough MRP, discount chip. */
export default function Price({ price, discount = 0, size = 'md', className = '' }: PriceProps) {
  const hasDiscount = discount > 0;
  const finalPrice = hasDiscount ? (price * (100 - discount)) / 100 : price;

  return (
    <span className={`ui-price ui-price-${size} ${className}`}>
      <span className="ui-price-final">{formatPrice(finalPrice)}</span>
      {hasDiscount && (
        <>
          <s className="ui-price-compare" aria-label={`Original price ${formatPrice(price)}`}>
            {formatPrice(price)}
          </s>
          <span className="ui-price-discount">{discount}% off</span>
        </>
      )}
    </span>
  );
}
