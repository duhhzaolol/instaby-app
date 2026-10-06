import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instaby App",
  description: "Painel interno da Instaby Agência",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Instaby",
    statusBarStyle: "default",
  },
};

// Roda antes da página pintar na tela, pra já aplicar o tema "cinza" salvo
// (se for o caso) sem dar aquele flash do escuro padrão por uma fração de
// segundo. Mesma chave de localStorage usada em components/ui/TemaAlternativo.tsx.
const SCRIPT_TEMA_INICIAL = `
try {
  if (localStorage.getItem("instaby:tema") === "cinza") {
    document.documentElement.setAttribute("data-theme", "cinza");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Script id="tema-inicial" strategy="beforeInteractive">
          {SCRIPT_TEMA_INICIAL}
        </Script>
        {children}
      </body>
    </html>
  );
}
