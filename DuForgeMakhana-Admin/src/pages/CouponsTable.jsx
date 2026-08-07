// src/components/CouponsTable.jsx

import React, { useState, useMemo } from 'react';
import '../css/CouponsTable.css';

const CouponsTable = ({ coupons, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort coupons based on search and filters
  const filteredAndSortedCoupons = useMemo(() => {
    let filtered = coupons.filter(coupon => {
      const matchesSearch = 
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'visible' && coupon.visible) ||
        (statusFilter === 'hidden' && !coupon.visible) ||
        (statusFilter === 'assigned' && coupon.assignedTo) ||
        (statusFilter === 'expired' && new Date(coupon.expiryDate) < new Date());
      
      return matchesSearch && matchesStatus;
    });

    // Sort coupons
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.expiryDate) - new Date(a.createdAt || a.expiryDate);
        case 'oldest':
          return new Date(a.createdAt || a.expiryDate) - new Date(b.createdAt || b.expiryDate);
        case 'expiry':
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        case 'name':
          return a.heading.localeCompare(b.heading);
        default:
          return 0;
      }
    });

    return filtered;
  }, [coupons, searchTerm, statusFilter, sortBy]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discountPercent > 0 && coupon.discountAmount > 0) {
      return `${coupon.discountPercent}% or ₹${coupon.discountAmount}`;
    } else if (coupon.discountPercent > 0) {
      return `${coupon.discountPercent}%${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`;
    } else if (coupon.discountAmount > 0) {
      return `₹${coupon.discountAmount}`;
    }
    return '-';
  };

  const CouponCard = ({ coupon }) => (
    <div className={`coupon-card ${isExpired(coupon.expiryDate) ? 'expired' : ''}`}>
      <div className="coupon-card-header">
        <div className="coupon-card-code">{coupon.code}</div>
        <div className="coupon-card-status">
          {coupon.visible ? (
            <span className="status-badge status-visible">Visible</span>
          ) : (
            <span className="status-badge status-hidden">Hidden</span>
          )}
          {coupon.assignedTo && (
            <span className="status-badge status-assigned">Assigned</span>
          )}
          {isExpired(coupon.expiryDate) && (
            <span className="status-badge status-expired">Expired</span>
          )}
        </div>
      </div>
      
      <div className="coupon-card-content">
        <div className="coupon-card-field full-width">
          <label>Name</label>
          <span>{coupon.heading}</span>
        </div>
        
        <div className="coupon-card-field full-width">
          <label>Description</label>
          <span className="coupon-card-description">{coupon.description}</span>
        </div>
        
        <div className="coupon-card-field">
          <label>Discount</label>
          <span>{getDiscountDisplay(coupon)}</span>
        </div>
        
        <div className="coupon-card-field">
          <label>Min Order</label>
          <span>₹{coupon.minOrderValue}</span>
        </div>
        
        <div className="coupon-card-field">
          <label>Usage Limit</label>
          <span>{coupon.usageLimit}</span>
        </div>
        
        <div className="coupon-card-field">
          <label>Expires</label>
          <span className={isExpired(coupon.expiryDate) ? 'text-danger' : ''}>
            {formatDate(coupon.expiryDate)}
          </span>
        </div>
        
        {coupon.assignedTo && (
          <div className="coupon-card-field full-width">
            <label>Assigned To</label>
            <span>{coupon.assignedTo}</span>
          </div>
        )}
      </div>
      
      <div className="coupon-card-actions">
        <button onClick={() => onEdit(coupon)} className="edit-btn">
          ✏️ Edit
        </button>
        <button onClick={() => onDelete(coupon._id)} className="delete-btn">
          🗑️ Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="coupon-table-section">
      <h2 className="coupon-table-heading">📋 Manage Coupons ({filteredAndSortedCoupons.length})</h2>
      
      {coupons.length > 0 && (
        <div className="coupon-table-controls">
          <div className="coupon-search">
            <input
              type="text"
              placeholder="Search by code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="coupon-filters">
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="assigned">Assigned</option>
              <option value="expired">Expired</option>
            </select>
            
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="expiry">By Expiry Date</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>
      )}

      {filteredAndSortedCoupons.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="coupon-table-wrapper">
            <table className="coupon-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Limit</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCoupons.map((coupon) => (
                  <tr key={coupon._id} className={isExpired(coupon.expiryDate) ? 'expired-row' : ''}>
                    <td>
                      <code className="coupon-code">{coupon.code}</code>
                    </td>
                    <td>{coupon.heading}</td>
                    <td className="description-cell">
                      <span title={coupon.description}>
                        {coupon.description.length > 30 
                          ? `${coupon.description.substring(0, 30)}...` 
                          : coupon.description
                        }
                      </span>
                    </td>
                    <td>{getDiscountDisplay(coupon)}</td>
                    <td>₹{coupon.minOrderValue}</td>
                    <td>{coupon.usageLimit}</td>
                    <td className={isExpired(coupon.expiryDate) ? 'text-danger' : ''}>
                      {formatDate(coupon.expiryDate)}
                    </td>
                    <td>
                      <div className="status-cell">
                        {coupon.visible ? (
                          <span className="status-badge status-visible">Visible</span>
                        ) : (
                          <span className="status-badge status-hidden">Hidden</span>
                        )}
                        {isExpired(coupon.expiryDate) && (
                          <span className="status-badge status-expired">Expired</span>
                        )}
                      </div>
                    </td>
                    <td>{coupon.assignedTo || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => onEdit(coupon)} className="edit-btn">
                          Edit
                        </button>
                        <button onClick={() => onDelete(coupon._id)} className="delete-btn">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="coupon-cards">
            {filteredAndSortedCoupons.map((coupon) => (
              <CouponCard key={coupon._id} coupon={coupon} />
            ))}
          </div>
        </>
      ) : (
        <div className="no-coupons">
          <div className="no-coupons-icon">🎫</div>
          <h3>{coupons.length === 0 ? 'No Coupons Yet' : 'No Matching Coupons'}</h3>
          <p>
            {coupons.length === 0 
              ? 'Start creating your first coupon to see it listed here.'
              : 'Try adjusting your search terms or filters to find what you\'re looking for.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
export default CouponsTable;