/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          bg: '#D5DFEB',
        },
        scenario: {
          a: '#16785A',
          b: '#B8860B',
        },
        accent: '#E8B830',
        toll: '#DC2626',
        turnpike: {
          bg: '#FEF3C7',
          text: '#D97706',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  safelist: [
    'bg-scenario-a', 'bg-scenario-b',
    'text-scenario-a', 'text-scenario-b',
    'border-scenario-a', 'border-scenario-b',
    'focus:ring-scenario-a/30', 'focus:ring-scenario-b/30',
  ],
  plugins: [],
};
