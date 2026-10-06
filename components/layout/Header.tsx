"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Sparkles, X, Users, FileText } from "lucide-react";
import { ULTIMA_VERSAO_NOVIDADES } from "@/lib/changelog";
import { CronometroTopbar } from "@/components/layout/CronometroTopbar";
import { RelogioTopbar } from "@/components/layout/RelogioTopbar";
import { NovaTarefaTopbar } from "@/components/layout/NovaTarefaTopbar";
import { SinoNotificacoes } from "@/components/layout/SinoNotificacoes";
import { FUSO_HORARIO } from "@/lib/dataHora";

// Mesma chave usada em components/dashboard/MarcarNovidadesVistas.tsx.
const CHAVE_NOVIDADES_VISTAS = "instaby:novidades-vista";

type Cliente = { id: string; nome: string; cor: string | null };

function saudacao() {
  const hora = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_HORARIO,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date()));
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

  // Atalho de teclado ⌘K / Ctrl+K — foca a busca de qualquer lugar da tela.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setAberto(true);
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, []);

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
    <div className="hidden flex-1 justify-center px-8 xl:flex">
      <div ref={containerRef} className="relative w-full max-w-sm">
        <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted focus-within:border-accent/40">
          <Search size={15} className="shrink-0" />
          <input
            ref={inputRef}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onFocus={() => setAberto(true)}
            placeholder="Buscar cliente, orçamento..."
            className="w-full bg-transparent text-text outline-none placeholder:text-muted"
          />
          {termo ? (
            <button onClick={limpar} className="shrink-0 text-muted hover:text-text">
              <X size={13} />
            </button>
          ) : (
            <span className="fonte-valores hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted/70 sm:inline">
              ⌘K
            </span>
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

export function Header({ nomePrimeiro, clientes }: { nomePrimeiro: string; clientes: Cliente[] }) {
  const pathname = usePathname() || "";
  const partes = pathname.split("/").filter(Boolean).filter((p) => p !== "dashboard");
  const [temNovidadeNaoVista, setTemNovidadeNaoVista] = useState(false);
  // A saudação depende do horário atual. O primeiro texto é igual no servidor
  // e no navegador; depois da montagem, usamos sempre o horário de Brasília.
  const [textoSaudacao, setTextoSaudacao] = useState("Olá");

  useEffect(() => {
    const atualizar = () => setTextoSaudacao(saudacao());
    atualizar();
    const intervalo = setInterval(atualizar, 60_000);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, []);

  useEffect(() => {
    try {
      const vista = Number(localStorage.getItem(CHAVE_NOVIDADES_VISTAS) || "0");
      setTemNovidadeNaoVista(vista < ULTIMA_VERSAO_NOVIDADES);
    } catch {
      // sem localStorage, sem bolinha — não é crítico
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-y-3 border-b border-border bg-base py-3 pl-16 pr-6 md:pl-6 xl:h-16 xl:flex-nowrap xl:py-0 print:hidden">
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
          {textoSaudacao}, {nomePrimeiro} 👋
        </p>
      </div>

      <BuscaGlobal />

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <RelogioTopbar />
        <CronometroTopbar clientes={clientes} />

        <Link
          href="/dashboard/novidades"
          title="Novidades"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition-colors hover:bg-hover hover:text-text"
        >
          <Sparkles size={16} />
          {temNovidadeNaoVista && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />}
        </Link>
        <SinoNotificacoes />

        <NovaTarefaTopbar clientes={clientes} />
      </div>
    </header>
  );
}
