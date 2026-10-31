import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = ShieldCheck,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl emergency-surface border border-[var(--border-subtle)] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)] text-emerald-400 light:text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h4 className="font-bold text-base text-[var(--text-primary)] mb-1">
        {title}
      </h4>

      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="touch-target px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 light:bg-amber-600 light:hover:bg-amber-500 text-slate-950 light:text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
