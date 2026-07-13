import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          500: "#3b5bfd",
          600: "#2f47e0",
          700: "#2638b3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
