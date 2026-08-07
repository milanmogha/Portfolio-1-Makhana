// app/src/pageComponents/Signup.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/apiClient";
import "../css/Login.css";
import { useAuth } from '../hooks/useAuth';
import OtpSuccess from "../components/OtpSuccess";
import OtpInput from "../components/OtpInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const startCooldown = (seconds = 30) => {
    setCooldown(seconds);
    const t = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError("");
    setForm((f) => ({ ...f, [name]: value }));
  };

  interface SendOtpResponse {
    success?: boolean;
    message?: string;
    devOtp?: string;
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) return "Please enter a valid email address.";
    return null;
  };

  const sendOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    const invalid = validate();
    if (invalid) return setError(invalid);

    setLoading(true);
    try {
      const response = await api.post<SendOtpResponse>("/api/auth/send-otp", {
        email: form.email.trim(),
        name: form.name.trim(),
      });
      // Local development: OTP_DEV_MODE backend returns the OTP directly
      if (response?.data?.devOtp) {
        console.info(`[Signup] DEV OTP: ${response.data.devOtp}`);
        setOtp(String(response.data.devOtp));
      }
      setStep(2);
      startCooldown(30);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  interface VerifyOtpResponse {
    token: string;
    user: Record<string, any>;
  }

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<VerifyOtpResponse>("/api/auth/verify-otp", {
        email: form.email.trim(),
        otp,
        name: form.name.trim(),
        mode: "signup",
      });
      login(data.user, data.token);
      // Play the success animation, then redirect.
      setVerified(true);
      setTimeout(() => navigate("/", { replace: true }), 1600);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Invalid OTP."
      );
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setOtp("");
    setError("");
    const invalid = validate();
    if (invalid) return setError(invalid);

    setLoading(true);
    try {
      await api.post<SendOtpResponse>("/api/auth/send-otp", {
        email: form.email.trim(),
        name: form.name.trim(),
      });
      setStep(2);
      startCooldown(30);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-background">
        <div className="background-pattern" />
      </div>

      <div className="login-container">
        <div className="login-card-premium">
          <div className="login-header">
            <div className="brand-logo brand-title">Makhana E-Store</div>
            <span className="brand-subtitle">Healthy snacks. Delivered.</span>
          </div>

          {verified ? (
            <OtpSuccess title="Account Verified" subtitle="Setting things up…" />
          ) : (
          <>
          <h2 className="title">Create your account</h2>
          <p className="subtitle">Sign up quickly using your email</p>

          {error && <div className="error">{error}</div>}

          {step === 1 && (
            <form className="auth-form" onSubmit={sendOtp}>
              <label className="input-label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                className="premium-input"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />

              <label className="input-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="premium-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

              <div className="form-actions">
                <button className="premium-button primary" type="submit" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP & Sign Up"}
                </button>
              </div>

              <p style={{ marginTop: "1rem" }}>
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={verifyOtp}>
              <label className="input-label" htmlFor="otp">
                Enter OTP
              </label>
              <p className="subtitle" style={{ marginTop: 0 }}>
                We sent a 6-digit code to {form.email}
              </p>
              <OtpInput value={otp} onChange={setOtp} length={6} autoFocus disabled={loading} />

              <div className="form-actions">
                <button className="premium-button primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP & Complete Signup"}
                </button>
              </div>

              <div style={{ display: "flex", marginTop: "0.6rem", gap: 12 }}>
                <button
                  type="button"
                  className="premium-button link"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                >
                  Edit details
                </button>

                <button
                  type="button"
                  className="link"
                  onClick={resendOtp}
                  disabled={cooldown > 0 || loading}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
