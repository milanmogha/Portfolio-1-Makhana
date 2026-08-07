// controllers/authController.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../utils/emailService.js";

// Validate + normalise an email address to a lowercase, trimmed string.
const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email address");
  }
  const e = email.trim().toLowerCase();
  // Pragmatic email check (not RFC-exhaustive, but rejects obvious garbage).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error("Invalid email address");
  }
  return e;
};

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

const signToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

const RESEND_COOLDOWN_MS = 60 * 1000;

// ─── OTP dev mode ─────────────────────────────────────────────────────────
// Active only when OTP_DEV_MODE === 'true' AND one of:
//   • NODE_ENV !== 'production'  (normal local development), or
//   • ALLOW_DEV_OTP_IN_PROD === 'true'  (explicit, deliberate opt-in — used
//     for the self-hosted demo deploy where there are no email credentials).
//     ⚠️ INSECURE: the OTP is returned in the response, so anyone can log in as
//     any email. Never set this flag on a real store.
// When active the OTP is NOT emailed; it is logged to the console and returned
// as `devOtp`. The default (no flags) stays production-safe.
const isOtpDevMode = () =>
  process.env.OTP_DEV_MODE === 'true' &&
  (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP_IN_PROD === 'true');

export const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const normalized = normalizeEmail(email);

    // Cooldown: don't let an email be spammed with OTP sends
    const existing = await Otp.findOne({ email: normalized });
    if (existing?.updatedAt && Date.now() - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.updatedAt.getTime())) / 1000);
      return res.status(429).json({ error: `Please wait ${wait}s before requesting another OTP` });
    }

    const otp = genOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalized },
      { otpHash, expiresAt, attemptsLeft: 5 },
      { upsert: true, new: true }
    );

    if (isOtpDevMode()) {
      console.log(`🔑 [OTP DEV MODE] OTP for ${normalized}: ${otp}`);
      return res.json({
        message: "OTP generated (dev mode — not sent, check server console)",
        devOtp: otp,
      });
    }

    await sendOtpEmail(normalized, otp, name || "");

    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("[sendOtp] Error sending OTP:", err);
    return res.status(400).json({
      error: err.message || "Failed to send OTP",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, mode } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "email and otp are required" });
    }

    const normalized = normalizeEmail(email);

    const record = await Otp.findOne({ email: normalized });
    if (!record) {
      return res.status(400).json({ error: "OTP not found" });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.attemptsLeft <= 0) {
      return res.status(429).json({ error: "Too many attempts. Resend OTP." });
    }

    const otpHash = hashOtp(String(otp).trim());

    if (otpHash !== record.otpHash) {
      record.attemptsLeft -= 1;
      await record.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await Otp.deleteOne({ _id: record._id });

    let user = await User.findOne({ email: normalized });

    if (!user) {
      // Login must not silently create an account. Only signup registers.
      if (mode === "login") {
        return res.status(404).json({
          error: "No account found for this email. Please sign up first.",
        });
      }
      user = new User({
        email: normalized,
        name: name || "",
        isEmailVerified: true,
      });
      await user.save();
    } else {
      if (name && !user.name) user.name = name;
      user.isEmailVerified = true;
      await user.save();
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("[verifyOtp] Error verifying OTP:", err);
    return res.status(400).json({
      error: err.message || "Failed to verify OTP",
    });
  }
};
