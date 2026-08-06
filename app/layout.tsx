import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instaby App",
  description: "Painel interno da Instaby Agência",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
