/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep void purple background
        void: {
          DEFAULT: '#0d0a14',
          50: '#1a1525',
          100: '#15111f',
          200: '#0d0a14',
        },
        // Main rose/dusty pink palette based on #b57171
        rose: {
          50: '#fdf5f5',
          100: '#fae8e8',
          200: '#f5d5d5',
          300: '#edb8b8',
          400: '#d99191',
          500: '#b57171',
          600: '#9c5a5a',
          700: '#824a4a',
          800: '#6c4040',
          900: '#5b3939',
          950: '#301b1b',
        },
        // Accent teal
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Purple accents for sections
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#2e1065',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'accordion-down': {
          from: { height: 0, opacity: 0 },
          to: { height: 'var(--accordion-height)', opacity: 1 },
        },
        'accordion-up': {
          from: { height: 'var(--accordion-height)', opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
