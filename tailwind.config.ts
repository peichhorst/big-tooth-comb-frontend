/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    // These three lines are the important fix
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', "system-ui"],
        creepy: ['"Creepster"', "cursive"],
        mono: ['"Roboto Mono"', "monospace"],
      },
      colors: {
        blood: {
          500: "#fdb562",
          600: "#f89c43",
          700: "#f2851f",
        },
        grit: "#0a0a0a",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
