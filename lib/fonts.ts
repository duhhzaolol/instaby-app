// Fontes do redesign do painel — carregadas só uma vez aqui e aplicadas via
// className (as variáveis --font-manrope/--font-jetbrains-mono) no layout do
// painel (app/dashboard/layout.tsx) e no do login (app/login/layout.tsx).
// A landing (app/page.tsx) e o /link NÃO importam este arquivo de propósito —
// continuam na fonte de sistema de sempre, sem next/font nenhum.
import { Manrope, JetBrains_Mono } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
