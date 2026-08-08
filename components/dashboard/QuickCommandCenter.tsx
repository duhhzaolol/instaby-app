"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, X, CheckCircle2, ArrowLeft, Keyboard } from "lucide-react";
import { CATEGORIAS_TAREFA, type CategoriaTarefa } from "@/lib/categoriaTarefaVisual";

type Cliente = { id: string; nome: string; cor: string | null };

export function QuickCommandCenter({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<"categoria" | "cliente" | "texto" | "sucesso">("categoria");
  const [categoria, setCategoria] = useState<CategoriaTarefa | null>(null);
  const [tituloLivre, setTituloLivre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modoTexto, setModoTexto] = useState(false);
  const [textoRapido, setTextoRapido] = useState("");
  const [clienteRapido, setClienteRapido] = useState("");

  function abrir() {
    setAberto(true);
    setEtapa("categoria");
    setCategoria(null);
    setTituloLivre("");
  }

  function fechar() {
    setAberto(false);
  }

  function escolherCategoria(cat: (typeof CATEGORIAS_TAREFA)[number]) {
    setCategoria(cat.valor);
    if (cat.valor === "outra") {
      setEtapa("texto");
    } else {
      setEtapa("cliente");
    }
  }

  async function criarTarefa(clienteId: string | null, titulo?: string) {
    setEnviando(true);
    const catInfo = CATEGORIAS_TAREFA.find((c) => c.valor === categoria);
    await fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: titulo || catInfo?.label || "Tarefa",
        categoria,
        clienteId,
      }),
    });
    setEnviando(false);
    setEtapa("sucesso");
    router.refresh();
    setTimeout(() => setAberto(false), 900);
  }

  async function enviarTextoRapido(e: React.FormEvent) {
    e.preventDefault();
    if (!textoRapido.trim()) return;
    setEnviando(true);
    await fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: textoRapido, clienteId: clienteRapido || null }),
    });
    setEnviando(false);
    setTextoRapido("");
    setClienteRapido("");
    setModoTexto(false);
    router.refresh();
  }

  if (modoTexto) {
    return (
      <form
        onSubmit={enviarTextoRapido}
        className="mb-6 flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-3 sm:flex-row"
      >
        <input
          autoFocus
          value={textoRapido}
          onChange={(e) => setTextoRapido(e.target.value)}
          placeholder="Digite e aperte enter..."
          className="h-11 flex-1 rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
        />
        <select
          value={clienteRapido}
          onChange={(e) => setClienteRapido(e.target.value)}
          className="h-11 rounded-xl border border-border bg-base/60 px-3 text-sm text-text sm:w-40"
        >
          <option value="">Sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enviando || !textoRapido.trim()}
          className="h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setModoTexto(false)}
          className="h-11 rounded-xl border border-border px-3 text-xs text-muted hover:text-text"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        onClick={abrir}
        className="group relative mb-6 w-full overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-6 text-left transition-all hover:border-accent/40 hover:shadow-glow"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
              <Zap size={14} /> O que precisa fazer?
            </p>
            <p className="text-lg font-medium text-text">Registre uma atividade rapidamente</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-105">
            + Começar
          </span>
        </div>
      </button>

      <button
        onClick={() => setModoTexto(true)}
        className="mb-6 -mt-4 flex items-center gap-1 text-xs text-muted hover:text-text"
      >
        <Keyboard size={12} /> ou prefiro digitar
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={fechar}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6"
          >
            {etapa === "sucesso" ? (
              <div className="flex flex-col items-center py-8">
                <CheckCircle2 size={40} className="mb-3 text-emerald-400" />
                <p className="text-sm font-medium text-text">Tarefa criada</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {etapa === "cliente" && (
                      <button onClick={() => setEtapa("categoria")} className="text-muted hover:text-text">
                        <ArrowLeft size={16} />
                      </button>
                    )}
                    <p className="text-sm font-medium text-text">
                      {etapa === "categoria" ? "⚡ O que precisa fazer?" : "Para qual cliente?"}
                    </p>
                  </div>
                  <button onClick={fechar} className="text-muted hover:text-text">
                    <X size={16} />
                  </button>
                </div>

                {etapa === "categoria" && (
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIAS_TAREFA.map((cat) => {
                      const Icon = cat.icone;
                      return (
                        <button
                          key={cat.valor}
                          onClick={() => escolherCategoria(cat)}
                          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-base/60 p-3 text-left transition-colors hover:border-white/20 hover:bg-hover"
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${cat.cor}1A`, color: cat.cor }}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-text">{cat.label}</p>
                            <p className="text-[10px] text-muted">{cat.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {etapa === "cliente" && (
                  <div className="flex flex-col gap-2">
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => criarTarefa(c.id)}
                        disabled={enviando}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-left transition-colors hover:bg-hover disabled:opacity-50"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.cor || "#9CA3AF" }}
                        />
                        <span className="text-sm text-text">{c.nome}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => criarTarefa(null)}
                      disabled={enviando}
                      className="rounded-xl border border-dashed border-border px-3.5 py-2.5 text-left text-sm text-muted hover:text-text disabled:opacity-50"
                    >
                      Sem cliente
                    </button>
                  </div>
                )}

                {etapa === "texto" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!tituloLivre.trim()) return;
                      criarTarefa(null, tituloLivre);
                    }}
                  >
                    <input
                      autoFocus
                      value={tituloLivre}
                      onChange={(e) => setTituloLivre(e.target.value)}
                      placeholder="Digite a tarefa..."
                      className="mb-3 h-11 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text outline-none focus:border-accent/50"
                    />
                    <button
                      type="submit"
                      disabled={enviando || !tituloLivre.trim()}
                      className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
                    >
                      Salvar
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
