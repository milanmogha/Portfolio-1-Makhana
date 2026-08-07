import React from 'react';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: 'sm' | 'md';
  label?: string; // accessible context, e.g. product name
}

export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  label = 'quantity',
}: QuantityStepperProps) {
  return (
    <span className={`ui-stepper ui-stepper-${size}`}>
      <button
        type="button"
        className="ui-stepper-btn"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="ui-stepper-value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="ui-stepper-btn"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </span>
  );
}
