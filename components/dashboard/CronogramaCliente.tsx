"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Copy, Eye, MessageCircle, Share2 } from "lucide-react";
import { dataPauta, formatoDaPauta, nomeMesCronograma, sugestaoRoteiro, tituloDaPauta, type FormatoPauta, type PautaPublica } from "@/lib/cronogramaApresentacao";
import { PautasCronograma } from "@/components/cronograma/PautasCronograma";

type Tarefa = { id: string; titulo: string; categoria: string | null; descricao: string | null; dataPrevista: string };
type PautaSalva = PautaPublica & { tarefaId: string | null; visivel: boolean };
type Cronograma = { id: string; token: string; ativo: boolean; mes: string; pautas: PautaSalva[] };
type Rascunho = { tarefaId: string; titulo: string; formato: FormatoPauta; dataPrevista: string; textoCliente: string; selecionada: boolean };
const campo = "w-full rounded-xl border border-border bg-base px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40";
const botao = "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-text hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed";

async function resposta<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || "Não foi possível concluir. Tente novamente.");
  return json;
}

export function CronogramaCliente({ clienteId, clienteNome, mesInicial }: { clienteId: string; clienteNome: string; mesInicial: string }) {
  const [mes, setMes] = useState(mesInicial);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [origem, setOrigem] = useState("");
  const carga = useRef(0);
  const endpoint = `/api/clientes/${clienteId}/cronograma`;

  useEffect(() => { setOrigem(window.location.origin); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const versao = ++carga.current;
    setCarregando(true); setErro(""); setAviso(""); setPrevia(false);
    fetch(`${endpoint}?mes=${mes}`, { cache: "no-store", signal: controller.signal })
      .then(resposta<{ tarefas: Tarefa[]; cronograma: Cronograma | null }>)
      .then((dados) => {
        if (versao !== carga.current) return;
        setTarefas(dados.tarefas); setCronograma(dados.cronograma);
        setRascunhos(dados.tarefas.map((t) => {
          const salva = dados.cronograma?.pautas.find((p) => p.tarefaId === t.id);
          return { tarefaId: t.id, titulo: salva?.titulo ?? tituloDaPauta(t.titulo), formato: (salva?.formato as FormatoPauta) ?? formatoDaPauta(t.titulo, t.categoria), dataPrevista: t.dataPrevista.slice(0, 10), textoCliente: salva?.textoCliente ?? sugestaoRoteiro(t.descricao), selecionada: salva?.visivel ?? false };
        }));
        setAlterado(false);
      })
      .catch((e: Error) => { if (e.name !== "AbortError" && versao === carga.current) setErro(e.message); })
      .finally(() => { if (versao === carga.current) setCarregando(false); });
    return () => controller.abort();
  }, [endpoint, mes]);

  function editar(id: string, dados: Partial<Rascunho>) {
    setRascunhos((lista) => lista.map((p) => p.tarefaId === id ? { ...p, ...dados } : p));
    setAlterado(true); setAviso("");
  }
  const escolhidas = rascunhos.filter((p) => p.selecionada);
  const foraDaAgenda = cronograma?.pautas.filter((p) => !tarefas.some((t) => t.id === p.tarefaId)) || [];
  const link = cronograma?.ativo ? `${origem}/cronograma/${cronograma.token}` : "";
  const pautasPrevia: PautaPublica[] = escolhidas.map((p) => ({ ...p, id: p.tarefaId, comentarios: [] }));

  async function salvar() {
    setSalvando(true); setErro(""); setAviso("");
    try {
      const dados = await resposta<Cronograma>(await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mes, pautas: escolhidas.map(({ selecionada, ...p }) => p) }) }));
      setCronograma(dados); setAlterado(false); setAviso("Cronograma compartilhado salvo. O link mostra somente as pautas selecionadas.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  async function desativar() {
    setSalvando(true); setErro(""); setAviso("");
    try {
      await resposta(await fetch(`${endpoint}?mes=${mes}`, { method: "DELETE" }));
      setCronograma((c) => c ? { ...c, ativo: false } : c); setAviso("Link desativado. As pautas e os comentários foram preservados.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível desativar."); }
    finally { setSalvando(false); }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(link); setAviso("Link copiado para enviar ao cliente."); }
    catch { setAviso("Selecione e copie o endereço exibido abaixo."); }
  }
  async function responder(pautaId: string, texto: string) {
    const comentario = await resposta<PautaPublica["comentarios"][number]>(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mes, pautaId, texto }) }));
    setCronograma((c) => c ? { ...c, pautas: c.pautas.map((p) => p.id === pautaId ? { ...p, comentarios: [...p.comentarios, comentario] } : p) } : c);
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-medium text-text">Cronograma do cliente</h2><p className="mt-1 max-w-xl text-sm text-muted">Selecione as pautas, confira o roteiro e compartilhe a proposta com {clienteNome}.</p></div>
      <label className="text-xs text-muted">Mês do cronograma<input type="month" aria-label="Mês do cronograma" min="2000-01" max="2099-12" value={mes} disabled={salvando} onChange={(e) => { if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value) && (!alterado || window.confirm("Há alterações ainda não compartilhadas. Trocar de mês e descartá-las?"))) setMes(e.target.value); }} className={`${campo} mt-1`} /></label>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button className={botao} onClick={() => setPrevia(false)} aria-pressed={!previa}><Check size={15} /> Selecionar pautas</button>
      <button className={botao} onClick={() => setPrevia(true)} aria-pressed={previa} disabled={carregando}><Eye size={15} /> Prévia do cliente ({escolhidas.length})</button>
      <Link className={`${botao} sm:ml-auto`} href={`/dashboard/agenda?cliente=${clienteId}&mes=${mes}&visao=tarefas&datas=postagem`}><CalendarDays size={15} /> Organizar datas na Agenda</Link>
    </div>
    {erro && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{erro}</p>}
    {aviso && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">{aviso}</p>}
    {carregando ? <p role="status" className="py-8 text-sm text-muted">Carregando pautas…</p> : previa ? <div className="rounded-2xl border border-border bg-card p-4 sm:p-6"><p className="mb-1 text-xs uppercase tracking-wider text-accent">Prévia do cliente</p><h3 className="text-xl font-medium text-text">Cronograma proposto — {nomeMesCronograma(mes)}</h3><p className="mb-5 mt-2 text-sm text-muted">{clienteNome} · Datas previstas, sujeitas a alinhamento.</p><PautasCronograma pautas={pautasPrevia} previa /></div> : <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted"><span>{tarefas.length} pautas com postagem prevista · {escolhidas.length} selecionadas</span><div className="flex gap-3"><button disabled={salvando} className="text-text underline underline-offset-4 disabled:opacity-50" onClick={() => { setRascunhos((ps) => ps.map((p) => ({ ...p, selecionada: true }))); setAlterado(true); }}>Selecionar todas</button><button disabled={salvando} className="underline underline-offset-4 disabled:opacity-50" onClick={() => { setRascunhos((ps) => ps.map((p) => ({ ...p, selecionada: false }))); setAlterado(true); }}>Limpar seleção</button></div></div>
      {tarefas.length === 0 && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">Ainda não há pautas com data de postagem neste mês. <Link href={`/dashboard/tarefas?area=planejamento&cliente=${clienteId}`} className="text-text underline underline-offset-4">Cadastre as ideias no Planejamento</Link> e defina o dia de postagem, aqui ou na Agenda.</div>}
      <div className="space-y-3">{rascunhos.map((p) => {
        const tarefa = tarefas.find((t) => t.id === p.tarefaId)!;
        const salva = cronograma?.pautas.find((s) => s.tarefaId === p.tarefaId);
        return <article key={p.tarefaId} className={`rounded-2xl border p-4 sm:p-5 ${p.selecionada ? "border-accent/40 bg-card" : "border-border bg-card/40"}`}>
          <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={p.selecionada} disabled={salvando} onChange={(e) => editar(p.tarefaId, { selecionada: e.target.checked })} className="mt-1 h-4 w-4 accent-[#E63946]" /><span className="min-w-0"><span className="block text-xs capitalize text-muted">{dataPauta(p.dataPrevista)} · {p.formato}</span><span className="mt-1 block font-medium text-text">{p.titulo}</span></span><span className="ml-auto hidden shrink-0 text-xs text-muted sm:block">{p.selecionada ? "Visível após salvar" : "Interna"}</span></label>
          {p.selecionada && <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]"><label className="text-xs text-muted">Título para o cliente<input value={p.titulo} maxLength={300} disabled={salvando} onChange={(e) => editar(p.tarefaId, { titulo: e.target.value })} className={`${campo} mt-1`} /></label><label className="text-xs text-muted">Formato<select value={p.formato} disabled={salvando} onChange={(e) => editar(p.tarefaId, { formato: e.target.value as FormatoPauta })} className={`${campo} mt-1`}><option>Reel</option><option>Carrossel</option><option>Outro</option></select></label></div>
            <label className="block text-xs text-muted">Ideia e roteiro que o cliente verá<textarea rows={7} maxLength={20000} value={p.textoCliente} disabled={salvando} onChange={(e) => editar(p.tarefaId, { textoCliente: e.target.value })} placeholder="Apresente a ideia, o objetivo e algumas falas de exemplo…" className={`${campo} mt-1 resize-y`} /></label>
            <p className="text-xs text-muted">Este texto é próprio da apresentação. As alterações aqui não mudam a descrição interna da tarefa.</p>
            {tarefa.descricao && <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-xs text-muted">Consultar descrição interna da tarefa</summary><p className="mt-3 whitespace-pre-wrap text-xs text-muted">{tarefa.descricao}</p><button className={`${botao} mt-3`} disabled={salvando} onClick={() => editar(p.tarefaId, { textoCliente: tarefa.descricao || "" })}>Copiar descrição para a apresentação</button></details>}
          </div>}
          {!!salva?.comentarios.length && <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm text-text"><MessageCircle size={14} className="mr-2 inline" />Comentários desta pauta ({salva.comentarios.length}){!salva.visivel && " · pauta interna"}</summary><div className="mt-4"><PautasCronograma pautas={[salva]} modoComentarios onResponder={responder} /></div></details>}
        </article>;
      })}</div>
    </>}
    {!carregando && foraDaAgenda.length > 0 && <details className="rounded-2xl border border-border bg-card p-4"><summary className="cursor-pointer text-sm text-text">Histórico de pautas fora da Agenda deste mês ({foraDaAgenda.length})</summary><p className="mt-3 text-xs text-muted">Estas tarefas mudaram de mês ou foram removidas. Ao atualizar o cronograma, elas deixam de aparecer no link. Os comentários ficam preservados aqui.</p><div className="mt-4 space-y-4">{foraDaAgenda.map((p) => <div key={p.id} className="rounded-xl border border-border p-4"><p className="mb-3 text-sm font-medium text-text">{p.titulo}</p><PautasCronograma pautas={[p]} modoComentarios onResponder={responder} /></div>)}</div></details>}
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">{alterado ? "Há alterações que ainda não estão no link do cliente." : "Confira a prévia antes de compartilhar."}</p><button disabled={carregando || salvando || (!escolhidas.length && !cronograma?.ativo) || escolhidas.some((p) => !p.titulo.trim())} onClick={salvar} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-50"><Share2 size={16} />{salvando ? "Salvando…" : cronograma?.ativo ? "Atualizar cronograma compartilhado" : "Compartilhar cronograma"}</button></div>
      {link && <div className="mt-4 space-y-3 border-t border-border pt-4"><label className="block text-xs text-muted">Link para enviar ao cliente<input readOnly value={link} onFocus={(e) => e.target.select()} className={`${campo} mt-1`} /></label><div className="flex flex-wrap gap-2"><button onClick={copiar} className={botao}><Copy size={14} /> Copiar link</button><a href={link} target="_blank" rel="noopener noreferrer" className={botao}><Eye size={14} /> Abrir apresentação salva</a><button onClick={desativar} disabled={salvando} className={`${botao} sm:ml-auto`}>Desativar link</button></div><p className="text-xs text-muted">Quem receber o link poderá ver as pautas liberadas e comentar. Comentários não aprovam nem agendam publicações.</p></div>}
    </div>
  </section>;
}
