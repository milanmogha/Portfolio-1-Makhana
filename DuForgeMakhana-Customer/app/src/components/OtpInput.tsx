import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Fired when all boxes are filled. */
  onComplete?: (v: string) => void;
}

/**
 * Segmented OTP input — one box per digit, auto-advancing, with backspace and
 * paste support. Controlled: `value` is the concatenated digit string.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
  disabled,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string, focusIndex: number) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    focusBox(focusIndex);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return; // deletions handled in keydown
    const arr = Array.from({ length }, (_, k) => value[k] || '');
    // Typing multiple chars into one box (e.g. autofill) spreads across boxes.
    const chars = raw.split('');
    let idx = i;
    for (const c of chars) {
      if (idx >= length) break;
      arr[idx] = c;
      idx += 1;
    }
    commit(arr.join(''), Math.min(idx, length - 1));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const arr = Array.from({ length }, (_, k) => value[k] || '');
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (arr[i]) {
        arr[i] = '';
        commit(arr.join(''), i);
      } else if (i > 0) {
        arr[i - 1] = '';
        commit(arr.join(''), i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    commit(text, Math.min(text.length, length - 1));
  };

  return (
    <div className="otp-boxes" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="otp-box"
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
