import React from 'react';

export const LiveDot = ({
  color = 'green', // 'green' | 'amber' | 'red' | 'blue'
  size = 'md', // 'sm' | 'md' | 'lg'
  pulse = true,
  className = ''
}) => {
  const colorMap = {
    green: {
      ping: 'bg-emerald-400',
      dot: 'bg-emerald-500'
    },
    amber: {
      ping: 'bg-amber-400',
      dot: 'bg-amber-500'
    },
    red: {
      ping: 'bg-red-500',
      dot: 'bg-red-600'
    },
    blue: {
      ping: 'bg-sky-400',
      dot: 'bg-sky-500'
    }
  }[color] || { ping: 'bg-emerald-400', dot: 'bg-emerald-500' };

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  }[size] || 'w-2.5 h-2.5';

  return (
    <span className={`relative inline-flex items-center justify-center ${sizeMap} ${className}`}>
      {pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorMap.ping}`}
          aria-hidden="true"
        />
      )}
      <span className={`relative inline-flex rounded-full ${sizeMap} ${colorMap.dot}`} />
    </span>
  );
};

export default LiveDot;
