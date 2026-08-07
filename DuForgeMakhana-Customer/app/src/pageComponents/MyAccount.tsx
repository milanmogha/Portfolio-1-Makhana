// src/pages/MyAccount.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, deleteProfile } from '../api/accountApi';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../hooks/useAuth';

export default function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const data = await getProfile();
        const safeData = {
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || ''
        };
        setProfile(safeData);
        setFormData(safeData);
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setSuccessMsg('');
    setError('');
  };

  const handleSave = async (section: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      setSuccessMsg('Profile updated successfully!');
      
      if (section === 'info') setIsEditingInfo(false);
      if (section === 'contact') setIsEditingContact(false);

    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMsg);
    }
  };

  const handleCancel = (section: string) => {
    setFormData(profile);
    if (section === 'info') setIsEditingInfo(false);
    if (section === 'contact') setIsEditingContact(false);
  };

  // This function just opens the modal
  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  // This function contains the actual deletion logic and is called by the modal
  const confirmDeleteAccount = async () => {
    setIsModalOpen(false);
    setDeleting(true);
    setError('');
    try {
      await deleteProfile();
      logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="account-loading">
        <p>Loading your account…</p>
      </div>
    );
  }

  return (
    <>
      <div className="account-main-content">
          <h1 className="account-header">Account settings</h1>

          {error && <div className="account-message error">{error}</div>}
          {successMsg && <div className="account-message success">{successMsg}</div>}

          {/* --- Personal Information Box --- */}
          <div className="info-box">
            <div className="info-box-header">
              <h3 className="info-box-header-title">Personal Information</h3>
              {isEditingInfo ? (
                <div className="edit-buttons-container">
                  <button onClick={() => handleSave('info')} className="save-btn">Save</button>
                  <button onClick={() => handleCancel('info')} className="cancel-btn">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setIsEditingInfo(true)} className="edit-btn">✏️ Edit</button>
              )}
            </div>
            <div className="info-row no-border">
              <span className="info-label">User Name</span>
              {isEditingInfo ? (
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="info-input" />
              ) : (
                <span className="info-value">{profile.name}</span>
              )}
            </div>
          </div>

          {/* --- Contact Information Box --- */}
          <div className="info-box">
            <div className="info-box-header">
              <h3 className="info-box-header-title">Contact Information</h3>
              {isEditingContact ? (
                <div className="edit-buttons-container">
                  <button onClick={() => handleSave('contact')} className="save-btn">Save</button>
                  <button onClick={() => handleCancel('contact')} className="cancel-btn">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setIsEditingContact(true)} className="edit-btn">✏️ Edit</button>
              )}
            </div>
            <div className="info-row">
              <span className="info-label">Email Address</span>
              {isEditingContact ? (
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="info-input" />
              ) : (
                <span className="info-value">{profile.email}</span>
              )}
            </div>
            <div className="info-row no-border">
              <span className="info-label">Mobile Number</span>
              {isEditingContact ? (
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="info-input" />
              ) : (
                <span className="info-value">{profile.phone}</span>
              )}
            </div>
          </div>

          {/* --- Delete Account Section --- */}
          <div className="info-box">
              <div className="info-box-header delete-section-header">
                  <h3 className="info-box-header-title delete-section-title">Delete Account</h3>
              </div>
              <div className="info-row delete-row no-border">
                  <p className="delete-text">Once you delete your account, there is no going back. Please be certain.</p>
                  <button onClick={handleDeleteClick} disabled={deleting} className="delete-btn">
                      {deleting ? 'Deleting…' : 'Delete My Account'}
                  </button>
              </div>
          </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        title="Confirm Account Deletion"
      >
        Are you sure you want to permanently delete your account? This action cannot be undone.
      </ConfirmationModal>
    </>
  );
}