/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy token names kept for compatibility, but the palette is now
        // light: `night-950` is the page background and `cream` is ink.
        night: {
          950: '#FFFFFF',
          900: '#FAFAFA',
          850: '#F6F6F6',
          800: '#F2F2F2',
          700: '#EDEDED',
          600: '#E5E5E5',
          500: '#C9C9C9',
        },
        accent: {
          DEFAULT: '#9B1C1C',
          light: '#B3261E',
          dark: '#7F1616',
        },
        cream: '#0A0A0A',
        muted: '#6B6B6B',
        danger: '#B42318',
        success: '#1F7A4D',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.12em',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(155,28,28,0.28), 0 18px 50px -34px rgba(155,28,28,0.35)',
        card: '0 24px 60px -48px rgba(0,0,0,0.55)',
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
