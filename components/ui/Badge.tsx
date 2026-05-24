import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[#F27D26]/10 border-[#F27D26]/30 text-[#F27D26]',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    outline: 'bg-transparent border-white/20 text-white/60',
    secondary: 'bg-white/10 border-white/10 text-white/80',
  };

  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
