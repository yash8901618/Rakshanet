import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const TOAST_ICONS = {
  info: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

const TOAST_STYLES = {
  info: 'bg-navy-850 light:bg-slate-50 border-sky-500 text-sky-400 light:text-sky-700',
  success: 'bg-navy-850 light:bg-slate-50 border-emerald-500 text-emerald-400 light:text-emerald-700',
  warning: 'bg-navy-850 light:bg-slate-50 border-amber-500 text-amber-400 light:text-amber-800',
  critical: 'bg-red-950 light:bg-red-50 border-red-600 text-red-400 light:text-red-700 shadow-xl shadow-red-950/50',
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type] || AlertCircle;
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 emergency-surface ${style}`}
              role="alert"
              aria-live="polite"
            >
              <div className="shrink-0 mt-0.5">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-sm text-[var(--text-primary)]">
                  {toast.title}
                </h5>
                {toast.message && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
                {toast.action && (
                  <button
                    type="button"
                    onClick={toast.action.onClick}
                    className="mt-2 text-xs font-bold text-amber-400 hover:underline uppercase tracking-wide"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                className="touch-target -mr-2 -mt-2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
