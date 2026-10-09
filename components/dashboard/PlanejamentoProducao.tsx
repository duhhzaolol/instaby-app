"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight, ChevronDown, LayoutList, Columns3, Search, ArrowRight, X } from "lucide-react";
import QuadroTarefas, { type TarefaQuadro } from "@/components/dashboard/QuadroTarefas";
import { NovaTarefaGlobalForm, type ResultadoNovaTarefa } from "@/components/dashboard/NovaTarefaGlobalForm";
import { FiltroClienteAgenda, type ClienteAgenda } from "@/components/dashboard/FiltroClienteAgenda";
import { DatePicker } from "@/components/ui/DatePicker";
import { abrirDetalheTarefa } from "@/lib/abrirDetalheTarefa";
import { diaTrabalho, ehPlanejamento, filtrarTrabalho, tarefaAtrasada } from "@/lib/organizacaoTarefas";

export type TarefaTrabalho = TarefaQuadro & {
  tipo: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  publicacaoSugeridaEm: string | null;
  statusConteudo: string | null;
  publicadoEm: string | null;
  concluidaEm: string | null;
};

type Periodo = "semana" | "proximas" | "sem_prazo" | "todas" | "concluidas";
type Pessoa = { id: string; nome: string };
const periodos: { valor: Periodo; label: string }[] = [
  { valor: "semana", label: "Esta semana e atrasadas" },
  { valor: "proximas", label: "Próximas semanas" },
  { valor: "sem_prazo", label: "Sem prazo" },
  { valor: "todas", label: "Toda a produção" },
  { valor: "concluidas", label: "Concluídas" },
];
const avisos: Record<string, string> = { atrasadas: "Produção atrasada", sem_responsavel: "Produção sem responsável", postagens_pendentes: "Postagens pendentes" };
const status: Record<string, string> = { a_fazer: "A fazer", em_andamento: "Em andamento", bloqueada: "Bloqueada", feito: "Concluída" };
const botao = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40";
const campo = "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base sm:text-sm text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function dataCurta(valor?: string | null) {
  const dia = diaTrabalho(valor);
  return dia ? `${dia.slice(8, 10)}/${dia.slice(5, 7)}` : "";
}

export default function PlanejamentoProducao({ tarefas, clientes, clienteFixo }: { tarefas: TarefaTrabalho[]; clientes: ClienteAgenda[]; clienteFixo?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = useId();
  const area = params.get("area") === "planejamento" ? "planejamento" : "producao";
  const clienteAtual = clienteFixo || params.get("cliente") || "";
  const filtro = avisos[params.get("filtro") || ""] ? params.get("filtro")! : "";
  const periodoPedido = params.get("periodo") as Periodo;
  const periodo = periodos.some(p => p.valor === periodoPedido) ? periodoPedido : "semana";
  const kanban = params.get("modo") === "kanban";
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState(tarefas);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [promovendo, setPromovendo] = useState<TarefaTrabalho | null>(null);
  const [prazo, setPrazo] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregandoPessoas, setCarregandoPessoas] = useState(false);
  const [erroPessoas, setErroPessoas] = useState("");

  useEffect(() => setItens(tarefas), [tarefas]);
  useEffect(() => {
    if (!promovendo) return;
    if (pessoas.length) { setCarregandoPessoas(false); return; }
    let cancelado = false;
    setCarregandoPessoas(true); setErroPessoas("");
    fetch("/api/usuarios", { cache: "no-store" }).then(async res => {
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error();
      if (!cancelado) setPessoas(data.map((p: Pessoa) => ({ id: p.id, nome: p.nome })));
    }).catch(() => { if (!cancelado) setErroPessoas("Não consegui carregar a equipe. Você pode atribuir a tarefa depois."); })
      .finally(() => { if (!cancelado) setCarregandoPessoas(false); });
    return () => { cancelado = true; };
  }, [promovendo, pessoas.length]);

  function navegar(alteracoes: Record<string, string | null>) {
    const proximo = new URLSearchParams(window.location.search);
    for (const [chave, valor] of Object.entries(alteracoes)) valor ? proximo.set(chave, valor) : proximo.delete(chave);
    proximo.delete("tarefa");
    window.history.pushState(null, "", `${pathname}${proximo.size ? `?${proximo}` : ""}`);
    setPromovendo(null); setErro(""); setAviso("");
  }

  const visiveis = useMemo(() => {
    const agora = new Date();
    let lista = itens.filter(t => !clienteAtual || t.clienteId === clienteAtual);
    if (filtro) lista = filtrarTrabalho(lista, filtro, agora);
    else if (area === "planejamento") lista = lista.filter(t => ehPlanejamento(t) && t.status !== "feito");
    else {
      lista = filtrarTrabalho(lista, periodo === "semana" ? "semana" : "todas", agora);
      if (periodo === "concluidas") lista = lista.filter(t => t.status === "feito");
      else {
        lista = lista.filter(t => t.status !== "feito");
        if (periodo === "sem_prazo") lista = lista.filter(t => !diaTrabalho(t.prazo));
        if (periodo === "proximas") {
          const depois = new Date(agora.getTime() + 7 * 86400000);
          const limite = diaTrabalho(depois, false);
          lista = lista.filter(t => diaTrabalho(t.prazo) >= limite);
        }
      }
    }
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (termo) lista = lista.filter(t => `${t.titulo} ${t.clienteNome || ""} ${t.responsavelNome || ""}`.toLocaleLowerCase("pt-BR").includes(termo));
    return [...lista].sort((a, b) => {
      if (periodo === "concluidas" && !filtro && area === "producao") return (b.concluidaEm || "").localeCompare(a.concluidaEm || "");
      const da = diaTrabalho(area === "planejamento" || filtro === "postagens_pendentes" ? a.publicacaoSugeridaEm : a.prazo) || "9999";
      const db = diaTrabalho(area === "planejamento" || filtro === "postagens_pendentes" ? b.publicacaoSugeridaEm : b.prazo) || "9999";
      return da.localeCompare(db) || a.titulo.localeCompare(b.titulo, "pt-BR");
    });
  }, [itens, clienteAtual, filtro, area, periodo, busca]);

  const grupos = useMemo(() => {
    if (area !== "planejamento" || filtro) return [{ id: "producao", nome: "", tarefas: visiveis }];
    const mapa = new Map<string, { id: string; nome: string; tarefas: TarefaTrabalho[] }>();
    for (const t of visiveis) {
      const chave = t.clienteId || "sem-cliente";
      if (!mapa.has(chave)) mapa.set(chave, { id: chave, nome: t.clienteNome || "Sem cliente", tarefas: [] });
      mapa.get(chave)!.tarefas.push(t);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [area, filtro, visiveis]);

  async function alterarTipo(tarefa: TarefaTrabalho, tipo: "ideia" | "tarefa") {
    if (ocupado) return;
    setOcupado(tarefa.id); setErro(""); setAviso("");
    try {
      const body: Record<string, unknown> = { tipo };
      if (tipo === "tarefa") {
        if (prazo && prazo !== diaTrabalho(tarefa.prazo)) body.prazo = `${prazo}T00:00:00-03:00`;
        if (responsavelId) body.responsavelId = responsavelId;
      }
      const res = await fetch(`/api/tarefas/${tarefa.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setErro(data?.erro || "Não consegui mover este conteúdo. Tente novamente."); return; }
      setItens(prev => prev.map(t => t.id === tarefa.id ? {
        ...t, tipo,
        ...(body.prazo ? { prazo: body.prazo as string } : {}),
        ...(tipo === "tarefa" && responsavelId ? { responsavelId, responsavelNome: pessoas.find(p => p.id === responsavelId)?.nome || t.responsavelNome } : {}),
      } : t));
      setPromovendo(null);
      setAviso(tipo === "tarefa" ? "Conteúdo colocado em produção. O roteiro, os arquivos e o dia de postagem foram mantidos." : "Conteúdo movido para o planejamento. As informações e as datas foram mantidas.");
      router.refresh();
    } catch { setErro("Não consegui salvar a mudança. Confira a conexão e tente novamente."); }
    finally { setOcupado(null); }
  }

  function abrirPromocao(tarefa: TarefaTrabalho) {
    setPromovendo(tarefa); setPrazo(diaTrabalho(tarefa.prazo));
    setResponsavelId(tarefa.responsavelId || ""); setErro(""); setAviso("");
  }

  function mostrarConteudoCriado(resultado?: ResultadoNovaTarefa) {
    if (!resultado) return;
    navegar({
      area: resultado.tipo === "ideia" ? "planejamento" : "producao",
      periodo: resultado.tipo === "tarefa" ? resultado.prazo ? "todas" : "sem_prazo" : null,
      filtro: null,
      modo: null,
      ...(!clienteFixo ? { cliente: resultado.clienteId } : {}),
    });
    setBusca("");
    setAviso(resultado.tipo === "ideia" ? "Conteúdo salvo no planejamento." : resultado.prazo ? "Tarefa criada. Ela aparece na lista de produção abaixo." : "Tarefa criada. Ela aparece em Produção → Sem prazo até você definir a entrega.");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text">Planejamento e produção</h1>
          <p className="mt-1 max-w-prose text-sm text-muted">Ideias e cronogramas separados do trabalho que precisa ser feito.</p>
        </div>
        <Link href={`/dashboard/agenda${clienteAtual ? `?cliente=${encodeURIComponent(clienteAtual)}` : ""}`} className={`${botao} border border-border text-text hover:bg-hover`}><CalendarDays size={17} /> Abrir Agenda</Link>
      </div>
      <nav aria-label="Organização do trabalho" className="mb-5 flex flex-wrap gap-1 border-b border-border">
        {([{ valor: "producao", label: "Produção" }, { valor: "planejamento", label: "Planejamento" }] as const).map(opcao => <button key={opcao.valor} type="button" aria-current={area === opcao.valor ? "page" : undefined} onClick={() => navegar({ area: opcao.valor, filtro: null })} className={`${botao} rounded-b-none border-b-2 ${area === opcao.valor ? "border-accent text-text" : "border-transparent text-muted hover:bg-hover hover:text-text"}`}>{opcao.label}</button>)}
      </nav>
      <p className="mb-5 max-w-prose text-sm text-muted">{filtro ? "Esta lista reúne os itens do aviso, mesmo quando estão fora desta semana." : area === "planejamento" ? "Monte o cronograma de cada cliente. Quando decidir começar um conteúdo, coloque-o em produção." : "Comece pelo trabalho da semana. As tarefas atrasadas continuam à vista até serem resolvidas."}</p>
      <NovaTarefaGlobalForm key={`${area}-${clienteAtual}`} clientes={clientes} tipoInicial={area === "planejamento" ? "ideia" : "tarefa"} clienteInicial={clienteAtual} clienteFixo={clienteFixo} aoConcluir={mostrarConteudoCriado} />
      <div className="mb-3 flex flex-wrap items-end gap-3">
        {!clienteFixo && <div className="w-full sm:w-auto"><p className="mb-1.5 text-xs text-muted">Cliente</p><FiltroClienteAgenda clientes={clientes} clienteAtual={clienteAtual} /></div>}
        {area === "producao" && !filtro && <label className="w-full text-xs text-muted sm:w-60" htmlFor={`${id}-periodo`}>Mostrar<select id={`${id}-periodo`} value={periodo} onChange={e => navegar({ periodo: e.target.value })} className={`${campo} mt-1.5`}>{periodos.map(p => <option key={p.valor} value={p.valor}>{p.label}</option>)}</select></label>}
      </div>
      <details className="mb-4 border-b border-border pb-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><span>Buscar e visualização{busca ? " · busca ativa" : kanban && area === "producao" && !filtro ? " · Kanban" : ""}</span><ChevronDown size={16} /></summary>
        <div className="flex flex-wrap items-end gap-3 pb-2 pt-3">
        <label className="relative w-full min-w-0 basis-full text-xs text-muted sm:w-auto sm:flex-1 sm:basis-48" htmlFor={`${id}-busca`}>Buscar<span className="relative mt-1.5 block"><Search size={16} className="absolute left-3 top-3.5 text-muted" /><input id={`${id}-busca`} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Título, cliente ou responsável" className={`${campo} pl-9`} /></span></label>
        {area === "producao" && !filtro && <div aria-label="Visualização da produção" role="group" className="flex gap-1 rounded-xl border border-border p-1"><button type="button" aria-pressed={!kanban} onClick={() => navegar({ modo: null })} className={`${botao} ${!kanban ? "bg-hover text-text" : "text-muted hover:text-text"}`}><LayoutList size={16} /> Lista</button><button type="button" aria-pressed={kanban} onClick={() => navegar({ modo: "kanban" })} className={`${botao} ${kanban ? "bg-hover text-text" : "text-muted hover:text-text"}`}><Columns3 size={16} /> Kanban</button></div>}
        </div>
      </details>
      {filtro && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2"><h2 className="font-medium text-text">{avisos[filtro]}</h2><button type="button" onClick={() => navegar({ filtro: null })} className={`${botao} text-muted hover:bg-hover hover:text-text`}><X size={16} /> Limpar aviso</button></div>}
      {erro && <p role="alert" className="mb-4 text-sm text-red-400">{erro}</p>}
      {aviso && <p role="status" className="mb-4 max-w-prose text-sm text-text">{aviso}</p>}
      <p className="mb-3 text-xs text-muted">{visiveis.length} {visiveis.length === 1 ? "item" : "itens"}{area === "planejamento" && !filtro ? " no planejamento" : " nesta lista"}</p>
      {!visiveis.length ? <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center"><p className="font-medium text-text">{busca ? "Nenhum conteúdo encontrado" : area === "planejamento" && !filtro ? "Seu planejamento começa aqui" : "Nenhuma tarefa neste filtro"}</p><p className="mx-auto mt-2 max-w-prose text-sm text-muted">{busca ? "Tente outro título ou nome de cliente." : area === "planejamento" && !filtro ? "Adicione uma ideia ou mova um conteúdo que ainda não começou para o planejamento." : "Você pode escolher outro período ou consultar todos os clientes."}</p></div>
        : area === "producao" && kanban && !filtro ? <QuadroTarefas tarefas={visiveis} titulo="Produção" subtitulo="Arraste para mudar o status" linkVerTudo={null} />
          : <div className="space-y-6">{grupos.map(grupo => <section key={grupo.id} aria-label={grupo.nome || avisos[filtro] || "Lista de produção"}>
            {grupo.nome && <h2 className="mb-2 break-words text-base font-medium text-text">{grupo.nome} <span className="ml-1 text-sm font-normal text-muted">{grupo.tarefas.length}</span></h2>}
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40 px-4">{grupo.tarefas.map(tarefa => {
              const planejada = ehPlanejamento(tarefa);
              const atrasada = tarefaAtrasada(tarefa);
              return <li key={tarefa.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button type="button" onClick={() => abrirDetalheTarefa(tarefa.id)} className="min-h-11 min-w-0 basis-full rounded-lg py-1 text-left sm:flex-1 sm:basis-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className="flex items-start gap-2"><span className="min-w-0 flex-1 break-words text-sm font-medium text-text">{tarefa.titulo}</span><ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" /></span>
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">{!grupo.nome && <span>{tarefa.clienteNome || "Sem cliente"}</span>}<span>{planejada ? "Planejamento" : status[tarefa.status] || tarefa.status}</span>{!planejada && <span className={atrasada ? "text-red-400" : undefined}>{tarefa.prazo ? `${atrasada ? "Atrasada · " : "Prazo "}${dataCurta(tarefa.prazo)}` : "Sem prazo de produção"}</span>}{tarefa.publicacaoSugeridaEm && <span>Postagem {dataCurta(tarefa.publicacaoSugeridaEm)}</span>}{!planejada && <span>{tarefa.responsavelNome || "Sem responsável"}</span>}</span>
                  </button>
                  {planejada ? <button type="button" onClick={() => abrirPromocao(tarefa)} disabled={!!ocupado} className={`${botao} text-text hover:bg-hover`}>Colocar em produção <ArrowRight size={15} /></button>
                    : tarefa.status === "a_fazer" && <button type="button" onClick={() => alterarTipo(tarefa, "ideia")} disabled={!!ocupado} className={`${botao} text-muted hover:bg-hover hover:text-text`}>{ocupado === tarefa.id ? "Movendo..." : "Mover para planejamento"}</button>}
                </div>
                {promovendo?.id === tarefa.id && <form onSubmit={e => { e.preventDefault(); alterarTipo(tarefa, "tarefa"); }} className="mt-3 border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-text">Colocar este conteúdo em produção</h3><p className="mt-1 max-w-prose text-xs text-muted">Defina o que souber agora. O dia de postagem, o roteiro e os arquivos serão mantidos.</p>
                  <fieldset disabled={!!ocupado} className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="mb-1.5 text-sm text-text">Prazo de produção (opcional)</p><DatePicker className="[&>button]:min-h-11 [&>button]:focus-visible:outline [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&_span]:!text-muted" value={prazo} onChange={setPrazo} placeholder="Escolher dia de entrega" limpavel /></div><label className="text-sm text-text" htmlFor={`${id}-responsavel`}>Responsável (opcional)<select id={`${id}-responsavel`} value={responsavelId} onChange={e => setResponsavelId(e.target.value)} disabled={carregandoPessoas} className={`${campo} mt-1.5 disabled:opacity-50`}><option value="">{carregandoPessoas ? "Carregando equipe..." : tarefa.responsavelId ? "Manter responsável atual" : "Atribuir depois"}</option>{pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label></fieldset>
                  {erroPessoas && <p role="status" className="mt-2 text-xs text-muted">{erroPessoas}</p>}
                  <div className="mt-3 flex flex-wrap gap-2"><button type="submit" disabled={!!ocupado} className={`${botao} bg-accent text-white hover:bg-accent/90`}>{ocupado === tarefa.id ? "Salvando..." : "Confirmar produção"}</button><button type="button" disabled={!!ocupado} onClick={() => setPromovendo(null)} className={`${botao} text-muted hover:bg-hover hover:text-text`}>Cancelar</button></div>
                </form>}
              </li>;
            })}</ul>
          </section>)}</div>}
    </div>
  );
}
