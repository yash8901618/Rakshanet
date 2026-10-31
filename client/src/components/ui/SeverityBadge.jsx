import React from 'react';
import { AlertCircle, AlertTriangle, Flame, ShieldAlert, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  1: {
    bg: 'bg-emerald-950/80 light:bg-emerald-50',
    border: 'border-emerald-500/50 light:border-emerald-400',
    text: 'text-emerald-400 light:text-emerald-700',
    dot: 'bg-emerald-500',
    icon: Info,
    label: 'L1 · ADVISORY',
    shortLabel: 'L1',
    glow: 'shadow-emerald-900/30'
  },
  2: {
    bg: 'bg-lime-950/80 light:bg-lime-50',
    border: 'border-lime-500/50 light:border-lime-400',
    text: 'text-lime-400 light:text-lime-700',
    dot: 'bg-lime-500',
    icon: AlertCircle,
    label: 'L2 · MODERATE',
    shortLabel: 'L2',
    glow: 'shadow-lime-900/30'
  },
  3: {
    bg: 'bg-amber-950/80 light:bg-amber-50',
    border: 'border-amber-500/50 light:border-amber-400',
    text: 'text-amber-400 light:text-amber-800',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
    label: 'L3 · SERIOUS',
    shortLabel: 'L3',
    glow: 'shadow-amber-900/40'
  },
  4: {
    bg: 'bg-orange-950/80 light:bg-orange-50',
    border: 'border-orange-500/60 light:border-orange-400',
    text: 'text-orange-400 light:text-orange-800',
    dot: 'bg-orange-500',
    icon: Flame,
    label: 'L4 · SEVERE',
    shortLabel: 'L4',
    glow: 'shadow-orange-900/50'
  },
  5: {
    bg: 'bg-red-950/90 light:bg-red-50',
    border: 'border-red-600 light:border-red-500',
    text: 'text-red-400 light:text-red-700 font-extrabold',
    dot: 'bg-red-500 animate-ping',
    icon: ShieldAlert,
    label: 'L5 · CATASTROPHIC',
    shortLabel: 'L5',
    glow: 'shadow-red-600/50 ring-2 ring-red-500/40 animate-pulse-l5'
  }
};

export const SeverityBadge = ({
  level = 1,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = ''
}) => {
  const safeLevel = Math.max(1, Math.min(5, Number(level) || 1));
  const cfg = SEVERITY_CONFIG[safeLevel];
  const Icon = cfg.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-mono'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-mono';

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-bold transition-all ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Hazard Severity ${cfg.label}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} aria-hidden="true" />}
      <span>{showLabel ? cfg.label : cfg.shortLabel}</span>
      {safeLevel === 5 && (
        <span className="relative flex h-2 w-2 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </span>
  );
};

export default SeverityBadge;
