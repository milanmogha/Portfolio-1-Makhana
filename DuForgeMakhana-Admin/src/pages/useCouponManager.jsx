import { useEffect, useState } from 'react';
import {
  createCoupon,
  deleteCoupon,
  fetchAllCoupons,
  updateCoupon,
} from '../api/CouponApi';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const buildBlankForm = () => ({
  code: '',
  heading: '',
  description: '',
  expiryDate: getTodayDate(),
  expiryTime: '23:59',
  usageLimit: 1,
  minOrderValue: 0,
  discountPercent: 0,
  discountAmount: 0,
  maxDiscountAmount: 0,
  visible: true,
  assignedTo: '',
});

export const useCouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(buildBlankForm());
  const [editingId, setEditingId] = useState(null);
  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        if (!adminToken) throw new Error('Not authenticated as admin');
        const data = await fetchAllCoupons(adminToken);
        setCoupons(data);
      } catch (err) {
        console.error('Failed to fetch coupons', err);
        alert(err.message || 'Could not load coupons.');
      }
    };

    loadCoupons();
  }, [adminToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
  };

  const generateCode = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const newCode = Array.from({ length: 8 }, () =>
      alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
    ).join('');
    setFormData((prev) => ({ ...prev, code: newCode }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!adminToken) throw new Error('Not authenticated as admin');

      const payload = {
        ...formData,
        expiryDate: new Date(`${formData.expiryDate}T${formData.expiryTime}:00`).toISOString(),
        code: formData.code.trim().toUpperCase(),
        usageLimit: Number(formData.usageLimit),
        minOrderValue: Number(formData.minOrderValue),
        discountPercent: Number(formData.discountPercent),
        discountAmount: Number(formData.discountAmount),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        assignedTo: formData.assignedTo.trim() || null,
      };

      delete payload.expiryTime;

      if (isEditing) {
        await updateCoupon(adminToken, editingId, payload);
        alert('Coupon updated successfully');
      } else {
        await createCoupon(adminToken, payload);
        alert('Coupon created successfully');
      }

      cancelEdit();
      const refreshed = await fetchAllCoupons(adminToken);
      setCoupons(refreshed);
    } catch (err) {
      console.error('Failed to save coupon', err);
      alert(err.response?.data?.error || err.message || 'Error saving coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      if (!adminToken) throw new Error('Not authenticated as admin');
      await deleteCoupon(adminToken, id);
      const refreshed = await fetchAllCoupons(adminToken);
      setCoupons(refreshed);
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.response?.data?.error || err.message || 'Error deleting coupon');
    }
  };

  const startEdit = (coupon) => {
    setEditingId(coupon._id);
    setIsEditing(true);

    const date = new Date(coupon.expiryDate);
    const datePart = date.toISOString().split('T')[0];
    const timePart = date.toTimeString().slice(0, 5);

    setFormData({
      ...coupon,
      expiryDate: datePart,
      expiryTime: timePart,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      assignedTo: coupon.assignedTo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsEditing(false);
    setFormData(buildBlankForm());
  };

  return {
    coupons,
    formData,
    isEditing,
    handleChange,
    generateCode,
    handleCreateOrUpdate,
    handleDelete,
    startEdit,
    cancelEdit,
  };
};