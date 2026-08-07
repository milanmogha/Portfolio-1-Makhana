// src/pages/CouponPage.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // <-- Import useLocation
import { useCouponManager } from './useCouponManager';
import AdminNavbar from './Navbar';
import CouponForm from './CouponForm';
import CouponsTable from './CouponsTable';
import '../css/Coupon.css';

const CouponPage = () => {
  const location = useLocation(); // <-- Get the current location object

  // Set the initial view from the navigation state, or default to 'new'
  const [view, setView] = useState(location.state?.view || 'new');

  // This effect updates the view if the user clicks a dropdown link while already on the page
  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view);
    }
  }, [location.state]);

  const {
    coupons,
    formData,
    isEditing,
    handleChange,
    generateCode,
    handleCreateOrUpdate,
    handleDelete,
    startEdit,
    cancelEdit,
  } = useCouponManager();

  const handleStartEdit = (coupon) => {
    startEdit(coupon);
    setView('new'); // Switch to the form view for editing
  };

  return (
    <>
      <AdminNavbar /> {/* No props needed anymore */}
      <div className="coupon-page">
        <div className="coupon-container">
          {/* Conditional rendering based on the 'view' state */}
          {(view === 'new') && (
            <CouponForm
              formData={formData}
              isEditing={isEditing}
              isSpecial={false} // Since you removed this option
              handleChange={handleChange}
              generateCode={generateCode}
              handleCreateOrUpdate={handleCreateOrUpdate}
              cancelEdit={cancelEdit}
            />
          )}
          {view === 'viewAll' && (
            <CouponsTable
              coupons={coupons}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CouponPage;
