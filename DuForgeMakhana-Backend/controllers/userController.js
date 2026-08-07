// controllers/userController.js
import User from "../models/User.js";

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/users/profile
 * @access  Private (JWT)
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await User.findById(userId).select("-__v");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @desc    Update current logged-in user profile
 * @route   PUT /api/users/profile
 * @access  Private (JWT)
 *
 * NOTE:
 * - Do NOT allow phone update directly here.
 * - Phone change should be done via OTP verify flow (recommended).
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { name, email } = req.body;

    // Only allow safe fields
    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof email === "string") updates.email = email.trim().toLowerCase();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @desc    Delete current logged-in user account
 * @route   DELETE /api/users/profile
 * @access  Private (JWT)
 */
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users/admin/users
 * @access  Private (JWT + admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("phone name email role createdAt updatedAt isPhoneVerified isEmailVerified")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ error: "Server error" });
  }
};
