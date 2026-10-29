/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme: `night-950` is the page background and `cream` is ink.
        night: {
          950: '#0A0A0A',
          900: '#141414',
          850: '#1A1A1A',
          800: '#1F1F1F',
          700: '#2A2A2A',
          600: '#3A3A3A',
          500: '#6B6B6B',
        },
        accent: {
          DEFAULT: '#F5F5F5',
          light: '#FFFFFF',
          dark: '#D9D9D9',
        },
        cream: '#FFFFFF',
        muted: '#B9C0CA',
        danger: '#E5484D',
        success: '#34D399',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.12em',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(245,245,245,0.28), 0 18px 50px -34px rgba(245,245,245,0.35)',
        card: '0 24px 60px -48px rgba(0,0,0,0.9)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        fadeUp: 'fadeUp .45s ease-out both',
      },
    },
  },
  plugins: [],
}
