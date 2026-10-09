"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ListChecks, ChevronDown } from "lucide-react";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { PRESETS_CHECKLIST } from "@/lib/presetsChecklist";
import { DatePicker } from "@/components/ui/DatePicker";

type Cliente = { id: string; nome: string; cor: string | null };
export type ResultadoNovaTarefa = { id: string; tipo: "ideia" | "tarefa"; prazo: string | null; clienteId: string | null };
const campo = "min-h-11 w-full rounded-xl border border-border bg-base/60 px-3 text-base sm:text-sm text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40";
const acao = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40";

export function NovaTarefaGlobalForm({
  clientes, categoriaFixa, placeholder, textoBotao, clienteInicial = "",
  prazoInicial = "", postagemInicial = "", abertoInicial = false,
  tipoInicial = "tarefa", clienteFixo, aoConcluir, aoCancelar,
}: {
  clientes: Cliente[];
  categoriaFixa?: string;
  placeholder?: string;
  textoBotao?: string;
  clienteInicial?: string;
  prazoInicial?: string;
  postagemInicial?: string;
  abertoInicial?: boolean;
  tipoInicial?: "ideia" | "tarefa";
  clienteFixo?: string;
  aoConcluir?: (resultado?: ResultadoNovaTarefa) => void;
  aoCancelar?: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const [aberto, setAberto] = useState(abertoInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState(clienteFixo || clienteInicial);
  const [categoria, setCategoria] = useState(categoriaFixa || "");
  const [prazo, setPrazo] = useState(prazoInicial);
  const [hora, setHora] = useState("");
  const [postagem, setPostagem] = useState(postagemInicial);
  const [horaPostagem, setHoraPostagem] = useState("");
  const [observacao, setObservacao] = useState("");
  const [checklistItens, setChecklistItens] = useState<string[]>([]);
  const [novoItemChecklist, setNovoItemChecklist] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function limpar() {
    setTitulo(""); setClienteId(clienteFixo || clienteInicial); setTipo(tipoInicial);
    setCategoria(categoriaFixa || ""); setPrazo(prazoInicial); setHora("");
    setPostagem(postagemInicial); setHoraPostagem(""); setObservacao("");
    setChecklistItens([]); setNovoItemChecklist(""); setErro("");
  }

  function adicionarItemChecklist() {
    if (!novoItemChecklist.trim()) return;
    setChecklistItens((prev) => [...prev, novoItemChecklist.trim()]);
    setNovoItemChecklist("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || enviando) return;
    setEnviando(true); setErro("");
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(), tipo, clienteId: clienteFixo || clienteId || null,
          categoria: categoriaFixa || categoria || null,
          descricao: observacao || null,
          prazo: prazo ? `${prazo}T${hora || "00:00"}:00-03:00` : null,
          publicacaoSugeridaEm: clienteId && postagem ? `${postagem}T${horaPostagem || "00:00"}:00-03:00` : null,
          checklistItens: checklistItens.length ? checklistItens : undefined,
        }),
      });
      const resposta = await res.json().catch(() => null);
      if (!res.ok) { setErro(resposta?.erro || "Não consegui salvar. Tente novamente."); return; }
      const resultado: ResultadoNovaTarefa = {
        id: typeof resposta?.id === "string" ? resposta.id : "",
        tipo,
        prazo: prazo ? `${prazo}T${hora || "00:00"}:00-03:00` : null,
        clienteId: clienteFixo || clienteId || null,
      };
      limpar(); setAberto(false); aoConcluir?.(resultado); router.refresh();
    } catch { setErro("Não consegui salvar. Confira a conexão e tente novamente."); }
    finally { setEnviando(false); }
  }

  if (!aberto) return (
    <button type="button" onClick={() => setAberto(true)} className={`${acao} mb-5 w-full border border-dashed border-border bg-card/40 text-text hover:border-accent/50 hover:bg-hover`}>
      <Plus size={16} /> {textoBotao || (tipoInicial === "ideia" ? "Adicionar ao planejamento" : "Nova tarefa de produção")}
    </button>
  );

  return (
    <form onSubmit={salvar} className="mb-6 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-medium text-text">{tipo === "ideia" ? "Novo conteúdo no planejamento" : "Nova tarefa de produção"}</h2>
        <button type="button" aria-label="Cancelar cadastro" disabled={enviando} onClick={() => { limpar(); setAberto(false); aoCancelar?.(); }} className={`${acao} shrink-0 text-muted hover:bg-hover hover:text-text`}><X size={18} /></button>
      </div>
      <fieldset disabled={enviando} className="space-y-4 disabled:opacity-60">
        {!categoriaFixa && <div>
          <p id={`${id}-tipo`} className="mb-2 text-sm font-medium text-text">Onde você quer guardar?</p>
          <div role="group" aria-labelledby={`${id}-tipo`} className="flex flex-wrap gap-2">
            {([{ valor: "ideia", label: "Planejamento" }, { valor: "tarefa", label: "Produção" }] as const).map(opcao => <button key={opcao.valor} type="button" aria-pressed={tipo === opcao.valor} onClick={() => setTipo(opcao.valor)} className={`${acao} border ${tipo === opcao.valor ? "border-accent/50 bg-accent/10 text-text" : "border-border text-muted hover:bg-hover hover:text-text"}`}>{opcao.label}</button>)}
          </div>
          <p className="mt-2 max-w-prose text-xs text-muted">{tipo === "ideia" ? "Guarde a ideia e organize a postagem. Ela entra na fila de trabalho quando você colocar em produção." : "Trabalho que já precisa ser feito. Você pode definir um prazo de entrega."}</p>
        </div>}
        <label className="block text-sm text-text" htmlFor={`${id}-titulo`}>Título
          <input id={`${id}-titulo`} autoFocus required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={placeholder || (tipo === "ideia" ? "Qual é a ideia do conteúdo?" : "O que precisa ser feito?")} className={`${campo} mt-1.5`} />
        </label>
        <div className={`grid gap-3 ${categoriaFixa ? "" : "sm:grid-cols-2"}`}>
          <label className="block text-sm text-text" htmlFor={`${id}-cliente`}>Cliente
            <select id={`${id}-cliente`} value={clienteFixo || clienteId} disabled={!!clienteFixo} onChange={e => setClienteId(e.target.value)} className={`${campo} mt-1.5`}>{!clienteFixo && <option value="">Sem cliente</option>}{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </label>
          {!categoriaFixa && <label className="block text-sm text-text" htmlFor={`${id}-categoria`}>Formato ou atividade
            <select id={`${id}-categoria`} value={categoria} onChange={e => setCategoria(e.target.value)} className={`${campo} mt-1.5`}><option value="">Escolher depois</option>{CATEGORIAS_TAREFA.filter(c => c.valor !== "ideia").map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}</select>
          </label>}
        </div>
        {tipo === "tarefa" && <div>
          <p className="mb-1.5 text-sm text-text">Prazo de produção <span className="text-muted">(opcional)</span></p>
          <DatePicker className="[&>button]:min-h-11 [&>button]:focus-visible:outline [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&_span]:!text-muted" value={prazo} onChange={setPrazo} placeholder="Dia em que precisa estar pronto" limpavel />
          <p className="mt-1.5 text-xs text-muted">É a entrega do trabalho; o dia de postagem é separado.</p>
        </div>}
        {clienteId && <div>
          <p className="mb-1.5 text-sm text-text">Dia planejado de postagem <span className="text-muted">(opcional)</span></p>
          <DatePicker className="[&>button]:min-h-11 [&>button]:focus-visible:outline [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&_span]:!text-muted" value={postagem} onChange={setPostagem} placeholder="Escolher dia de postagem" limpavel />
          <p className="mt-1.5 text-xs text-muted">Escolha só o dia. Isso não publica nem agenda automaticamente.</p>
        </div>}
        <label className="block text-sm text-text" htmlFor={`${id}-descricao`}>{tipo === "ideia" ? "Ideia ou roteiro" : "Descrição"} <span className="text-muted">(opcional)</span>
          <textarea id={`${id}-descricao`} value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} placeholder="Anote o que vai ajudar na produção" className={`${campo} mt-1.5 py-3`} />
        </label>
        <details className="border-t border-border pt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Mais opções <ChevronDown size={16} /></summary>
          <div className="space-y-4 pt-3">
            {tipo === "ideia" && <div><p className="mb-1.5 text-sm text-text">Prazo de produção (opcional)</p><DatePicker className="[&>button]:min-h-11 [&>button]:focus-visible:outline [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&_span]:!text-muted" value={prazo} onChange={setPrazo} placeholder="Escolher prazo" limpavel /></div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor={`${id}-hora`} className="text-sm text-text">Horário do prazo (opcional)<input id={`${id}-hora`} type="time" value={hora} onChange={e => setHora(e.target.value)} disabled={!prazo} className={`${campo} mt-1.5`} /></label>
              {clienteId && <label htmlFor={`${id}-hora-postagem`} className="text-sm text-text">Horário da postagem (opcional)<input id={`${id}-hora-postagem`} type="time" value={horaPostagem} onChange={e => setHoraPostagem(e.target.value)} disabled={!postagem} className={`${campo} mt-1.5`} /></label>}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-text"><ListChecks size={16} /> Checklist inicial (opcional)</p>
              <div className="mb-2 flex flex-wrap gap-2">{PRESETS_CHECKLIST.map(preset => <button key={preset.nome} type="button" onClick={() => setChecklistItens(preset.itens)} className={`${acao} border border-border text-muted hover:bg-hover hover:text-text`}>{preset.nome}</button>)}{checklistItens.length > 0 && <button type="button" onClick={() => setChecklistItens([])} className={`${acao} text-muted hover:text-text`}>Limpar checklist</button>}</div>
              {checklistItens.length > 0 && <ul className="mb-3 divide-y divide-border">{checklistItens.map((item, i) => <li key={`${i}-${item}`} className="flex items-center gap-2 py-1"><span className="min-w-0 flex-1 break-words text-sm text-text">{item}</span><button type="button" aria-label={`Remover passo: ${item}`} onClick={() => setChecklistItens(prev => prev.filter((_, index) => index !== i))} className={`${acao} shrink-0 text-muted hover:text-text`}><X size={16} /></button></li>)}</ul>}
              <div className="flex gap-2"><input aria-label="Novo passo do checklist" value={novoItemChecklist} onChange={e => setNovoItemChecklist(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarItemChecklist(); } }} placeholder="Digite um passo" className={`${campo} min-w-0 flex-1`} /><button type="button" onClick={adicionarItemChecklist} className={`${acao} border border-border text-text hover:bg-hover`}><Plus size={16} /> Adicionar</button></div>
            </div>
          </div>
        </details>
        <button type="submit" disabled={enviando || !titulo.trim()} className={`${acao} w-full bg-accent font-semibold text-white hover:bg-accent/90`}>{enviando ? "Salvando..." : tipo === "ideia" ? "Salvar no planejamento" : "Criar tarefa de produção"}</button>
      </fieldset>
      {erro && <p role="alert" className="mt-3 text-sm text-red-400">{erro}</p>}
    </form>
  );
}
