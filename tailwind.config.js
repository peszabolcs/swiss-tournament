/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00d4ff',
        'neon-purple': '#b000ff',
        'neon-pink': '#ff006e',
        'dark-bg': '#0a0e27',
        'dark-card': '#151932',
        'dark-border': '#252a4a',
      },
      fontFamily: {
        'display': ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(176, 0, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
      }
    },
  },
  plugins: [],
}
