import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ligadas às variáveis CSS em styles/tokens-colors.css (não mais hex
        // fixo) — é isso que permite o tema "cinza" trocar essas cores em
        // tempo real, sem precisar recompilar nada. Ver components/ui/TemaAlternativo.tsx.
        //
        // IMPORTANTE: usa o formato rgb(var(--x) / <alpha-value>), não só
        // var(--x) — o placeholder <alpha-value> é o que deixa o Tailwind
        // calcular classes com opacidade (bg-card/60, border-accent/20...).
        // Sem ele, essas variáveis guardam "R G B" cru (ver tokens-colors.css)
        // e uma classe tipo bg-card/60 simplesmente não gera CSS nenhum —
        // sem erro no build, só some do estilo (era o bug da v141).
        base: "rgb(var(--base) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        hover: "rgb(var(--hover) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-dim": "rgb(var(--accent-dim) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        // --border já é um rgba() completo (não uma variável "R G B" crua),
        // então fica direto, sem o wrapper rgb(...).
        border: "var(--border)",
        // Tons extras do painel (redesign fase 1) — ver styles/tokens-painel.css.
        sidebar: "rgb(var(--sidebar) / <alpha-value>)",
        inset: "rgb(var(--inset) / <alpha-value>)",
      },
      fontFamily: {
        // Pra valores em R$, horas e contagens no painel. Fora do painel a
        // variável não existe e cai no monoespaçado padrão do sistema.
        numero: ["var(--font-jetbrains, ui-monospace)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
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
