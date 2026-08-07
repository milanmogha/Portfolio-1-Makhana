// app/src/pageComponents/Login.tsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "../api/apiClient";
import "../css/Login.css";
import { useAuth } from '../hooks/useAuth';
import OtpSuccess from "../components/OtpSuccess";
import OtpInput from "../components/OtpInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setError("");
  };

  interface SendOtpEvent {
    preventDefault?: () => void;
  }

  interface ApiError {
    response?: {
      data?: {
        error?: string;
        message?: string;
      };
    };
  }

  const sendOtp = async (e?: SendOtpEvent): Promise<void> => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/api/auth/send-otp", { email: cleanEmail });
      // Local development: backend in OTP_DEV_MODE returns the OTP directly
      // (never happens in production — see authController).
      if (response?.data?.devOtp) {
        console.info(`[Login] DEV OTP: ${response.data.devOtp}`);
        setOtp(String(response.data.devOtp));
      }
      setStep(2);
      startCooldown(30);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  interface VerifyOtpEvent {
    preventDefault: () => void;
  }

  interface VerifyOtpResponse {
    token: string;
    user: { name?: string; email?: string; phone?: string; [key: string]: any };
  }

  const verifyOtp = async (e: VerifyOtpEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<VerifyOtpResponse>("/api/auth/verify-otp", {
        email: email.trim(),
        otp,
        mode: "login",
      });
      login(data.user, data.token);
      // Play the success animation, then redirect.
      setVerified(true);
      setTimeout(() => navigate("/", { replace: true }), 1600);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Invalid OTP."
      );
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    await sendOtp();
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
            <OtpSuccess subtitle="Signing you in…" />
          ) : (
          <>
          <h2 className="title">Sign in to your account</h2>
          <p className="subtitle">Fast, secure login with email OTP</p>

          {error && <div className="error">{error}</div>}

          {step === 1 && (
            <form className="auth-form" onSubmit={sendOtp}>
              <label className="input-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="premium-input"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                required
              />

              <div className="form-actions">
                <button
                  className="premium-button primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>

              <p style={{ marginTop: "1rem" }}>
                Don't have an account? <Link to="/signup">Sign up here</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={verifyOtp}>
              <label className="input-label" htmlFor="otp">
                Enter OTP
              </label>
              <p className="subtitle" style={{ marginTop: 0 }}>
                We sent a 6-digit code to {email}
              </p>

              <OtpInput value={otp} onChange={setOtp} length={6} autoFocus disabled={loading} />

              <div className="form-actions">
                <button
                  className="premium-button primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
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
                  Edit email
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

export default Login;
