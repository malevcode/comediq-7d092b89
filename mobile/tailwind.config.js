/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#1a1a1a",
        border: "#2a2a2a",
        accent: "#f5a623",
        muted: "#6b7280",
      },
    },
  },
  plugins: [],
};
