/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C9A86C',
          'gold-light': '#D4B87F',
          'gold-dark': '#B89555',
          cream: '#FBF7F4',
          charcoal: '#2C2C2C',
          rose: '#E8B4B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
