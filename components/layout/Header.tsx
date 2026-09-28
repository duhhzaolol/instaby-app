"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Sparkles, X, Users, FileText, Plus } from "lucide-react";
import { ULTIMA_VERSAO_NOVIDADES } from "@/lib/changelog";
import { Cronometro } from "@/components/layout/Cronometro";

// Mesma chave usada em components/dashboard/MarcarNovidadesVistas.tsx.
const CHAVE_NOVIDADES_VISTAS = "instaby:novidades-vista";

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

type ResultadoBusca = {
  clientes: { id: string; nome: string; cor: string | null; status: string }[];
  orcamentos: { id: string; slug: string; status: string; clienteNome: string }[];
};

function BuscaGlobal() {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  useEffect(() => {
    const termoLimpo = termo.trim();
    if (termoLimpo.length < 2) {
      setResultado(null);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(termoLimpo)}`);
        if (res.ok) setResultado(await res.json());
      } catch {
        // busca é conveniência, não trava a tela se falhar
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [termo]);

  function limpar() {
    setTermo("");
    setResultado(null);
  }

  function irParaCliente(id: string) {
    setAberto(false);
    limpar();
    router.push(`/dashboard/clientes/${id}`);
  }

  function abrirOrcamento(slug: string) {
    setAberto(false);
    limpar();
    window.open(`/orcamento/${slug}`, "_blank");
  }

  const temResultado = !!resultado && (resultado.clientes.length > 0 || resultado.orcamentos.length > 0);
  const mostrarDropdown = aberto && termo.trim().length >= 2;

  return (
    <div className="hidden w-full max-w-sm lg:flex">
      <div ref={containerRef} className="relative w-full">
        <div className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-[13px] text-muted focus-within:border-accent/40">
          <Search size={15} className="shrink-0" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onFocus={() => setAberto(true)}
            placeholder="Buscar cliente, orçamento..."
            className="w-full bg-transparent text-text outline-none placeholder:text-muted"
          />
          {termo && (
            <button onClick={limpar} className="shrink-0 text-muted hover:text-text">
              <X size={13} />
            </button>
          )}
        </div>

        {mostrarDropdown && (
          <div className="absolute left-0 top-11 z-30 w-full overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-premium-lg">
            {buscando ? (
              <p className="px-3 py-2.5 text-xs text-muted">Buscando...</p>
            ) : !temResultado ? (
              <p className="px-3 py-2.5 text-xs text-muted">Nada encontrado.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {resultado!.clientes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => irParaCliente(c.id)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-hover"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${c.cor || "#9CA3AF"}1A`, color: c.cor || "#9CA3AF" }}
                    >
                      <Users size={12} />
                    </span>
                    <span className="truncate text-text">{c.nome}</span>
                  </button>
                ))}
                {resultado!.orcamentos.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => abrirOrcamento(o.slug)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-hover"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted">
                      <FileText size={12} />
                    </span>
                    <span className="truncate text-text">
                      {o.clienteNome} <span className="text-muted">· orçamento</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Header({
  nomePrimeiro,
  clientes,
}: {
  nomePrimeiro: string;
  clientes: { id: string; nome: string; cor: string | null }[];
}) {
  const pathname = usePathname() || "";
  // Cada tela já tem seu título no topo do conteúdo — a barra só mostra a
  // saudação no Início, pra não repetir "Tarefas" duas vezes, por exemplo.
  const noInicio = pathname === "/dashboard";
  const [temNovidadeNaoVista, setTemNovidadeNaoVista] = useState(false);

  useEffect(() => {
    try {
      const vista = Number(localStorage.getItem(CHAVE_NOVIDADES_VISTAS) || "0");
      setTemNovidadeNaoVista(vista < ULTIMA_VERSAO_NOVIDADES);
    } catch {
      // sem localStorage, sem bolinha — não é crítico
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b border-border bg-base/95 pl-16 pr-6 md:pl-8 md:pr-8 print:hidden">
      {noInicio && (
        <p className="min-w-0 shrink-0 truncate text-[15px] font-bold text-text">
          {saudacao()}, {nomePrimeiro}
        </p>
      )}

      <BuscaGlobal />

      <div className="ml-auto flex items-center gap-2.5">
        <Cronometro clientes={clientes} />
        <Link
          href="/dashboard/novidades"
          title="Novidades"
          aria-label="Novidades"
          className="relative hidden h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-card text-muted transition-colors hover:bg-hover hover:text-text sm:flex"
        >
          <Sparkles size={16} />
          {temNovidadeNaoVista && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />}
        </Link>
        {/* Ainda só decorativo — não existe um sistema de notificação de verdade
           por trás (nunca existiu, não é regressão da v141). Tirei a bolinha
           vermelha fixa que tinha antes porque ela dava a entender que tinha
           notificação nova sempre, mesmo sem nada por trás — melhor sem do
           que mentindo. */}
        <button
          title="Notificações (ainda não implementado)"
          aria-label="Notificações"
          className="hidden h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-card text-muted transition-colors hover:bg-hover hover:text-text sm:flex"
        >
          <Bell size={16} />
        </button>
        <Link
          href="/dashboard/tarefas?nova=1"
          className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3 text-[13.5px] font-bold text-white transition hover:brightness-110"
        >
          <Plus size={16} strokeWidth={2.25} />
          <span className="hidden sm:inline">Nova tarefa</span>
        </Link>
      </div>
    </header>
  );
}
