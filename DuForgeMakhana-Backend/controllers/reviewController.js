// controllers/reviewController.js

import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { Order } from "../models/Orders.js";
import AddressBook from "../models/AddressBook.js"; // Your AddressBook model
import User from "../models/User.js";

// Helper: Validate that a string is a Mongo ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ------------------------------------------------------------------
// 0) CHECK IF A USER (Firebase UID) CAN REVIEW THIS PRODUCT
// ------------------------------------------------------------------
export const canUserReviewProduct = async (req, res) => {
  try {
    const { productId, userId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    // 1. Check if the user has already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      // User has already reviewed, they are not eligible to post a new one.
      return res.status(200).json({ canReview: false, hasReviewed: true });
    }

    // 2. If no review exists, check if they have a delivered order for this product.
    //    Orders store the user id directly, so match on it — address-based
    //    matching broke whenever an address was edited or deleted.
    const deliveredOrder = await Order.findOne({
      user: String(userId),
      status: "Delivered",
      "products.product": new mongoose.Types.ObjectId(productId),
    }).lean();

    // If a delivered order exists, they can review.
    if (deliveredOrder) {
      return res.status(200).json({ canReview: true, hasReviewed: false });
    }

    // Otherwise, they are not eligible.
    return res.status(200).json({ canReview: false, hasReviewed: false });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// ------------------------------------------------------------------
// 1) CREATE A NEW REVIEW AND UPDATE PRODUCT RATING
//    (Requires user to be eligible; re-check inside for safety)
// ------------------------------------------------------------------
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body; // Only get rating and comment from body

    // 2. Get the authenticated user's id from the middleware
    const userId = req.user.userId;

    // 3. Find the user in your database to get their name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }
    const userName = user.name || 'Anonymous User'; // Use the user's name

    // --- Start: All your existing validation and checks ---
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }
    // --- End: All your existing validation and checks ---

    // 4. Create the review with the SECURE user data
    const newReview = new Review({
      productId,
      userId,     // from token
      userName,   // from your User database
      rating,
      comment: comment || "",
    });
    await newReview.save();

    // Re-calculate and update product's average rating (this part of your logic was already good)
    const allReviews = await Review.find({ productId }).lean();
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;
    product.rating.count = count;
    product.rating.average = parseFloat(avg.toFixed(2));
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added.",
      review: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// ------------------------------------------------------------------
// 2) GET ALL REVIEWS FOR A GIVEN PRODUCT
// ------------------------------------------------------------------
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
