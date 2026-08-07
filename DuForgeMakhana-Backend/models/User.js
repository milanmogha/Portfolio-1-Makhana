// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Email is now the primary account identifier (email-OTP login).
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    // Becomes true AFTER OTP verification
    isEmailVerified: { type: Boolean, default: false },
    name: { type: String, trim: true, default: "" },
    // Phone is now optional (kept for contact / legacy accounts). No longer
    // unique or required — email owns identity.
    phone: { type: String, trim: true, default: "" },
    isPhoneVerified: { type: Boolean, default: false },
    // Use consistent roles: "customer" | "admin" | "owner"
    role: { type: String, default: "customer" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
