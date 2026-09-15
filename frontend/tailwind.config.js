/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF9',
          100: '#FBF9F5',
          200: '#F5F2EB',
          300: '#EAE5DB',
          400: '#DDD6C9',
          500: '#C7BEAD',
        },
        ink: {
          950: '#14120E',
          900: '#1F1C18',
          800: '#2E2B25',
          700: '#474239',
          600: '#696255',
          500: '#8A8271',
        },
        sand: {
          50: '#FAF8F4',
          100: '#F4F0E8',
          200: '#E8E1D5',
          300: '#D5CCC0',
          400: '#BDB2A3',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(31, 28, 24, 0.04), 0 1px 3px 0 rgba(31, 28, 24, 0.02)',
        'card': '0 1px 3px 0 rgba(31, 28, 24, 0.05), 0 4px 12px 0 rgba(31, 28, 24, 0.03)',
      }
    },
  },
  plugins: [],
}
