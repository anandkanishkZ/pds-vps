/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand palette (blue) centered on #1868af
        brand: {
          50: '#f2f7fb',
          100: '#e4eef8',
          200: '#c4dbef',
          300: '#9fc6e5',
          400: '#6fa9d8',
          500: '#3f8bc9',
          600: '#1868af', // primary
          700: '#155a97',
          800: '#124a7b',
          900: '#0f3d64',
          950: '#0a2740'
        }
      },
      boxShadow: {
        'brand-glow': '0 0 0 3px rgba(234,88,12,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3f8bc9 0%, #1868af 55%, #124a7b 100%)'
      }
    },
  },
  plugins: [],
};
