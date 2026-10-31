import React from 'react';
import { AlertTriangle, ShieldAlert, X, ChevronRight, BellRing } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export const AlertBanner = ({
  severity = 5,
  title,
  message,
  location,
  actionLabel,
  onAction,
  onDismiss,
  isDismissible = true,
  className = ''
}) => {
  const isCritical = Number(severity) >= 4;

  return (
    <div
      role="alert"
      aria-live={isCritical ? 'assertive' : 'polite'}
      className={`relative rounded-xl p-4 border transition-all ${
        severity === 5
          ? 'bg-red-950/90 light:bg-red-50 border-red-600 shadow-xl shadow-red-950/40 animate-pulse-l5'
          : severity === 4
          ? 'bg-orange-950/80 light:bg-orange-50 border-orange-500'
          : severity === 3
          ? 'bg-amber-950/80 light:bg-amber-50 border-amber-500'
          : 'bg-navy-800 light:bg-slate-50 border-[var(--border-strong)]'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-900/50 light:bg-red-100 text-red-400 light:text-red-700 shrink-0 mt-0.5">
            {severity === 5 ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : (
              <BellRing className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge level={severity} size="sm" />
              <h2 className="font-bold text-base text-[var(--text-primary)]">
                {title}
              </h2>
              {location && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40 light:bg-slate-200 text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {location}
                </span>
              )}
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="touch-target px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 light:bg-red-700 light:hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-900/50 transition-all active:scale-95"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {isDismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss Alert"
              className="touch-target p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
