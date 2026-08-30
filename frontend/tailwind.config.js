/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a2540',
          dark: '#06182b',
          light: '#155e86',
        },
        secondary: {
          DEFAULT: '#0e7490',
          light: '#22a7bf',
          dark: '#0b5f76',
        },
        soft: '#edf4f4',
        mist: '#f6fafa',
        paper: '#fbfbf9',
        brand: {
          DEFAULT: '#0a2540',
          dark: '#06182b',
          deep: '#0e3153',
          light: '#dceaf2',
          mid: '#0e7490',
          midlight: '#22a7bf',
          border: '#cbdee7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 37, 64, 0.06), 0 8px 24px rgba(10, 37, 64, 0.07)',
        soft: '0 2px 10px rgba(10, 37, 64, 0.06)',
        cardHover: '0 4px 12px rgba(10, 37, 64, 0.08), 0 20px 44px rgba(10, 37, 64, 0.13)',
        nav: '0 1px 0 rgba(10, 37, 64, 0.06), 0 8px 24px -12px rgba(10, 37, 64, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
