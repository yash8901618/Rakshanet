import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend, // { value: '+2', direction: 'up' | 'down' | 'neutral', label: 'vs last hour' }
  severityLevel, // 1 to 5 to color the accent edge
  onClick,
  className = ''
}) => {
  const severityBorderClasses = {
    1: 'border-l-4 border-l-emerald-500',
    2: 'border-l-4 border-l-lime-500',
    3: 'border-l-4 border-l-amber-500',
    4: 'border-l-4 border-l-orange-500',
    5: 'border-l-4 border-l-red-600 animate-pulse-l5',
  }[severityLevel] || 'border-l-4 border-l-amber-500/50';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${title}: ${value} ${unit || ''}`}
      className={`relative p-4 rounded-xl emergency-surface border border-[var(--border-subtle)] ${severityBorderClasses} transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-amber-500' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)] truncate">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {value}
            </span>
            {unit && (
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)] text-amber-400 light:text-amber-600 shrink-0">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-[var(--text-secondary)] truncate">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-mono font-semibold ${
                trend.direction === 'up'
                  ? 'text-red-400 light:text-red-600'
                  : trend.direction === 'down'
                  ? 'text-emerald-400 light:text-emerald-600'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
