"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Aba = { label: string; href: string };

// Abas no topo de Financeiro e Comercial (redesign fase 1). Antes cada subpágina
// era um item do menu lateral; agora a seção é um item só no menu e as
// subpáginas viram abas aqui. A aba ativa é a de caminho mais específico que
// bate com a URL (senão "Resumo" /dashboard/financeiro acenderia em todas).
export function AbasSecao({ abas }: { abas: Aba[] }) {
  const pathname = usePathname() || "";
  const ativa = abas
    .filter((a) => pathname === a.href || pathname.startsWith(a.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (abas.length < 2) return null;

  return (
    <nav aria-label="Seções" className="mb-6 overflow-x-auto print:hidden">
      <div className="inline-flex gap-0.5 rounded-[10px] bg-card p-[3px]">
        {abas.map((aba) => {
          const eAtiva = aba === ativa;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              aria-current={eAtiva ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-[5px] text-[12.5px] font-bold transition-colors ${
                eAtiva ? "bg-hover text-text" : "text-muted hover:text-text"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
