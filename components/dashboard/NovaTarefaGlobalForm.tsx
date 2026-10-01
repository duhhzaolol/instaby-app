"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ListChecks } from "lucide-react";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { PRESETS_CHECKLIST } from "@/lib/presetsChecklist";
import { DatePicker } from "@/components/ui/DatePicker";

type Cliente = { id: string; nome: string; cor: string | null };

export function NovaTarefaGlobalForm({
  clientes,
  categoriaFixa,
  placeholder,
  textoBotao,
  clienteInicial = "",
  prazoInicial = "",
  abertoInicial = false,
  aoConcluir,
  aoCancelar,
}: {
  clientes: Cliente[];
  // Quando informado, trava a categoria (esconde o seletor) — usado no
  // formulário de rotina do Tráfego Pago, que sempre cria tarefa categoria "campanha".
  categoriaFixa?: string;
  placeholder?: string;
  textoBotao?: string;
  clienteInicial?: string;
  prazoInicial?: string;
  abertoInicial?: boolean;
  aoConcluir?: () => void;
  aoCancelar?: () => void;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(abertoInicial);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState(clienteInicial);
  const [categoria, setCategoria] = useState(categoriaFixa || "");
  const [prazo, setPrazo] = useState(prazoInicial);
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [checklistItens, setChecklistItens] = useState<string[]>([]);
  const [novoItemChecklist, setNovoItemChecklist] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  function limpar() {
    setTitulo("");
    setClienteId("");
    setCategoria(categoriaFixa || "");
    setPrazo("");
    setHora("");
    setObservacao("");
    setChecklistItens([]);
    setNovoItemChecklist("");
  }

  function adicionarItemChecklist() {
    if (!novoItemChecklist.trim()) return;
    setChecklistItens((prev) => [...prev, novoItemChecklist.trim()]);
    setNovoItemChecklist("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          clienteId: clienteId || null,
          categoria: categoriaFixa || categoria || null,
          descricao: observacao || null,
          prazo: prazo ? `${prazo}T${hora || "00:00"}:00-03:00` : null,
          checklistItens:
            checklistItens.length > 0 ? checklistItens : undefined,
        }),
      });

      const resposta = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(
          resposta?.erro || "Não consegui criar a tarefa. Tente novamente.",
        );
        return;
      }
      limpar();
      setAberto(false);
      router.refresh();
      aoConcluir?.();
    } catch {
      setErro(
        "Não consegui criar a tarefa. Confira a conexão e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
      >
        <Plus size={15} /> {textoBotao || "Nova tarefa"}
      </button>
    );
  }

  return (
    <form
      onSubmit={salvar}
      className="mb-5 rounded-2xl border border-border bg-card/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova tarefa</p>
        <button
          type="button"
          aria-label="Cancelar nova tarefa"
          onClick={() => {
            setAberto(false);
            aoCancelar?.();
          }}
          className="text-muted hover:text-text"
        >
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={placeholder || "O que precisa ser feito?"}
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text outline-none focus:border-accent/50"
      />

      <div
        className={`mb-3 grid gap-2 ${categoriaFixa ? "grid-cols-1" : "grid-cols-2"}`}
      >
        <select
          value={clienteId}
          aria-label="Cliente da nova tarefa"
          onChange={(e) => setClienteId(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {!categoriaFixa && (
          <select
            value={categoria}
            aria-label="Categoria da nova tarefa"
            onChange={(e) => setCategoria(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
          >
            <option value="">Categoria (opcional)</option>
            {CATEGORIAS_TAREFA.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <DatePicker
          value={prazo}
          onChange={setPrazo}
          placeholder="Prazo (opcional)"
          limpavel
        />
        <input
          type="time"
          aria-label="Horário opcional da tarefa"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          disabled={!prazo}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text disabled:opacity-40"
        />
      </div>
      <p className="mb-3 text-xs text-muted">
        O horário é opcional. A data organiza o trabalho no cronograma.
      </p>

      <textarea
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        rows={4}
        placeholder="Observação (opcional)"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
      />

      <div className="mb-3 rounded-xl border border-border/60 bg-base/30 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
          <ListChecks size={12} /> Checklist inicial (opcional)
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS_CHECKLIST.map((preset) => (
            <button
              key={preset.nome}
              type="button"
              onClick={() => setChecklistItens(preset.itens)}
              className="rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-text"
            >
              {preset.nome}
            </button>
          ))}
          {checklistItens.length > 0 && (
            <button
              type="button"
              onClick={() => setChecklistItens([])}
              className="rounded-full px-2.5 py-1 text-[11px] text-muted hover:text-red-400"
            >
              Limpar
            </button>
          )}
        </div>

        {checklistItens.length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            {checklistItens.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-card/40 px-2.5 py-1.5"
              >
                <span className="flex-1 truncate text-xs text-text">
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setChecklistItens((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                  className="shrink-0 text-muted hover:text-red-400"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            value={novoItemChecklist}
            onChange={(e) => setNovoItemChecklist(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarItemChecklist();
              }
            }}
            placeholder="Ou digite um passo e adicione"
            className="h-8 w-full min-w-0 flex-1 rounded-lg border border-border bg-card/60 px-2.5 text-xs text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
          />
          <button
            type="button"
            onClick={adicionarItemChecklist}
            className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border px-2 text-[11px] text-muted hover:border-accent/40 hover:text-text"
          >
            <Plus size={11} /> Adicionar
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando || !titulo.trim()}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Criando..." : "Criar tarefa"}
      </button>
      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {erro}
        </p>
      )}
    </form>
  );
}
