import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'open' | 'closed' | 'merged' | 'draft' | 'warning' | 'info' | 'critical' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '', showDot = false }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  // Non-luminous matte color palette: calm, architectural, zero fluorescent neon
  const variantConfig = {
    open: {
      wrapper: 'bg-emerald-950/40 text-emerald-300/90 border border-emerald-800/40',
      dot: 'bg-emerald-400',
    },
    closed: {
      wrapper: 'bg-purple-950/40 text-purple-300/90 border border-purple-800/40',
      dot: 'bg-purple-400',
    },
    merged: {
      wrapper: 'bg-slate-800/80 text-indigo-300/90 border border-indigo-900/50',
      dot: 'bg-indigo-400',
    },
    draft: {
      wrapper: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
      dot: 'bg-zinc-500',
    },
    warning: {
      wrapper: 'bg-amber-950/40 text-amber-300/90 border border-amber-800/40',
      dot: 'bg-amber-400',
    },
    info: {
      wrapper: 'bg-sky-950/40 text-sky-300/90 border border-sky-800/40',
      dot: 'bg-sky-400',
    },
    critical: {
      wrapper: 'bg-rose-950/40 text-rose-300/90 border border-rose-800/40',
      dot: 'bg-rose-400',
    },
    neutral: {
      wrapper: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      dot: 'bg-zinc-400',
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono tracking-tight transition-colors ${sizeClasses} ${variantConfig.wrapper} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantConfig.dot}`} />}
      <span>{children}</span>
    </span>
  );
}
