import React from 'react';

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-2 mb-4 border-b border-white/10 pb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
