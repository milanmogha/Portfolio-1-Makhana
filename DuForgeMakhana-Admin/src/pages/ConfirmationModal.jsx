import React from 'react';
import '../css/ConfirmationModal.css'; // We'll create this next

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="modal-btn cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="modal-btn confirm">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;