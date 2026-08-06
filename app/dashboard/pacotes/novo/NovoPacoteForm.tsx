"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Servico = { id: string; nome: string; categoria: string; valorUnitario: number };
type Selecionado = { servicoId: string; quantidade: number };

export default function NovoPacoteForm({ servicos }: { servicos: Servico[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selecionados, setSelecionados] = useState<Record<string, Selecionado>>({});
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

  const total = Object.values(selecionados).reduce((soma, sel) => {
    const s = servicos.find((s) => s.id === sel.servicoId);
    return soma + (s ? s.valorUnitario * sel.quantidade : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch("/api/pacotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        descricao,
        itens: Object.values(selecionados),
      }),
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
                        ativo ? "bg-accent text-black" : "border border-border bg-card/60 text-muted hover:text-text"
                      }`}
                    >
                      {s.nome}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium text-text">Total do pacote</span>
          <span className="text-lg font-medium text-accent">R$ {total.toFixed(0)}</span>
        </div>

        <Button type="submit" disabled={enviando || Object.keys(selecionados).length === 0} className="w-full">
          {enviando ? "Salvando..." : "Salvar pacote"}
        </Button>
      </form>
    </Card>
  );
}
