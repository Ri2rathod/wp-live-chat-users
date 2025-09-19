/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/resources/**/*.{js,ts,jsx,tsx,php}", // also include PHP if in WP plugin
  ],
  darkMode: "class", // enable dark mode via .dark class
  theme: {
    extend: {}, // extend if you need spacing, fonts, etc.
  },
  plugins: [],
}
