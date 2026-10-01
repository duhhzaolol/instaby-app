"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, ChevronDown, Search } from "lucide-react";
import { filtrarClientesAgenda } from "@/lib/agenda";

export type ClienteAgenda = { id: string; nome: string; cor: string | null };

export function FiltroClienteAgenda({
  clientes,
  clienteAtual,
}: {
  clientes: ClienteAgenda[];
  clienteAtual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selecionado = clientes.find((c) => c.id === clienteAtual);
  const encontrados = filtrarClientesAgenda(clientes, busca);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  function selecionar(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    id ? params.set("cliente", id) : params.delete("cliente");
    params.delete("tarefa");
    setAberto(false);
    setBusca("");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <div
      ref={ref}
      className="relative w-full sm:w-72"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setAberto(false);
        }
      }}
    >
      <button
        type="button"
        aria-label="Filtrar agenda por cliente"
        aria-expanded={aberto}
        aria-controls="clientes-agenda"
        onClick={() => {
          setAberto((v) => !v);
          setBusca("");
        }}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-left text-sm text-text hover:border-accent/40"
      >
        <Building2 size={15} className="shrink-0 text-muted" />
        {selecionado?.cor && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: selecionado.cor }}
          />
        )}
        <span className="min-w-0 flex-1 truncate">
          {selecionado?.nome || "Todos os clientes"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted" />
      </button>
      {aberto && (
        <div
          id="clientes-agenda"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card p-2 shadow-premium-lg"
        >
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-base px-2">
            <Search size={14} className="shrink-0 text-muted" />
            <input
              autoFocus
              aria-label="Buscar cliente na agenda"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-10 w-full bg-transparent text-sm text-text outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => selecionar("")}
              className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-left text-sm text-text hover:bg-hover"
            >
              Todos os clientes{" "}
              {!clienteAtual && <Check size={14} className="text-accent" />}
            </button>
            {encontrados.slice(0, 50).map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => selecionar(c.id)}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-text hover:bg-hover"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.cor || "#9CA3AF" }}
                />
                <span className="min-w-0 flex-1 break-words">{c.nome}</span>
                {c.id === clienteAtual && (
                  <Check size={14} className="shrink-0 text-accent" />
                )}
              </button>
            ))}
            {!encontrados.length && (
              <p className="px-2 py-3 text-xs text-muted">
                Nenhum cliente encontrado.
              </p>
            )}
            {encontrados.length > 50 && (
              <p className="px-2 py-2 text-xs text-muted">
                Há mais clientes. Digite o nome para localizar.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
