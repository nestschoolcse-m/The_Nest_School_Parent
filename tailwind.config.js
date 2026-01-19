/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        entry: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#166534",
        },
        exit: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#991b1b",
        },
        sports: {
          light: "#ede9fe",
          DEFAULT: "#8b5cf6",
          dark: "#5b21b6",
        },
      },
    },
  },
  plugins: [],
};
