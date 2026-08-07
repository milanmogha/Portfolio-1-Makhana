import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

interface RatingStarsProps {
  rating: number;       // 0–5
  count?: number;       // review count, shown when provided
  className?: string;
}

export default function RatingStars({ rating, count, className = '' }: RatingStarsProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const v = i + 1;
    const icon = rating >= v ? solidStar : rating >= v - 0.5 ? faStarHalfAlt : regularStar;
    return <FontAwesomeIcon key={i} icon={icon} className="ui-star" />;
  });

  return (
    <span
      className={`ui-rating ${className}`}
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5${count != null ? `, ${count} reviews` : ''}`}
    >
      {stars}
      {count != null && <span className="ui-rating-count">({count})</span>}
    </span>
  );
}
