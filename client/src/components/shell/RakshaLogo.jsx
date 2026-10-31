import React from 'react';

export const RakshaLogo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', badge: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-base', badge: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', badge: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', badge: 'text-xs' },
  }[size] || { icon: 'w-9 h-9', text: 'text-base', badge: 'text-[10px]' };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Shield + Interconnected Network Nodes */}
      <div className={`relative ${sizeMap.icon} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield Outline with National Gradient */}
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1437" />
              <stop offset="100%" stopColor="#1B254B" />
            </linearGradient>
            <linearGradient id="saffronGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Protective Shield Base */}
          <path
            d="M50 8 L88 22 C88 56 68 84 50 92 C32 84 12 56 12 22 L50 8 Z"
            fill="url(#shieldGrad)"
            stroke="url(#saffronGreen)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Interconnected Mesh Nodes & Edges */}
          <g stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="2 2">
            <line x1="50" y1="28" x2="32" y2="46" />
            <line x1="50" y1="28" x2="68" y2="46" />
            <line x1="32" y1="46" x2="40" y2="68" />
            <line x1="68" y1="46" x2="60" y2="68" />
            <line x1="40" y1="68" x2="60" y2="68" />
            <line x1="50" y1="28" x2="50" y2="52" />
            <line x1="32" y1="46" x2="50" y2="52" />
            <line x1="68" y1="46" x2="50" y2="52" />
            <line x1="40" y1="68" x2="50" y2="52" />
            <line x1="60" y1="68" x2="50" y2="52" />
          </g>

          {/* Top Node (Saffron) */}
          <circle cx="50" cy="28" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Left Node (India Green) */}
          <circle cx="32" cy="46" r="4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Right Node (India Green) */}
          <circle cx="68" cy="46" r="4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Central Command Core Node */}
          <circle cx="50" cy="52" r="5" fill="#FFFFFF" stroke="#0B1437" strokeWidth="2" />
          {/* Bottom Nodes */}
          <circle cx="40" cy="68" r="3.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="60" cy="68" r="3.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-extrabold tracking-wider text-[var(--text-primary)] ${sizeMap.text}`}>
              RAKSHANET
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <span className={`font-mono font-bold tracking-widest text-amber-400 light:text-amber-600 uppercase ${sizeMap.badge}`}>
            DISASTER GRID
          </span>
        </div>
      )}
    </div>
  );
};

export default RakshaLogo;
