// src/pages/ReviewList.tsx

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";

type Review = {
  _id?: string;
  userName?: string;
  createdAt?: string;
  rating?: number;
  comment?: string;
};

type ReviewListProps = { reviews?: Review[] };

export default function ReviewList({ reviews = [] }: ReviewListProps) {
  const renderStars = (rating: number = 0) => {
    const stars: React.ReactElement[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={i <= rating ? solidStar : regularStar}
          className={i <= rating ? "star filled" : "star"}
        />
      );
    }
    return stars;
  };

  if (!reviews.length) {
    return <p className="no-reviews">No reviews yet.</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((rev) => (
        <div key={rev._id} className="review-item">
          <div className="review-header">
            <span className="review-username">{rev.userName}</span>
            <span className="review-date">
              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <div className="review-stars">{renderStars(rev.rating)}</div>
          {rev.comment && <p className="review-comment">{rev.comment}</p>}
        </div>
      ))}
    </div>
  );
}
