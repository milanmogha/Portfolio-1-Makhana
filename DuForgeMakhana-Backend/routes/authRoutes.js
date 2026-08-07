// routes/authRoutes.js
import express from "express";
import { sendOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

/**
 * @route  POST /api/auth/send-otp
 * @desc   Send OTP to email
 * @body   { email: string, name?: string }
 */
router.post("/send-otp", sendOtp);

/**
 * @route  POST /api/auth/verify-otp
 * @desc   Verify OTP, create or update user, return JWT + user
 * @body   { email: string, otp: string, name?: string, mode?: "login" | "signup" }
 */
router.post("/verify-otp", verifyOtp);

export default router;
