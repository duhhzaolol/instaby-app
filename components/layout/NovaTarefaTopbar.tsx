"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";

type Cliente = { id: string; nome: string; cor: string | null };

export function NovaTarefaTopbar({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prazo, setPrazo] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);

  function fechar() {
    setAberto(false);
    setTitulo("");
    setClienteId("");
    setCategoria("");
    setPrazo("");
    setHora("");
    setObservacao("");
    setErro(null);
  }

  useEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    const focoAnterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    // Um popover no top layer não deve ficar por cima deste modal via portal.
    document.querySelectorAll<HTMLElement>("[popover]").forEach((el) => {
      if (typeof el.hidePopover === "function" && el.matches(":popover-open")) el.hidePopover();
    });
    document.body.style.overflow = "hidden";
    tituloRef.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        fechar();
      }
      if (e.key !== "Tab" || !painel) return;
      const controles = Array.from(painel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.getClientRects().length > 0);
      const primeiro = controles[0];
      const ultimo = controles[controles.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus(); }
    }
    function conterFoco(e: FocusEvent) {
      if (painel && !painel.contains(e.target as Node)) tituloRef.current?.focus();
    }
    document.addEventListener("keydown", aoTeclar, true);
    document.addEventListener("focusin", conterFoco);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", aoTeclar, true);
      document.removeEventListener("focusin", conterFoco);
      if (focoAnterior?.isConnected) focoAnterior.focus();
      else botaoRef.current?.focus();
    };
  }, [aberto]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, clienteId: clienteId || null, categoria: categoria || null, descricao: observacao || null, prazo: prazo ? `${prazo}T${hora || "00:00"}:00-03:00` : null }),
      });
      if (!res.ok) throw new Error("tarefa");
      fechar();
      router.refresh();
    } catch {
      setErro("Não foi possível criar a tarefa. Seus dados foram mantidos; tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "h-11 w-full min-w-0 rounded-lg border border-border bg-inset px-3 text-base text-text placeholder:text-muted disabled:opacity-50";
  return (
    <>
      <Button ref={botaoRef} type="button" aria-label="Nova tarefa" aria-haspopup="dialog" aria-expanded={aberto} onClick={() => { setErro(null); setAberto(true); }} className="h-11 w-11 shrink-0 px-0 sm:w-auto sm:px-3.5">
        <Plus size={18} aria-hidden="true" /><span className="hidden sm:inline">Nova tarefa</span>
      </Button>
      {aberto && createPortal(
        <>
          <button type="button" tabIndex={-1} aria-label="Fechar nova tarefa pelo fundo" data-testid="fundo-nova-tarefa" onClick={fechar} className="fixed inset-0 z-40 h-full w-full bg-black/60" />
          {/* O invólucro não captura toques fora do painel; o fundo desmonta junto. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain p-4">
            <div ref={painelRef} role="dialog" aria-modal="true" aria-labelledby="titulo-nova-tarefa" className="pointer-events-auto my-auto w-full max-w-md shrink-0 self-center rounded-xl border border-border bg-card p-5 text-text shadow-premium-lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="titulo-nova-tarefa" className="text-base font-semibold text-text">Nova tarefa</h2>
                <button type="button" aria-label="Fechar nova tarefa" onClick={fechar} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"><X size={18} aria-hidden="true" /></button>
              </div>
              <form onSubmit={salvar} className="space-y-4">
                <div>
                  <label htmlFor="nova-tarefa-titulo" className="mb-1.5 block text-xs font-medium text-muted">Título da tarefa</label>
                  <input ref={tituloRef} id="nova-tarefa-titulo" name="titulo" autoComplete="off" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="O que precisa ser feito?" className={campo} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label htmlFor="nova-tarefa-cliente" className="mb-1.5 block text-xs font-medium text-muted">Cliente <span className="font-normal">(opcional)</span></label><select id="nova-tarefa-cliente" name="clienteId" value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campo}><option value="">Sem cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                  <div><label htmlFor="nova-tarefa-categoria" className="mb-1.5 block text-xs font-medium text-muted">Categoria <span className="font-normal">(opcional)</span></label><select id="nova-tarefa-categoria" name="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}><option value="">Sem categoria</option>{CATEGORIAS_TAREFA.map((c) => <option key={c.valor} value={c.valor}>{c.label}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div role="group" aria-labelledby="nova-tarefa-prazo-label"><p id="nova-tarefa-prazo-label" className="mb-1.5 text-xs font-medium text-muted">Prazo <span className="font-normal">(opcional)</span></p><DatePicker value={prazo} onChange={setPrazo} placeholder="Selecionar data" limpavel className="[&>button]:h-11 [&>button]:rounded-lg [&>button]:bg-inset [&>button]:text-base" /></div>
                  <div><label htmlFor="nova-tarefa-hora" className="mb-1.5 block text-xs font-medium text-muted">Horário <span className="font-normal">(opcional)</span></label><input id="nova-tarefa-hora" name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={!prazo} className={campo} /></div>
                </div>
                <div><label htmlFor="nova-tarefa-observacao" className="mb-1.5 block text-xs font-medium text-muted">Observação <span className="font-normal">(opcional)</span></label><textarea id="nova-tarefa-observacao" name="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-inset px-3 py-2.5 text-base text-text" /></div>
                {erro && <p role="alert" className="text-sm text-accent-text">{erro}</p>}
                <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={fechar}>Cancelar</Button><Button type="submit" disabled={enviando || !titulo.trim()}>{enviando ? "Criando…" : "Criar tarefa"}</Button></div>
              </form>
            </div>
          </div>
        </>, document.querySelector(".tema-painel") || document.body
      )}
    </>
  );
}
