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
        primary: '#FF6B6B',
        'primary-dark': '#FF5252',
        'primary-light': '#FFB3B3',
        secondary: '#4ECDC4',
        'secondary-dark': '#45B7B8',
        accent: '#FFE66D',
        'accent-dark': '#FFD93D',
        success: '#6BCF7F',
        warning: '#FFB74D',
        error: '#FF5252',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
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