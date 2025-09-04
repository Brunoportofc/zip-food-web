/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFD700',
        'primary-dark': '#E6C200',
        black: '#000000',
        white: '#FFFFFF',
      },
      fontFamily: {
        'quicksand-regular': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-medium': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-semibold': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-bold': ['var(--font-geist-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};