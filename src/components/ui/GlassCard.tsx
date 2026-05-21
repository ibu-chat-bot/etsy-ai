import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  borderGlowColor?: 'emerald' | 'indigo' | 'amber' | 'none';
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  hoverGlow = true,
  borderGlowColor = 'none',
  onClick
}: GlassCardProps) {
  // Border style combinations
  const borderStyles = {
    none: 'border-white/5',
    emerald: 'neon-border-teal',
    indigo: 'neon-border-indigo',
    amber: 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
  };

  const cursorClass = onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '';
  const hoverClass = hoverGlow ? 'glass-panel-hover' : '';

  return (
    <div
      onClick={onClick}
      className={`glass-panel ${borderStyles[borderGlowColor]} rounded-2xl p-6 ${hoverClass} ${cursorClass} ${className}`}
    >
      {children}
    </div>
  );
}
