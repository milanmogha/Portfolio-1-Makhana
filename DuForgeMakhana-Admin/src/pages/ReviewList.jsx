import React, { useEffect, useState } from 'react';
import { fetchAllUsers } from '../api/userApi';

// Display product reviews and try to resolve anonymous user names
export default function ReviewList({ reviews = [] }) {
  const [userMap, setUserMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const needsLookup = reviews.some(
      (r) => typeof r.userName === 'string' && r.userName.trim().toLowerCase() === 'anonymous',
    );
    if (!needsLookup) {
      setLoadingUsers(false);
      return;
    }

    const loadUsers = async () => {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setLoadingUsers(false);
        return;
      }

      try {
        const users = await fetchAllUsers(adminToken);
        const map = {};
        users.forEach((u) => {
          map[u._id] = u.name;
        });
        setUserMap(map);
      } catch (err) {
        console.error('Failed to fetch user list', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [reviews]);

  if (!reviews.length) {
    return <p className="no-reviews-text">No reviews available.</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review, index) => {
        const { _id, userId, userName, rating, comment, createdAt } = review;
        const key = _id || index;

        const isAnonymous = typeof userName === 'string' && userName.trim().toLowerCase() === 'anonymous';
        let reviewerName = userName;
        if (isAnonymous) {
          reviewerName = !loadingUsers && userMap[userId] ? userMap[userId] : 'Anonymous';
        }

        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '';

        return (
          <div className="review-item" key={key}>
            <div className="review-header">
              <span className="review-author">{reviewerName || 'Anonymous'}</span>
              {typeof rating === 'number' && (
                <span className="review-rating">Rating: {rating} / 5</span>
              )}
            </div>
            {formattedDate && <div className="review-date">{formattedDate}</div>}
            {comment && <p className="review-comment">{comment}</p>}
          </div>
        );
      })}
    </div>
  );
}