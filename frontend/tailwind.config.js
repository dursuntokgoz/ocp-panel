/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'x3-blue': '#3b82f6',
        'x3-dark': '#1e293b',
        'x3-light': '#f1f5f9',
        'x3-border': '#e2e8f0',
        'x3-sidebar': '#f8fafc',
        'x3-header': '#1e40af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}