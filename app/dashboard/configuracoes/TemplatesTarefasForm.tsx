"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { ETAPAS_SUGERIDAS } from "@/lib/templatesTarefas";

export type EtapaTemplateData = {
  id?: string;
  titulo: string;
  categoria: string | null;
  diasRelativos: number;
  estimativaHoras: number | null;
};
export type TemplateTarefasData = { id: string; nome: string; itens: string[]; etapas: EtapaTemplateData[] };

function etapaVazia(): EtapaTemplateData {
  return { titulo: "", categoria: null, diasRelativos: 0, estimativaHoras: null };
}

// Rótulo do deslocamento de dias em relação à data-alvo (entrega/publicação) —
// só pra ficar claro no editor: -14 = "14 dias antes", 0 = "no dia", +3 = "3
// dias depois" (Etapa 4 v158).
function rotuloDias(dias: number) {
  if (dias === 0) return "no dia da entrega/publicação";
  if (dias < 0) return `${Math.abs(dias)} dia(s) antes`;
  return `${dias} dia(s) depois`;
}

// "Evoluir os templates para gerar ciclos de planejamento, roteiro, captação,
// edição, aprovação, publicação e relatório" + "calcular prazos relativos à
// data de entrega ou publicação" (Etapa 4 v158). O modo "Lista simples"
// (itens, sem prazo) é o comportamento ORIGINAL, preservado 100% — "Ciclo
// completo" (etapas, com prazo relativo) é o modo novo, opcional por template.
export default function TemplatesTarefasForm({ templates }: { templates: TemplateTarefasData[] }) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [modo, setModo] = useState<"itens" | "etapas">("itens");
  const [itens, setItens] = useState<string[]>([]);
  const [novoItem, setNovoItem] = useState("");
  const [etapas, setEtapas] = useState<EtapaTemplateData[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function abrirNovo() {
    setNovo(true);
    setEditandoId(null);
    setNome("");
    setModo("itens");
    setItens([]);
    setNovoItem("");
    setEtapas([]);
    setErro("");
  }

  function abrirEditar(t: TemplateTarefasData) {
    setNovo(true);
    setEditandoId(t.id);
    setNome(t.nome);
    setItens(t.itens);
    setNovoItem("");
    if (t.etapas.length > 0) {
      setModo("etapas");
      setEtapas(t.etapas);
    } else {
      setModo("itens");
      setEtapas([]);
    }
    setErro("");
  }

  // Trocar de modo dentro do editor não é travado — um template simples pode
  // "evoluir" pra ciclo completo a qualquer momento, e vice-versa. Ciclo novo
  // (ainda sem nenhuma etapa) já entra pré-preenchido com a sugestão de 7
  // etapas — só um ponto de partida, dá pra editar/remover antes de salvar.
  function mudarModo(novoModo: "itens" | "etapas") {
    setModo(novoModo);
    if (novoModo === "etapas" && etapas.length === 0) {
      setEtapas(ETAPAS_SUGERIDAS.map((e) => ({ titulo: e.titulo, categoria: e.categoria, diasRelativos: e.diasRelativos, estimativaHoras: e.estimativaHoras })));
    }
  }

  function adicionarItem() {
    if (!novoItem.trim()) return;
    setItens((a) => [...a, novoItem.trim()]);
    setNovoItem("");
  }

  function atualizarEtapa(i: number, dados: Partial<EtapaTemplateData>) {
    setEtapas((a) => a.map((e, idx) => (idx === i ? { ...e, ...dados } : e)));
  }

  function moverEtapa(i: number, direcao: "up" | "down") {
    const j = direcao === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= etapas.length) return;
    setEtapas((a) => {
      const copia = [...a];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  async function salvar() {
    setErro("");
    if (!nome.trim()) {
      setErro("Digite um nome pro template.");
      return;
    }
    if (modo === "itens" && itens.length === 0) {
      setErro("Adicione pelo menos um item.");
      return;
    }
    if (modo === "etapas" && etapas.filter((e) => e.titulo.trim()).length === 0) {
      setErro("Adicione pelo menos uma etapa com título.");
      return;
    }
    setSalvando(true);
    // Manda sempre os dois campos — o que não é o modo atual vai vazio, pra
    // nunca deixar um template com etapa E item antigo misturados sem querer
    // depois de trocar de modo no meio da edição.
    const body = {
      nome: nome.trim(),
      itens: modo === "itens" ? itens : [],
      etapas: modo === "etapas" ? etapas : [],
    };
    const res = editandoId
      ? await fetch(`/api/templates-tarefas/${editandoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/templates-tarefas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    setSalvando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErro(d?.erro || "Não consegui salvar esse template. Tenta de novo.");
      return;
    }
    setNovo(false);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esse template?")) return;
    const res = await fetch(`/api/templates-tarefas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui excluir esse template. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <div className="mb-3 flex flex-col gap-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-card/60 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm text-text">
                {t.nome}
                {t.etapas.length > 0 && (
                  <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">Ciclo completo</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => abrirEditar(t)} className="text-muted hover:text-text">
                  <Pencil size={12} />
                </button>
                <button onClick={() => excluir(t.id)} className="text-muted hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted">
              {t.etapas.length > 0
                ? t.etapas
                    .slice()
                    .sort((a, b) => a.diasRelativos - b.diasRelativos)
                    .map((e) => e.titulo)
                    .join(" → ")
                : t.itens.join(", ")}
            </p>
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

          <div className="mb-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => mudarModo("itens")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                modo === "itens" ? "bg-accent text-white" : "border border-border text-muted hover:text-text"
              }`}
            >
              Lista simples
            </button>
            <button
              type="button"
              onClick={() => mudarModo("etapas")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                modo === "etapas" ? "bg-accent text-white" : "border border-border text-muted hover:text-text"
              }`}
            >
              Ciclo completo (com prazos)
            </button>
          </div>

          {modo === "itens" ? (
            <>
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
            </>
          ) : (
            <>
              <p className="mb-2 text-[11px] text-muted">
                Cada etapa vira uma tarefa com prazo = data de entrega/publicação + dias abaixo, encadeadas por
                dependência (cada uma depende da anterior).
              </p>
              <div className="mb-3 flex flex-col gap-2">
                {etapas.map((etapa, i) => (
                  <div key={i} className="rounded-lg border border-border bg-base p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <input
                        value={etapa.titulo}
                        onChange={(e) => atualizarEtapa(i, { titulo: e.target.value })}
                        placeholder="Título da etapa"
                        className="h-8 flex-1 rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                      />
                      <button
                        type="button"
                        onClick={() => moverEtapa(i, "up")}
                        disabled={i === 0}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverEtapa(i, "down")}
                        disabled={i === etapas.length - 1}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-text disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEtapas((a) => a.filter((_, idx) => idx !== i))}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <select
                        value={etapa.categoria || ""}
                        onChange={(e) => atualizarEtapa(i, { categoria: e.target.value || null })}
                        className="h-8 rounded-lg border border-border bg-card/60 px-1.5 text-[11px] text-text"
                      >
                        <option value="">Sem categoria</option>
                        {CATEGORIAS_TAREFA.map((c) => (
                          <option key={c.valor} value={c.valor}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={etapa.diasRelativos}
                        onChange={(e) => atualizarEtapa(i, { diasRelativos: Number(e.target.value) || 0 })}
                        placeholder="Dias"
                        className="h-8 rounded-lg border border-border bg-card/60 px-1.5 text-[11px] text-text"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={etapa.estimativaHoras ?? ""}
                        onChange={(e) => atualizarEtapa(i, { estimativaHoras: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Horas"
                        className="h-8 rounded-lg border border-border bg-card/60 px-1.5 text-[11px] text-text"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{rotuloDias(etapa.diasRelativos)}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEtapas((a) => [...a, etapaVazia()])}
                className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted hover:text-text"
              >
                <Plus size={12} /> Adicionar etapa
              </button>
            </>
          )}

          {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}

          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar template"}
          </Button>
        </div>
      )}
    </div>
  );
}
