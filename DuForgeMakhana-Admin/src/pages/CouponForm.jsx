// src/components/CouponForm.jsx

import React from 'react';

// The component now accepts an `isSpecial` prop
const CouponForm = ({
  formData,
  isEditing,
  isSpecial, // <-- New prop
  handleChange,
  generateCode,
  handleCreateOrUpdate,
  cancelEdit,
}) => {
  // Array to dynamically generate the main form fields.
  // Note: 'expiry' is removed from here and handled separately.
  const formFields = [
    { label: 'Name', name: 'heading', type: 'text', placeholder: 'Coupon Heading' },
    { label: 'Description', name: 'description', type: 'text', placeholder: 'Coupon Description' },
    { label: 'Use Limit', name: 'usageLimit', type: 'number', placeholder: 'Usage Limit' },
    { label: 'Minimum Order Value', name: 'minOrderValue', type: 'number', placeholder: '0' },
    { label: 'Discount %', name: 'discountPercent', type: 'number', placeholder: 'e.g. 10' },
    { label: 'Discount ₹', name: 'discountAmount', type: 'number', placeholder: 'e.g. 100' },
  ];

  return (
    <div className="coupon-form-section">
      <h2 className="coupon-heading">
        {isEditing
          ? '✏️ Edit Coupon'
          : isSpecial
          ? '✨ Create Special Coupon'
          : '🎁 Create New Coupon'}
      </h2>

      <form onSubmit={handleCreateOrUpdate} className="coupon-form">
        {/* Code input */}
        <div className="form-group code-group">
          <label htmlFor="code">Code</label>
          <div className="code-input-wrapper">
            <input
              id="code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter or generate code"
              className="coupon-input code-input"
              required
            />
            <button type="button" onClick={generateCode} className="generate-btn">
              Generate
            </button>
          </div>
        </div>

        {/* Expiry Date and Time Inputs */}

        {/* Render other form fields dynamically */}
        {formFields.map(({ label, name, type, placeholder }) => {
          // Special handling to insert the 'maxDiscountAmount' field
          if (name === 'discountPercent') {
            return (
              <React.Fragment key={name}>
                <div className="form-group">
                  <label htmlFor={name}>{label}</label>
                  <input
                    id={name}
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="coupon-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxDiscountAmount">Max Discount (₹)</label>
                  <input
                    id="maxDiscountAmount"
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    className="coupon-input"
                  />
                  <small style={{ color: '#555', marginTop: '4px', display: 'block' }}>
                    Set a cap for percentage-based discounts. Leave at 0 for no limit.
                  </small>
                </div>
              </React.Fragment>
            );
          }

          // Render all other fields normally
          return (
            <div className="form-group" key={name}>
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="coupon-input"
                required={name !== 'discountAmount' && name !== 'maxDiscountAmount'}
              />
            </div>
          );
        })}
        <div className="expiry-group-container">
            <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                    id="expiryDate"
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="coupon-input"
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="expiryTime">Expiry Time</label>
                <input
                    id="expiryTime"
                    type="time"
                    name="expiryTime"
                    value={formData.expiryTime}
                    onChange={handleChange}
                    className="coupon-input"
                    required
                />
            </div>
        </div>
        {/* Assign To field now gets a conditional class */}
        <div className={isSpecial ? 'form-group special-field' : 'form-group'}>
          <label htmlFor="assignedTo">Assign To (UID)</label>
          <input
            id="assignedTo"
            type="text"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            placeholder="Leave blank if public"
            className="coupon-input"
            required={isSpecial} // Make it required for special coupons
          />
          <small style={{ color: '#555', marginTop: '4px', display: 'block' }}>
            {isSpecial
              ? 'Enter the specific User ID for this private coupon.'
              : 'If visible=false, only this user’s UID can apply the coupon.'}
          </small>
        </div>

        {/* Visible checkbox */}
        <div className="form-group checkbox-group">
          <label htmlFor="visible">Visible</label>
          <input
            id="visible"
            type="checkbox"
            name="visible"
            checked={formData.visible}
            onChange={handleChange}
          />
          <small style={{ color: '#555', marginTop: '4px', display: 'block' }}>
            Uncheck to make this coupon private (must set “Assign To” UID).
          </small>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          {isEditing ? (
            <>
              <button type="submit" className="coupon-submit-btn">
                Save Changes
              </button>
              <button type="button" onClick={cancelEdit} className="cancel-btn">
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="coupon-submit-btn">
              Create Coupon
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CouponForm;
