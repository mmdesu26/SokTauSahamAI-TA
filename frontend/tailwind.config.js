/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1C4D8D",
        "primary-dark": "#0F2854",
        accent: "#4988C4",
        "bg-light": "#BDE8F5",
      },
    },
  },
  plugins: [],
};