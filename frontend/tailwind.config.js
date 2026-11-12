/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Every colour is a theme token (see src/index.css), so the whole app re-skins by changing [data-theme] alone.
        // The rgb(var(...) / <alpha-value>) form keeps opacity modifiers like bg-accent-cyan/10 working.
        white: 'rgb(var(--c-fg) / min(1, calc(<alpha-value> * var(--fg-boost))))',
        background: 'rgb(var(--c-bg) / <alpha-value>)',
        'card-bg': 'rgb(var(--c-card) / 0.7)',
        'accent-cyan': 'rgb(var(--c-accent) / min(1, calc(<alpha-value> * var(--a-boost))))',
        'accent-purple': 'rgb(var(--c-accent2) / min(1, calc(<alpha-value> * var(--a-boost))))',
        'success-green': 'rgb(var(--c-success) / min(1, calc(<alpha-value> * var(--a-boost))))',
        'warning-amber': 'rgb(var(--c-warning) / min(1, calc(<alpha-value> * var(--a-boost))))',
        'error-red': 'rgb(var(--c-error) / min(1, calc(<alpha-value> * var(--a-boost))))',
        'text-primary': 'rgb(var(--c-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-muted) / <alpha-value>)',
        amber: {
          300: 'rgb(var(--c-amber-300) / min(1, calc(<alpha-value> * var(--a-boost))))',
          400: 'rgb(var(--c-amber-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-amber-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        green: {
          400: 'rgb(var(--c-green-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-green-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        emerald: {
          300: 'rgb(var(--c-emerald-300) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        cyan: {
          300: 'rgb(var(--c-cyan-300) / min(1, calc(<alpha-value> * var(--a-boost))))',
          400: 'rgb(var(--c-cyan-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-cyan-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        teal: {
          400: 'rgb(var(--c-teal-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-teal-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        purple: {
          200: 'rgb(var(--c-purple-200) / min(1, calc(<alpha-value> * var(--a-boost))))',
          400: 'rgb(var(--c-purple-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-purple-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        pink: {
          400: 'rgb(var(--c-pink-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-pink-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        rose: {
          400: 'rgb(var(--c-rose-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-rose-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        red: {
          400: 'rgb(var(--c-red-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        orange: {
          400: 'rgb(var(--c-orange-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-orange-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        indigo: {
          400: 'rgb(var(--c-indigo-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-indigo-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        blue: {
          400: 'rgb(var(--c-blue-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-blue-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        slate: {
          300: 'rgb(var(--c-slate-300) / min(1, calc(<alpha-value> * var(--a-boost))))',
          400: 'rgb(var(--c-slate-400) / min(1, calc(<alpha-value> * var(--a-boost))))',
          500: 'rgb(var(--c-slate-500) / min(1, calc(<alpha-value> * var(--a-boost))))',
          700: 'rgb(var(--c-slate-700) / min(1, calc(<alpha-value> * var(--a-boost))))',
          800: 'rgb(var(--c-slate-800) / min(1, calc(<alpha-value> * var(--a-boost))))',
        },
        onaccent: 'rgb(var(--c-on-accent) / <alpha-value>)',
        border: 'rgb(var(--c-accent) / 0.15)',
        navy: {
          900: 'rgb(var(--c-navy-900) / <alpha-value>)',
          800: 'rgb(var(--c-navy-800) / <alpha-value>)',
          700: 'rgb(var(--c-navy-700) / <alpha-value>)',
          600: 'rgb(var(--c-navy-600) / <alpha-value>)',
          500: 'rgb(var(--c-navy-500) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyan-purple': 'var(--grad-brand)',
        brand: 'var(--grad-brand)',
        'navy-gradient': 'linear-gradient(180deg, rgb(var(--c-navy-900)) 0%, rgb(var(--c-navy-800)) 100%)',
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
            boxShadow: '0 0 8px rgb(var(--c-accent) / 0.4), 0 0 20px rgb(var(--c-accent) / 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgb(var(--c-accent) / 0.8), 0 0 40px rgb(var(--c-accent) / 0.3)',
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
        'glow-cyan': '0 0 20px rgb(var(--c-accent) / 0.4), 0 0 40px rgb(var(--c-accent) / 0.1)',
        'glow-purple': '0 0 20px rgb(var(--c-accent2) / 0.4), 0 0 40px rgb(var(--c-accent2) / 0.1)',
        'glow-green': '0 0 20px rgb(var(--c-success) / 0.4)',
        'glow-red': '0 0 20px rgb(var(--c-error) / 0.4)',
        card: '0 8px 32px rgb(var(--c-shadow) / 0.4), 0 1px 0 rgb(var(--c-fg) / 0.05) inset',
        'card-hover': '0 16px 48px rgb(var(--c-shadow) / 0.5), 0 0 20px rgb(var(--c-accent) / 0.1)',
      },
      backdropBlur: {
        xs: '4px',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--c-accent) / 0.15)',
        cyan: 'rgb(var(--c-accent) / 0.3)',
        purple: 'rgb(var(--c-accent2) / 0.3)',
      },
    },
  },
  plugins: [],
}
