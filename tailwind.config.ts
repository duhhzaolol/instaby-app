import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#09090B",
        card: "#111827",
        hover: "#1F2937",
        accent: "#FACC15",
        "accent-dim": "#3a3418",
        text: "#F9FAFB",
        muted: "#9CA3AF",
        border: "rgba(255,255,255,.06)",
      },
      boxShadow: {
        premium: "0 8px 24px -8px rgba(0,0,0,0.5)",
        "premium-lg": "0 20px 40px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(250,204,21,0.15), 0 8px 24px -8px rgba(250,204,21,0.15)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
