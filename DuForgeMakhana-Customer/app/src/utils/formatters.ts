// src/utils/formatters.js

export const formatPrice = (amount: number) => {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};