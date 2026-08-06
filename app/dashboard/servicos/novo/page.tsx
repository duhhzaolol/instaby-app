"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoServicoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Social media");
  const [unidade, setUnidade] = useState("mês");
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch("/api/servicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        descricao,
        categoria,
        unidade,
        valorUnitario: parseFloat(valor),
      }),
    });

    setEnviando(false);

    if (resposta.ok) {
      router.push("/dashboard/servicos");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <p className="mb-5 text-base font-medium text-white">Novo serviço</p>

      <form onSubmit={handleSubmit} className="max-w-md">
        <label className="text-xs text-muted">Nome</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Gestão de Instagram"
          className="mb-4 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
        />

        <label className="text-xs text-muted">Descrição (aparece na proposta pro cliente)</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Planejamento, criação e publicação de conteúdo..."
          className="mb-4 mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted">Categoria</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted">Unidade</label>
            <input
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              placeholder="mês, reel, post..."
              className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>
        </div>

        <label className="text-xs text-muted">Valor unitário (R$)</label>
        <input
          required
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="mb-6 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={enviando}
          className="h-11 w-full rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-60"
        >
          {enviando ? "Salvando..." : "Salvar serviço"}
        </button>
      </form>
    </div>
  );
}
