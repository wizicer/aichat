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
        // WeChat green
        primary: '#07c160',
        'primary-dark': '#06ad56',
        // Background colors
        'bg-light': '#ededed',
        'bg-dark': '#111111',
        // Card colors
        'card-light': '#ffffff',
        'card-dark': '#1e1e1e',
      }
    },
  },
  plugins: [],
}
