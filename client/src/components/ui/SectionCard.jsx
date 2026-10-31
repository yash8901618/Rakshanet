import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const SectionCard = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section
      className={`rounded-xl emergency-surface overflow-hidden border border-[var(--border-subtle)] transition-all ${className}`}
    >
      <header
        className={`px-4 py-3 border-b border-[var(--border-subtle)] bg-navy-850/40 light:bg-slate-50/80 flex items-center justify-between gap-3 ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-navy-800 light:bg-slate-200 text-amber-400 light:text-amber-600 shrink-0">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm tracking-wide text-[var(--text-primary)] truncate">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse Section' : 'Expand Section'}
              className="touch-target p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {(!collapsible || isExpanded) && (
        <div className={`p-4 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default SectionCard;
