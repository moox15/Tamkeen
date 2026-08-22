/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050d1a',
          900: '#0A1628',
          800: '#0D1F4C',
          700: '#112258',
          600: '#163070',
        },
        royal: {
          600: '#1A3C8F',
          500: '#2150C8',
          400: '#2563EB',
          300: '#3B82F6',
        },
        gold: {
          600: '#8B6914',
          500: '#B8860B',
          400: '#C9A84C',
          300: '#D4B96A',
          200: '#E8D5A3',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #050d1a 0%, #0A1628 50%, #0D1F4C 100%)',
        'blue-gradient': 'linear-gradient(135deg, #1A3C8F 0%, #2563EB 100%)',
        'gold-gradient': 'linear-gradient(135deg, #B8860B 0%, #C9A84C 100%)',
        'hero-gradient': 'linear-gradient(135deg, #050d1a 0%, #0A1628 60%, #112258 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
