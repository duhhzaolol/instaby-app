"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de abas genérica — usada em Financeiro e Comercial, agora que os dois
// viraram "1 item no menu lateral, várias abas por dentro da página" (redesign
// v144, Parte 1). Cada aba é uma rota de verdade (não troca conteúdo via
// JavaScript) — mantém os endereços que já existiam, só muda como se chega
// neles, então nenhum link/atalho que já apontava pra essas páginas quebra.
export function AbasSecao({ abas }: { abas: { label: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
      {abas.map((aba) => {
        const ativo = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`relative shrink-0 px-3.5 py-2.5 text-sm transition-colors ${
              ativo ? "font-medium text-text" : "text-muted hover:text-text"
            }`}
          >
            {aba.label}
            {ativo && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </div>
  );
}
