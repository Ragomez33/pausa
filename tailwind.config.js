/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F4',
        card: '#FFFFFF',
        'border-card': '#E5E0DA',
        'text-primary': '#1A1412',
        'text-secondary': '#6E655F',
        'brand-orange': '#FF5722',
        accent: '#FF5722',
        'accent-strong': '#C2410C',
        'accent-pressed': '#C2410C',
        'brand-amber': '#B45309',
        white: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
