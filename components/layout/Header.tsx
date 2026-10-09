"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, X, Users, FileText, ChevronRight } from "lucide-react";
import { ULTIMA_VERSAO_NOVIDADES } from "@/lib/changelog";
import { RelogioTopbar } from "@/components/layout/RelogioTopbar";
import { NovaTarefaTopbar } from "@/components/layout/NovaTarefaTopbar";
import { SinoNotificacoes } from "@/components/layout/SinoNotificacoes";
import { FUSO_HORARIO } from "@/lib/dataHora";

const CHAVE_NOVIDADES_VISTAS = "instaby:novidades-vista";
type Cliente = { id: string; nome: string; cor: string | null };

function saudacao() {
  const hora = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_HORARIO, hour: "2-digit", hourCycle: "h23",
  }).format(new Date()));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

const rotulos: Record<string, string> = {
  clientes: "Clientes", tarefas: "Planejamento e produção", agenda: "Agenda", horas: "Horas",
  capacidade: "Capacidade", trafego: "Tráfego pago", servicos: "Serviços",
  pacotes: "Pacotes", oportunidades: "Oportunidades", orcamentos: "Orçamentos",
  contratos: "Contratos", financeiro: "Financeiro", perfil: "Perfil",
  novidades: "Novidades", configuracoes: "Configurações", equipe: "Equipe",
  site: "Site", novo: "Novo", editar: "Editar", calendario: "Calendário",
  "contas-a-receber": "Contas a receber", "contas-a-pagar": "Contas a pagar",
  patrimonio: "Patrimônio", dre: "DRE", "fluxo-de-caixa": "Fluxo de caixa",
  "registrar-gasto": "Registrar gasto", cobrancas: "Cobranças", resumo: "Resumo",
};

const secoesComPagina = new Set([
  "clientes", "tarefas", "agenda", "horas", "capacidade", "trafego", "servicos",
  "pacotes", "oportunidades", "orcamentos", "contratos", "financeiro", "perfil",
  "novidades", "configuracoes",
]);

type ResultadoBusca = {
  clientes: { id: string; nome: string; cor: string | null; status: string }[];
  orcamentos: { id: string; slug: string; status: string; clienteNome: string }[];
};

function BuscaGlobal() {
  const pathname = usePathname();
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  function abrir() {
    focoAnterior.current = document.activeElement as HTMLElement | null;
    setAberto(true);
  }
  function fechar(retornarFoco = false) {
    setAberto(false);
    if (retornarFoco) (focoAnterior.current || botaoRef.current)?.focus();
  }

  useEffect(() => {
    setAberto(false);
    setTermo("");
    setResultado(null);
  }, [pathname]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !document.querySelector('[aria-modal="true"]')) {
        e.preventDefault();
        if (aberto) inputRef.current?.focus();
        else abrir();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    if (!painel) return;
    const nativo = typeof painel.showPopover === "function";
    const aoAlternar = () => {
      if (nativo && !painel.matches(":popover-open")) setAberto(false);
    };
    function aoClicarFora(e: PointerEvent) {
      if (!painel?.contains(e.target as Node) && !botaoRef.current?.contains(e.target as Node)) setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setAberto(false);
        (focoAnterior.current || botaoRef.current)?.focus();
      }
    }
    painel.addEventListener("toggle", aoAlternar);
    if (nativo) painel.showPopover();
    inputRef.current?.focus();
    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      painel.removeEventListener("toggle", aoAlternar);
      if (nativo && painel.matches(":popover-open")) painel.hidePopover();
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar, true);
    };
  }, [aberto]);

  useEffect(() => {
    const termoLimpo = termo.trim();
    setResultado(null);
    setErro(null);
    if (!aberto || termoLimpo.length < 2) {
      setBuscando(false);
      return;
    }
    const controller = new AbortController();
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(termoLimpo)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("busca");
        const dados: ResultadoBusca = await res.json();
        if (!controller.signal.aborted) setResultado(dados);
      } catch {
        if (!controller.signal.aborted) setErro("Não foi possível buscar. Tente novamente em instantes.");
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [termo, aberto]);

  const total = resultado ? resultado.clientes.length + resultado.orcamentos.length : 0;
  // React 18 encaminha o atributo HTML; browsers antigos usam o painel via portal.
  const popover = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype ? { popover: "auto" as const } : {};

  return (
    <>
      <button ref={botaoRef} type="button" aria-label="Buscar clientes e orçamentos" title="Buscar clientes e orçamentos (⌘ K / Ctrl K)" aria-haspopup="dialog" aria-expanded={aberto} aria-controls={aberto ? "busca-global" : undefined} aria-keyshortcuts="Meta+K Control+K" onClick={() => aberto ? fechar(true) : abrir()} className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-3 rounded-lg text-muted transition-colors hover:bg-hover hover:text-text 2xl:min-w-64 2xl:justify-start 2xl:border 2xl:border-border 2xl:px-3">
        <Search size={18} aria-hidden="true" />
        <span className="hidden text-sm 2xl:inline">Buscar cliente, orçamento…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-sans text-[11px] 2xl:inline">⌘ K</kbd>
      </button>
      {aberto && createPortal(
        <div ref={painelRef} id="busca-global" role="dialog" aria-labelledby="titulo-busca-global" {...popover} className="fixed inset-x-4 bottom-auto top-36 z-50 m-0 max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-4 text-text shadow-premium-lg lg:left-auto lg:right-6 lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-[28rem]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="titulo-busca-global" className="text-sm font-semibold">Buscar clientes e orçamentos</h2>
            <button type="button" aria-label="Fechar busca" onClick={() => fechar(true)} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"><X size={18} aria-hidden="true" /></button>
          </div>
          <label htmlFor="campo-busca-global" className="sr-only">Nome do cliente ou orçamento</label>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-inset px-3 focus-within:border-accent-text">
            <Search size={16} aria-hidden="true" className="shrink-0 text-muted" />
            <input ref={inputRef} id="campo-busca-global" name="busca" type="search" autoComplete="off" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Digite um nome…" className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-muted" />
            {termo && <button type="button" aria-label="Limpar busca" onClick={() => { setTermo(""); inputRef.current?.focus(); }} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"><X size={16} aria-hidden="true" /></button>}
          </div>
          <p role="status" aria-live="polite" className={`py-3 text-xs ${erro ? "text-accent-text" : "text-muted"}`}>
            {erro || (termo.trim().length < 2 ? "Digite pelo menos 2 caracteres." : buscando ? "Buscando…" : resultado ? total ? `${total} resultado${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}.` : "Nenhum cliente ou orçamento encontrado." : "")}
          </p>
          {resultado && total > 0 && <div className="flex flex-col gap-1">
            {resultado.clientes.map((c) => <Link key={c.id} href={`/dashboard/clientes/${c.id}`} onClick={() => fechar()} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-hover"><Users size={16} aria-hidden="true" className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate">{c.nome}</span><span className="text-xs text-muted">Cliente</span></Link>)}
            {resultado.orcamentos.map((o) => <a key={o.id} href={`/orcamento/${o.slug}`} target="_blank" rel="noopener noreferrer" onClick={() => fechar()} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-hover"><FileText size={16} aria-hidden="true" className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate">{o.clienteNome}</span><span className="text-xs text-muted">Orçamento <span className="sr-only">(abre em nova aba)</span></span></a>)}
          </div>}
        </div>, document.querySelector(".tema-painel") || document.body
      )}
    </>
  );
}

export function Header({ nomePrimeiro, clientes }: { nomePrimeiro: string; clientes: Cliente[] }) {
  const pathname = usePathname() || "/dashboard";
  const partes = pathname.split("/").filter(Boolean).slice(1);
  const trilha = partes.map((parte, index) => {
    const cliente = partes[0] === "clientes" && index === 1
      ? clientes.find((item) => item.id === parte) : undefined;
    const ehRegistro = (index === 1 && ["clientes", "horas", "servicos", "pacotes", "orcamentos"].includes(partes[0]) && parte !== "novo")
      || (index === 2 && partes[0] === "financeiro" && partes[1] === "cobrancas");
    return {
      href: `/dashboard/${partes.slice(0, index + 1).join("/")}`,
      label: ehRegistro ? cliente?.nome || "Detalhes" : rotulos[parte] || "Detalhes",
      navegavel: (index === 0 && secoesComPagina.has(parte)) || Boolean(cliente),
    };
  });
  const [temNovidadeNaoVista, setTemNovidadeNaoVista] = useState(false);
  const [textoSaudacao, setTextoSaudacao] = useState("Olá");
  useEffect(() => {
    const atualizar = () => setTextoSaudacao(saudacao());
    atualizar();
    const intervalo = setInterval(atualizar, 60_000);
    document.addEventListener("visibilitychange", atualizar);
    return () => { clearInterval(intervalo); document.removeEventListener("visibilitychange", atualizar); };
  }, []);
  useEffect(() => {
    try {
      const vista = Number(localStorage.getItem(CHAVE_NOVIDADES_VISTAS) || "0");
      setTemNovidadeNaoVista(vista < ULTIMA_VERSAO_NOVIDADES);
    } catch {}
  }, []);

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b border-border bg-base px-4 py-3 md:px-6 lg:flex lg:gap-5 print:hidden">
      <div className="min-w-0 pl-12 md:pl-0 lg:flex-1">
        <nav aria-label="Caminho da página">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-text">
            <li className={trilha.length ? "hidden shrink-0 xl:block" : "min-w-0 truncate"}>{trilha.length ? <Link href="/dashboard" className="rounded hover:text-accent-text">Início</Link> : <span aria-current="page">Visão geral</span>}</li>
            {trilha.map((item, index) => <li key={item.href} className={`min-w-0 items-center gap-1.5 ${index < trilha.length - 1 ? "hidden xl:flex" : "flex"}`}>
              <ChevronRight size={12} aria-hidden="true" className="hidden shrink-0 text-muted xl:block" />
              {index === trilha.length - 1 ? <span aria-current="page" className="truncate">{item.label}</span> : item.navegavel ? <Link href={item.href} className="truncate rounded text-muted hover:text-text">{item.label}</Link> : <span className="truncate text-muted">{item.label}</span>}
            </li>)}
          </ol>
        </nav>
        <p className="mt-1 truncate text-xs text-muted">{textoSaudacao}, {nomePrimeiro}</p>
      </div>
      <BuscaGlobal />
      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-3 lg:justify-end lg:gap-5">
        <RelogioTopbar />
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Link href="/dashboard/novidades" title="Novidades" aria-label={temNovidadeNaoVista ? "Novidades, há atualizações não vistas" : "Novidades"} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-text">
            <Sparkles size={18} aria-hidden="true" />
            {temNovidadeNaoVista && <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent" />}
          </Link>
          <SinoNotificacoes />
          <NovaTarefaTopbar clientes={clientes} />
        </div>
      </div>
    </header>
  );
}
