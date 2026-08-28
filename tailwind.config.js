/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#006fc7',
          700: '#0159a2',
          800: '#064b85',
          900: '#0b3f6f',
          950: '#07284a',
        },
        navy: {
          800: '#0f172a',
          900: '#0b1120',
          950: '#060a12',
        }
      }
    },
  },
  plugins: [],
}
