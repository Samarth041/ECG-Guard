/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07111F', // Deep navy background
          900: '#0C1829',
          850: '#101C2D', // Card surface
          800: '#152438', // Elevated surface
          700: '#1C314C', // Border / separator
          600: '#28456C',
        },
        teal: {
          400: '#38D6C4',
          500: '#20BFA8',
          600: '#149B88',
        },
        cyan: {
          400: '#6BB7FF',
          500: '#4D9FFF',
          600: '#2684F5',
        },
        ecg: {
          normal: '#38D6C4',
          supraventricular: '#6BB7FF',
          ventricular: '#F6AD55',
          fusion: '#FC8181',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
