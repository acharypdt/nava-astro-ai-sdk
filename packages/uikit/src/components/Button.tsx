import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: ButtonProps) {
  const base = 'font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-[#F27D26] text-black hover:bg-[#ff8e3d]',
    secondary: 'bg-white/5 border border-white/10 hover:bg-white/10',
    ghost: 'hover:bg-white/5',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
