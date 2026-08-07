// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Store the normalized (lowercased) email the OTP was issued to.
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attemptsLeft: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// Auto-delete when expired
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
