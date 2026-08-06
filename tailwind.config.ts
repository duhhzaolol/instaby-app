import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0a",
        card: "#1a1a1a",
        border: "#333333",
        accent: "#E63946",
        muted: "#9c9a92",
      },
    },
  },
  plugins: [],
};

export default config;
