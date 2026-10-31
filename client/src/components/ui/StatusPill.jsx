import React from 'react';

const STATUS_CONFIGS = {
  online: {
    label: 'Online Hub',
    dot: 'bg-emerald-500 animate-pulse',
    border: 'border-emerald-500/40 light:border-emerald-500',
    bg: 'bg-emerald-950/60 light:bg-emerald-50',
    text: 'text-emerald-300 light:text-emerald-800'
  },
  mesh: {
    label: 'BLE Mesh Local',
    dot: 'bg-amber-400 animate-pulse',
    border: 'border-amber-500/40 light:border-amber-500',
    bg: 'bg-amber-950/60 light:bg-amber-50',
    text: 'text-amber-300 light:text-amber-800'
  },
  syncing: {
    label: 'Syncing...',
    dot: 'bg-sky-400 animate-spin',
    border: 'border-sky-500/40 light:border-sky-500',
    bg: 'bg-sky-950/60 light:bg-sky-50',
    text: 'text-sky-300 light:text-sky-800'
  },
  dispatched: {
    label: 'Dispatched',
    dot: 'bg-orange-500 animate-pulse',
    border: 'border-orange-500/40 light:border-orange-500',
    bg: 'bg-orange-950/60 light:bg-orange-50',
    text: 'text-orange-300 light:text-orange-800'
  },
  inTransit: {
    label: 'En Route',
    dot: 'bg-blue-400 animate-pulse',
    border: 'border-blue-500/40 light:border-blue-500',
    bg: 'bg-blue-950/60 light:bg-blue-50',
    text: 'text-blue-300 light:text-blue-800'
  },
  resolved: {
    label: 'Cleared / Safe',
    dot: 'bg-emerald-400',
    border: 'border-slate-700 light:border-slate-300',
    bg: 'bg-slate-900/60 light:bg-slate-100',
    text: 'text-slate-300 light:text-slate-700'
  },
  critical: {
    label: 'Critical Alert',
    dot: 'bg-red-500 animate-ping',
    border: 'border-red-500/60 light:border-red-500',
    bg: 'bg-red-950/80 light:bg-red-50',
    text: 'text-red-300 light:text-red-800'
  }
};

export const StatusPill = ({
  status = 'online',
  customLabel,
  size = 'md',
  className = ''
}) => {
  const cfg = STATUS_CONFIGS[status] || STATUS_CONFIGS.online;
  const label = customLabel || cfg.label;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-mono',
    md: 'text-xs px-2.5 py-1 gap-2 font-mono',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-mono'
  }[size] || 'text-xs px-2.5 py-1 gap-2 font-mono';

  return (
    <div
      className={`inline-flex items-center rounded-full border transition-all ${cfg.bg} ${cfg.border} ${cfg.text} ${sizeClasses} ${className}`}
      role="status"
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <span className="font-semibold tracking-wide">{label}</span>
    </div>
  );
};

export default StatusPill;
