/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B1F',
          900: '#0B1437', // Master Command Base
          850: '#0E1A45',
          800: '#111C44', // Surface Card
          750: '#162354',
          700: '#1B254B', // Elevated Surface
          600: '#243269',
          500: '#324687',
        },
        severity: {
          1: '#22C55E', // L1 Minor / Advisory
          2: '#84CC16', // L2 Moderate / Attention
          3: '#F59E0B', // L3 Serious / Warning
          4: '#F97316', // L4 Severe / Critical
          5: '#DC2626', // L5 Catastrophic / Priority Override
        },
        india: {
          saffron: '#F59E0B',
          saffronLight: '#FEF3C7',
          green: '#16A34A',
          greenLight: '#DCFCE7',
          chakra: '#0B1437',
        },
        // Semantic dynamic tokens
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
      screens: {
        'xs': '360px',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-l5': 'pulseL5 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        pulseL5: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.85',
            boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)',
            transform: 'scale(1.02)',
          },
        },
      },
    },
  },
  plugins: [],
}
