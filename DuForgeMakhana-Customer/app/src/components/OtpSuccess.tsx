import React from 'react';

interface OtpSuccessProps {
  title?: string;
  subtitle?: string;
}

/**
 * OTP verification success animation — a glowing rounded-square badge with a
 * drawn checkmark and a pulsing aura. Shown briefly after a correct OTP before
 * redirecting. Shared by Login and Signup.
 */
export default function OtpSuccess({
  title = 'Verified Successfully',
  subtitle = 'Redirecting you…',
}: OtpSuccessProps) {
  return (
    <div className="otp-success" role="status" aria-live="polite">
      <div className="otp-success-visual">
        <span className="otp-success-aura" aria-hidden="true" />
        <span className="otp-success-badge">
          <svg className="otp-success-check" viewBox="0 0 52 52" aria-hidden="true">
            <path d="M14 27 l8 8 l16 -18" />
          </svg>
        </span>
      </div>
      <h3 className="otp-success-title">{title}</h3>
      <p className="otp-success-sub">{subtitle}</p>
    </div>
  );
}
