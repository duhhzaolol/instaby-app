"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

const rotulos: Record<string, string> = {
  dashboard: "Visão geral",
  clientes: "Clientes",
  servicos: "Serviços",
  orcamentos: "Orçamentos",
  financeiro: "Financeiro",
  novo: "Novo",
  configuracoes: "Configurações",
};

export function Header({ nomePrimeiro }: { nomePrimeiro: string }) {
  const pathname = usePathname();
  const partes = (pathname || "").split("/").filter(Boolean).filter((p) => p !== "dashboard");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-base/80 pl-16 pr-6 backdrop-blur-xs md:pl-6">
      <div>
        <p className="text-xs text-muted">
          Dashboard{partes.length > 0 && " / "}
          {partes.map((p, i) => (
            <span key={i}>
              {rotulos[p] || p}
              {i < partes.length - 1 && " / "}
            </span>
          ))}
        </p>
        <p className="text-sm font-medium text-text">
          {saudacao()}, {nomePrimeiro} 👋
        </p>
      </div>

      <div className="hidden flex-1 justify-center px-8 lg:flex">
        <div className="flex h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-sm text-muted">
          <Search size={15} />
          <span>Buscar cliente, orçamento...</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text hover:bg-hover transition-colors">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <Button size="sm" className="hidden sm:inline-flex">
          <Plus size={14} /> Novo
        </Button>
      </div>
    </header>
  );
}
