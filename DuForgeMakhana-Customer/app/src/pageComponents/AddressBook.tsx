// src/pages/AddressBook.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from '../api/addressApi';
// import { getAuth } from 'firebase/auth';
import ConfirmationModal from './ConfirmationModal'; // --- 1. Import the modal component ---

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  flat: string;
  area: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
};

const blankAddress: Address = {
  fullName: '',
  phone: '',
  flat: '',
  area: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  isDefault: false,
};

export default function AddressBook({ initialView, onSwitchView }: { initialView: 'list' | 'form'; onSwitchView?: (view: 'list' | 'form') => void; }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formData, setFormData] = useState<Address>(blankAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState(initialView);

  // --- 2. Add state for the delete confirmation modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string>('');

  useEffect(() => {
    setCurrentView(initialView);
    if (initialView === 'form') {
        setEditingId(null);
        setFormData(blankAddress);
    }
  }, [initialView]);

  // View switching functions
  const switchToFormView = () => {
    setCurrentView('form');
    setEditingId(null);
    setFormData(blankAddress);
    if (onSwitchView) onSwitchView('form');
  };

  const switchToListView = () => {
    setCurrentView('list');
    setEditingId(null);
    setFormData(blankAddress);
    if (onSwitchView) onSwitchView('list');
  };

  // Get JWT token from localStorage (new auth system)
  const getToken = async (): Promise<string | null> => {
    return localStorage.getItem('token');
  };

  const loadAddresses = async () => {
    setError('');
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const data = await fetchAddresses(token);
      setAddresses(data as Address[]);
    } catch (err) {
      console.error('Error listing addresses:', err);
      const errorMsg = err instanceof Error ? err.message : (err as any)?.response?.data?.error || 'Unknown error';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone' || name === 'pincode') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(fd => ({ ...fd, [name]: numericValue }));
    } else {
      setFormData(fd => ({ ...fd, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.phone.length !== 10) {
        setError('Phone number must be exactly 10 digits.');
        return;
    }

    if (formData.pincode.length !== 6) {
        setError('Pincode must be exactly 6 digits.');
        return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      if (formData.isDefault) {
        const currentDefault = addresses.find(addr => addr.isDefault && addr._id !== editingId);
        if (currentDefault) {
          const updatedOldDefault = { ...currentDefault, isDefault: false };
          if (currentDefault._id) {
            await updateAddress(token, currentDefault._id, updatedOldDefault);
          }
        }
      }
      
      if (editingId) {
        await updateAddress(token, editingId, formData);
      } else {
        await createAddress(token, formData);
      }

      setFormData(blankAddress);
      setEditingId(null);
      await loadAddresses();
      if (onSwitchView) onSwitchView('list');
    } catch (err) {
      console.error('Save address failed:', err);
      const errorMsg = err instanceof Error ? err.message : (err as any)?.response?.data?.error || 'Failed to save address';
      setError(errorMsg);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr._id ?? null);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      flat: addr.flat,
      area: addr.area,
      landmark: addr.landmark,
      pincode: addr.pincode,
      city: addr.city,
      state: addr.state,
      isDefault: addr.isDefault
    });
    setCurrentView('form');
    if (onSwitchView) onSwitchView('form');
  };

  // --- 3. Replace the old handleDelete with functions to manage the modal ---
  const openDeleteModal = (id?: string) => {
    if (!id) return;
    setAddressToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await deleteAddress(token, addressToDelete);
      await loadAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      const errorMsg = err instanceof Error ? err.message : (err as any)?.response?.data?.error || 'Could not delete address.';
      setError(errorMsg);
    } finally {
      setIsModalOpen(false);
      setAddressToDelete('');
    }
  };

  const handleSetDefault = async (addressToMakeDefault: Address) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const currentDefault = addresses.find(addr => addr.isDefault);
        const updates: Promise<unknown>[] = [];

        if (currentDefault?._id) {
          updates.push(updateAddress(token, currentDefault._id, { ...currentDefault, isDefault: false }));
        }
        if (addressToMakeDefault._id) {
          updates.push(updateAddress(token, addressToMakeDefault._id, { ...addressToMakeDefault, isDefault: true }));
        }

        await Promise.all(updates);
        await loadAddresses();
    } catch (err) {
        console.error('Failed to set default address:', err);
        const errorMsg = err instanceof Error ? err.message : (err as any)?.response?.data?.error || 'Failed to set default address.';
        setError(errorMsg);
    }
  };

  if (loading) {
    return <p>Loading addresses...</p>;
  }

  return (
    <>
      {currentView === 'list' && (
        <>
          <div className="address-header-actions">
            <h2 className="Heading">Saved Addresses</h2>
            <button 
              className="add-address-btn"
              onClick={switchToFormView}
            >
              Add New Address
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="address-list">
            {addresses.map((addr, idx) => (
              <div key={addr._id || addr.phone || idx} className="address-card">
                <p className="name">
                  {addr.fullName}
                  {addr.isDefault && <span className="badge-inline">Default</span>}
                </p>
                <p>{addr.flat}, {addr.area}, {addr.landmark}</p>
                <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                <p className="phone">{addr.phone}</p>
                
                <div className="card-actions">
                  {!addr.isDefault && (
                    <button className="action-button default" onClick={() => handleSetDefault(addr)}>
                      Set as Default
                    </button>
                  )}
                  <button className="action-button edit" onClick={() => handleEdit(addr)}>✏️ Edit</button>
                  {/* --- 4. Update the button's onClick to open the modal --- */}
                  <button className="action-button delete" onClick={() => openDeleteModal(addr._id)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {currentView === 'form' && (
        <>
          <div className="form-header">
            <h2 className="Heading">{editingId ? 'Update Address' : 'Add New Address'}</h2>
          </div>
          {error && <div className="error">{error}</div>}
          <form className='address-form' onSubmit={handleSubmit}>
            <div className="form-section-title">Personal Details</div>
            
            <div className="form-field">
              <label htmlFor="fullName">Full Name <span className="required">*</span></label>
              <input 
                id="fullName"
                name="fullName" 
                type="text"
                placeholder="Enter your full name" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="phone">Mobile Number <span className="required">*</span></label>
              <input 
                id="phone"
                name="phone" 
                type="tel" 
                placeholder="10-digit mobile number" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                maxLength={10} 
              />
            </div>
            
            <div className="form-section-divider"></div>
            <div className="form-section-title">Address Information</div>
            
            <div className="form-field">
              <label htmlFor="flat">Flat, House No., Building</label>
              <input 
                id="flat"
                name="flat" 
                type="text"
                placeholder="Flat/House No., Building Name" 
                value={formData.flat} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="area">Area, Street, Sector</label>
              <input 
                id="area"
                name="area" 
                type="text"
                placeholder="Area, Street, Sector, Village" 
                value={formData.area} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="landmark">Landmark</label>
              <input 
                id="landmark"
                name="landmark" 
                type="text"
                placeholder="E.g. Near Apollo Hospital" 
                value={formData.landmark} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="pincode">Pincode <span className="required">*</span></label>
              <input 
                id="pincode"
                name="pincode" 
                type="text"
                placeholder="6-digit pincode" 
                value={formData.pincode} 
                onChange={handleChange} 
                required 
                maxLength={6} 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="city">Town/City <span className="required">*</span></label>
              <input 
                id="city"
                name="city" 
                type="text"
                placeholder="Enter your city" 
                value={formData.city} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="state">State <span className="required">*</span></label>
              <input 
                id="state"
                name="state" 
                type="text"
                placeholder="Enter your state" 
                value={formData.state} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="checkbox-wrapper">
              <label>
                <input 
                  name="isDefault" 
                  type="checkbox" 
                  checked={formData.isDefault} 
                  onChange={handleChange} 
                />
                Make this my default address
              </label>
            </div>
            
            <div className="button-row">
              <button type="submit">
                {editingId ? 'Update Address' : 'Save Address'}
              </button>
              <button type="button" onClick={switchToListView} style={{ background: '#6c757d'}}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}

      {/* --- 5. Render the modal component --- */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Address Deletion"
      >
        Are you sure you want to permanently delete this address? This action cannot be undone.
      </ConfirmationModal>
    </>
  );
}