import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-white/10 text-white',
  success: 'bg-green-500/20 text-green-300 border border-green-500/20',
  warning: 'bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20',
  danger: 'bg-red-500/20 text-red-300 border border-red-500/20',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
