"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVALIACAO, AVALIACAO_LABEL } from "@/lib/trafego";
export type DadosAvaliacao = {
  id: string;
  nome: string;
  avaliacao: string;
  avaliacaoObjetivo?: string | null;
  avaliacaoMeta?: string | null;
  avaliacaoObservacoes?: string | null;
};
export function AvaliarCampanha({
  campanha,
  onFechar,
}: {
  campanha: DadosAvaliacao;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [avaliacao, setAvaliacao] = useState(campanha.avaliacao);
  const [meta, setMeta] = useState(campanha.avaliacaoMeta || "");
  const [observacoes, setObservacoes] = useState(
    campanha.avaliacaoObservacoes || "",
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch(`/api/campanhas/${campanha.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avaliacao,
          avaliacaoMeta: meta || null,
          avaliacaoObservacoes: observacoes || null,
        }),
      });
      if (!r.ok) throw new Error("Não foi possível salvar a avaliação.");
      router.refresh();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }
  return (
    <form
      onSubmit={salvar}
      className="my-3 rounded-xl border border-accent/30 bg-card p-4"
    >
      <p className="mb-2 text-sm font-medium text-text">
        Avaliação da campanha: {campanha.nome}
      </p>
      <p className="mb-2 text-xs text-muted">
        Sua avaliação fica salva na campanha e será usada nos novos relatórios.
        A avaliação geral do período é um comentário separado.
      </p>
      <select
        aria-label="Avaliação da campanha"
        value={avaliacao}
        onChange={(e) => setAvaliacao(e.target.value)}
        className="mb-2 h-10 w-full rounded-lg border border-border bg-base px-2 text-sm text-text"
      >
        {AVALIACAO.map((a) => (
          <option key={a} value={a}>
            {AVALIACAO_LABEL[a]}
          </option>
        ))}
      </select>
      <input
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        placeholder="Meta esperada (opcional)"
        className="mb-2 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
      />
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Comentário da avaliação"
        rows={2}
        className="mb-2 w-full rounded-lg border border-border bg-base px-3 py-2 text-sm text-text"
      />
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <div className="flex gap-2">
        <button
          disabled={salvando}
          className="rounded-lg bg-accent px-3 py-2 text-xs text-white"
        >
          {salvando ? "Salvando..." : "Salvar avaliação"}
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg border border-border px-3 py-2 text-xs text-text"
        >
          Fechar
        </button>
      </div>
    </form>
  );
}
