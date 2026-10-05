"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { dataPauta, type PautaPublica } from "@/lib/cronogramaApresentacao";

const campo = "w-full rounded-xl border border-border bg-base px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40";

function ComentariosPauta({ pauta, token, previa, onResponder }: { pauta: PautaPublica; token?: string; previa?: boolean; onResponder?: (id: string, texto: string) => Promise<void> }) {
  const [comentarios, setComentarios] = useState(pauta.comentarios);
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const interna = !!onResponder;

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true); setErro(""); setAviso("");
    try {
      if (onResponder) { await onResponder(pauta.id, texto); }
      else {
        const res = await fetch(`/api/cronograma/${token}/pautas/${pauta.id}/comentarios`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autor: nome, texto }) });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.erro || "Não foi possível enviar o comentário.");
        setComentarios((lista) => [...lista, dados]);
      }
      setTexto(""); setAviso("Comentário enviado.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível enviar."); }
    finally { setEnviando(false); }
  }
  const lista = interna ? pauta.comentarios : comentarios;
  return <div className="space-y-3">
    <p className="flex items-center gap-2 text-sm font-medium text-text"><MessageCircle size={15} />Comentários e sugestões</p>
    {lista.length === 0 && <p className="text-sm text-muted">Gostou da ideia, mas quer ajustar alguma fala? Descreva aqui o que gostaria de mudar.</p>}
    {lista.map((c) => <div key={c.id} className="rounded-xl border border-border bg-base/50 p-3"><p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"><strong className="font-medium text-text">{c.autor}</strong>{c.origem === "agencia" && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-accent">Equipe Instaby</span>}<time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-text">{c.texto}</p></div>)}
    {previa ? <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted">O cliente poderá escrever uma sugestão nesta pauta e informar o nome ao enviar.</div> : (token || onResponder) && <form onSubmit={enviar} className="space-y-3">
      {!interna && <label className="block text-xs text-muted">Seu nome<input required minLength={2} maxLength={80} autoComplete="name" value={nome} disabled={enviando} onChange={(e) => setNome(e.target.value)} className={`${campo} mt-1`} /></label>}
      <label className="block text-xs text-muted">{interna ? "Responder ao cliente" : "Seu comentário ou sugestão"}<textarea required minLength={3} maxLength={2000} rows={3} value={texto} disabled={enviando} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: gostei da ideia, mas queria mudar a fala de abertura…" className={`${campo} mt-1 resize-y`} /></label>
      {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}{aviso && <p role="status" className="text-sm text-emerald-300">{aviso}</p>}
      <button type="submit" disabled={enviando || texto.trim().length < 3 || (!interna && nome.trim().length < 2)} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm text-white disabled:opacity-50"><Send size={14} />{enviando ? "Enviando…" : interna ? "Enviar resposta" : "Enviar comentário"}</button>
    </form>}
  </div>;
}

export function PautasCronograma({ pautas, token, previa = false, modoComentarios = false, onResponder }: { pautas: PautaPublica[]; token?: string; previa?: boolean; modoComentarios?: boolean; onResponder?: (id: string, texto: string) => Promise<void> }) {
  if (!pautas.length) return <p className="py-6 text-sm text-muted">Nenhuma pauta liberada para apresentação.</p>;
  return <div className="space-y-4">{[...pautas].sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista)).map((p) => modoComentarios ? <ComentariosPauta key={p.id} pauta={p} onResponder={onResponder} /> : <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="capitalize text-muted">Data prevista · {dataPauta(p.dataPrevista)}</span><span className="rounded-lg border border-border px-2.5 py-1 text-text">{p.formato}</span></div><h2 className="mt-3 text-lg font-medium leading-snug text-text sm:text-xl">{p.titulo}</h2><p className="mt-2 text-xs text-muted">Pauta proposta · em alinhamento</p>
      <details className="mt-4" open><summary className="cursor-pointer text-sm font-medium text-text">Ideia e roteiro de exemplo</summary><div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{p.textoCliente || "O roteiro será detalhado após o alinhamento desta ideia."}</div></details>
    </div><div className="border-t border-border p-4 sm:p-6"><ComentariosPauta pauta={p} token={token} previa={previa} /></div>
  </article>)}</div>;
}
