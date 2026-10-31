import React from 'react';

export const SkeletonLoader = ({
  variant = 'card', // 'text' | 'card' | 'badge' | 'metric'
  count = 1,
  className = ''
}) => {
  const getSkeletonItem = (index) => {
    switch (variant) {
      case 'text':
        return (
          <div
            key={index}
            className={`h-4 bg-navy-800/80 light:bg-slate-200 rounded animate-pulse ${className}`}
          />
        );
      case 'badge':
        return (
          <div
            key={index}
            className={`h-6 w-20 bg-navy-800/80 light:bg-slate-200 rounded-full animate-pulse ${className}`}
          />
        );
      case 'metric':
        return (
          <div
            key={index}
            className={`p-4 rounded-xl emergency-surface border border-[var(--border-subtle)] space-y-3 ${className}`}
          >
            <div className="h-3 w-24 bg-navy-800/80 light:bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-navy-800/80 light:bg-slate-200 rounded animate-pulse" />
            <div className="h-2 w-32 bg-navy-800/80 light:bg-slate-200 rounded animate-pulse" />
          </div>
        );
      case 'card':
      default:
        return (
          <div
            key={index}
            className={`p-4 rounded-xl emergency-surface border border-[var(--border-subtle)] space-y-3 ${className}`}
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-navy-800/80 light:bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-navy-800/80 light:bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-full bg-navy-800/60 light:bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-navy-800/40 light:bg-slate-200 rounded animate-pulse" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3 w-full" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: count }).map((_, idx) => getSkeletonItem(idx))}
    </div>
  );
};

export default SkeletonLoader;
