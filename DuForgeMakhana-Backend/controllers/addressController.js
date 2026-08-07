// src/controllers/addressController.js
import AddressBook from '../models/AddressBook.js';

/**
 * GET /api/addresses
 * List all addresses for the logged-in user
 */
export const listAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await AddressBook
      .find({ user: userId })
      .sort('-isDefault createdAt');
    res.json(addresses);
  } catch (err) {
    console.error('Error listing addresses:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/addresses
 * Add a new address
 */
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const addressData = { user: userId, ...req.body };
    const newAddr = await AddressBook.create(addressData);
    res.status(201).json(newAddr);
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * PUT /api/addresses/:id
 * Update an existing address (only if it belongs to this user)
 */
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updated = await AddressBook.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * DELETE /api/addresses/:id
 * Delete an address (only if it belongs to this user)
 */
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const deleted = await AddressBook.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
