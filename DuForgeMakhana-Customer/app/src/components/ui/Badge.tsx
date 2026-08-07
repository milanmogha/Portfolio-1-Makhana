import React from 'react';

type BadgeVariant = 'sale' | 'new' | 'stock-low' | 'stock-out' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${variant} ${className}`}>{children}</span>;
}
