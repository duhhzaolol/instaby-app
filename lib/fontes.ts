import { Manrope, JetBrains_Mono } from "next/font/google";

// Fontes do painel (redesign fase 1). Ficam só no painel e no login — a LP e a
// página de links continuam com a fonte de sempre, porque as variáveis abaixo só
// existem dentro de quem recebe a classe `fontesPainel`.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

// Números (valores em R$, horas, contagens) — todos os dígitos com a mesma
// largura, pra coluna de valores ficar alinhada.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const fontesPainel = `${manrope.variable} ${jetbrainsMono.variable}`;
