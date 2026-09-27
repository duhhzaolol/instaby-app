import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ligadas às variáveis CSS em styles/tokens-colors.css (não mais hex
        // fixo) — é isso que permite o tema "cinza" trocar essas cores em
        // tempo real, sem precisar recompilar nada. Ver components/ui/TemaAlternativo.tsx.
        base: "var(--base)",
        card: "var(--card)",
        hover: "var(--hover)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      boxShadow: {
        premium: "0 8px 24px -8px rgba(0,0,0,0.5)",
        "premium-lg": "0 20px 40px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(230, 57, 70,0.15), 0 8px 24px -8px rgba(230, 57, 70,0.15)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
