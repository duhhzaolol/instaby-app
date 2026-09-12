"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type TemplateTarefasData = { id: string; nome: string; itens: string[] };

export default function TemplatesTarefasForm({ templates }: { templates: TemplateTarefasData[] }) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState("");
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() {
    setNovo(true);
    setEditandoId(null);
    setNome("");
    setItens([]);
    setNovoItem("");
  }

  function abrirEditar(t: TemplateTarefasData) {
    setNovo(true);
    setEditandoId(t.id);
    setNome(t.nome);
    setItens(t.itens);
    setNovoItem("");
  }

  function adicionarItem() {
    if (!novoItem.trim()) return;
    setItens((a) => [...a, novoItem.trim()]);
    setNovoItem("");
  }

  async function salvar() {
    if (!nome.trim() || itens.length === 0) return;
    setSalvando(true);
    if (editandoId) {
      await fetch(`/api/templates-tarefas/${editandoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, itens }),
      });
    } else {
      await fetch("/api/templates-tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, itens }),
      });
    }
    setSalvando(false);
    setNovo(false);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esse template?")) return;
    await fetch(`/api/templates-tarefas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <div className="mb-3 flex flex-col gap-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card/60 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm text-text">{t.nome}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirEditar(t)} className="text-muted hover:text-text">
                  <Pencil size={12} />
                </button>
                <button onClick={() => excluir(t.id)} className="text-muted hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted">{t.itens.join(", ")}</p>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-muted">Nenhum template ainda.</p>}
      </div>

      {!novo ? (
        <button
          onClick={abrirNovo}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted hover:text-text"
        >
          <Plus size={14} /> Novo template
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-text">{editandoId ? "Editar template" : "Novo template"}</p>
            <button onClick={() => setNovo(false)} className="text-muted hover:text-text">
              <X size={14} />
            </button>
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome — ex: Captação"
            className="mb-2 h-9 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
          />
          <div className="mb-2 flex flex-col gap-1">
            {itens.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-base px-2.5 py-1.5">
                <span className="flex-1 text-xs text-text">{item}</span>
                <button onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-400">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarItem())}
              placeholder="Item do checklist"
              className="h-9 flex-1 rounded-lg border border-border bg-base px-3 text-xs text-text"
            />
            <button onClick={adicionarItem} className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Plus size={13} />
            </button>
          </div>
          <Button size="sm" onClick={salvar} disabled={salvando || !nome.trim() || itens.length === 0}>
            {salvando ? "Salvando..." : "Salvar template"}
          </Button>
        </div>
      )}
    </div>
  );
}
