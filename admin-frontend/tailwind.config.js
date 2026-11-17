/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f6ff',
          100: '#ecebff',
          500: '#5b4bff',
          600: '#4a3add',
          700: '#3b2ebb',
        },
      },
    },
  },
  plugins: [],
};
