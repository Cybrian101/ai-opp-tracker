/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050d1a',
        'card-bg': 'rgba(15, 32, 64, 0.7)',
        'accent-cyan': '#00d4ff',
        'accent-purple': '#7c3aed',
        'success-green': '#10b981',
        'warning-amber': '#f59e0b',
        'error-red': '#ef4444',
        'text-primary': '#f0f8ff',
        'text-muted': '#94a3b8',
        border: 'rgba(0, 212, 255, 0.15)',
        navy: {
          900: '#050d1a',
          800: '#0a1628',
          700: '#0f2040',
          600: '#162a50',
          500: '#1e3a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyan-purple': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        'navy-gradient': 'linear-gradient(180deg, #050d1a 0%, #0a1628 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        wave: 'wave 1.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.3)',
          },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)', opacity: '0.6' },
          '50%': { transform: 'scaleY(1.5)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.1)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.1)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        card: '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 212, 255, 0.1)',
      },
      backdropBlur: {
        xs: '4px',
      },
      borderColor: {
        DEFAULT: 'rgba(0, 212, 255, 0.15)',
        cyan: 'rgba(0, 212, 255, 0.3)',
        purple: 'rgba(124, 58, 237, 0.3)',
      },
    },
  },
  plugins: [],
}
