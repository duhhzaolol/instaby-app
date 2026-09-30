"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

type TemplateOpcao = {
  id: string;
  nome: string;
  temCiclo: boolean;
  totalEtapas: number;
  totalItens: number;
};

// "Aplicar template" num cliente (Etapa 4 v158) — mesmo padrão de
// expandir/recolher do NovaTarefaForm.tsx. Busca a lista enxuta de
// /api/templates-tarefas/opcoes (nome + formato, sem exigir
// gerenciarConfiguracoes) e aplica de verdade em POST
// /api/templates-tarefas/[id]/aplicar, que já checa podeVerCliente.
export default function AplicarTemplateForm({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [templates, setTemplates] = useState<TemplateOpcao[] | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (aberto && templates === null) {
      fetch("/api/templates-tarefas/opcoes")
        .then((r) => r.json())
        .then((dados) => setTemplates(Array.isArray(dados) ? dados : []))
        .catch(() => setTemplates([]));
    }
  }, [aberto, templates]);

  const templateEscolhido = templates?.find((t) => t.id === templateId) || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) return;
    if (templateEscolhido?.temCiclo && !dataAlvo) {
      setErro("Informe a data de entrega/publicação desse ciclo.");
      return;
    }
    setEnviando(true);
    setErro("");

    const resposta = await fetch(`/api/templates-tarefas/${templateId}/aplicar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        dataAlvo: templateEscolhido?.temCiclo ? dataAlvo : undefined,
      }),
    });

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null);
      setErro(dados?.erro || "Não consegui aplicar esse template.");
      return;
    }

    setTemplateId("");
    setDataAlvo("");
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <Layers size={14} /> Aplicar template
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-xl border border-border bg-card/60 p-3">
      {templates === null ? (
        <p className="text-sm text-muted">Carregando templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum template cadastrado ainda. Peça pra quem administra criar um em Configurações.
        </p>
      ) : (
        <>
          <select
            required
            autoFocus
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setErro("");
            }}
            className="mb-2 h-9 w-full rounded-lg border border-border bg-base px-3 text-sm text-text outline-none focus:border-accent/50"
          >
            <option value="">Escolha um template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {t.temCiclo ? `ciclo completo, ${t.totalEtapas} etapas` : `checklist, ${t.totalItens} itens`}
              </option>
            ))}
          </select>

          {templateEscolhido?.temCiclo && (
            <div className="mb-2">
              <p className="mb-1 text-xs text-muted">
                Data de entrega/publicação (o prazo de cada etapa é calculado a partir dela)
              </p>
              <DatePicker value={dataAlvo} onChange={setDataAlvo} />
            </div>
          )}

          {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando || !templateId}
              className="h-9 flex-1 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {enviando ? "Aplicando..." : "Aplicar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setErro("");
              }}
              className="h-9 rounded-lg border border-border px-4 text-sm text-muted hover:text-text"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </form>
  );
}
