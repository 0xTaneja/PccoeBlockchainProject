/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          800: '#1e40af',
          700: '#1d4ed8',
          600: '#2563eb',
        }
      }
    },
  },
  plugins: [],
} 