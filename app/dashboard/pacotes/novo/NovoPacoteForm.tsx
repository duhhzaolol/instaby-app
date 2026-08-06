"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Servico = { id: string; nome: string; categoria: string; valorUnitario: number };
type Selecionado = { servicoId: string; quantidade: number };

export default function NovoPacoteForm({
  servicos,
  pacoteExistente,
}: {
  servicos: Servico[];
  pacoteExistente?: {
    id: string;
    nome: string;
    descricao: string;
    itens: Selecionado[];
  };
}) {
  const router = useRouter();
  const [nome, setNome] = useState(pacoteExistente?.nome || "");
  const [descricao, setDescricao] = useState(pacoteExistente?.descricao || "");
  const [selecionados, setSelecionados] = useState<Record<string, Selecionado>>(
    Object.fromEntries((pacoteExistente?.itens || []).map((i) => [i.servicoId, i]))
  );
  const [enviando, setEnviando] = useState(false);

  const categorias = useMemo(() => Array.from(new Set(servicos.map((s) => s.categoria))), [servicos]);

  function alternar(servico: Servico) {
    setSelecionados((atual) => {
      const copia = { ...atual };
      if (copia[servico.id]) delete copia[servico.id];
      else copia[servico.id] = { servicoId: servico.id, quantidade: 1 };
      return copia;
    });
  }

  function mudarQuantidade(servicoId: string, quantidade: number) {
    setSelecionados((atual) => ({
      ...atual,
      [servicoId]: { ...atual[servicoId], quantidade: Math.max(1, quantidade) },
    }));
  }

  const total = Object.values(selecionados).reduce((soma, sel) => {
    const s = servicos.find((s) => s.id === sel.servicoId);
    return soma + (s ? s.valorUnitario * sel.quantidade : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const url = pacoteExistente ? `/api/pacotes/${pacoteExistente.id}` : "/api/pacotes";
    const method = pacoteExistente ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, itens: Object.values(selecionados) }),
    });

    setEnviando(false);
    router.push("/dashboard/pacotes");
    router.refresh();
  }

  return (
    <Card hoverable={false} className="p-5">
      <form onSubmit={handleSubmit}>
        <Label>Nome do pacote</Label>
        <Input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Plano Crescimento"
          className="mb-4"
        />

        <Label>Descrição (opcional)</Label>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mb-5" />

        {categorias.map((cat) => (
          <div key={cat} className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {servicos
                .filter((s) => s.categoria === cat)
                .map((s) => {
                  const ativo = !!selecionados[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => alternar(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        ativo ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
                      }`}
                    >
                      {s.nome}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        {Object.keys(selecionados).length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {Object.values(selecionados).map((sel) => {
              const s = servicos.find((s) => s.id === sel.servicoId);
              if (!s) return null;
              return (
                <div key={sel.servicoId} className="flex items-center justify-between rounded-xl bg-card/60 px-3.5 py-2.5">
                  <p className="text-sm text-text">{s.nome}</p>
                  <input
                    type="number"
                    min={1}
                    value={sel.quantidade}
                    onChange={(e) => mudarQuantidade(sel.servicoId, parseInt(e.target.value) || 1)}
                    className="h-8 w-14 rounded-lg border border-border bg-base px-2 text-center text-sm text-text"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium text-text">Total do pacote</span>
          <span className="text-lg font-medium text-accent">R$ {total.toFixed(0)}</span>
        </div>

        <Button type="submit" disabled={enviando || Object.keys(selecionados).length === 0} className="w-full">
          {enviando ? "Salvando..." : pacoteExistente ? "Salvar alterações" : "Salvar pacote"}
        </Button>
      </form>
    </Card>
  );
}
