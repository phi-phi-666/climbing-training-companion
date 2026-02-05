/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main rose/dusty pink palette based on #b57171
        rose: {
          50: '#fdf5f5',
          100: '#fae8e8',
          200: '#f5d5d5',
          300: '#edb8b8',
          400: '#d99191',
          500: '#b57171', // Your main color
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
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
