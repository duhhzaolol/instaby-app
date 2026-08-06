"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

export default function NovoServicoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Social media");
  const [unidade, setUnidade] = useState("mês");
  const [valor, setValor] = useState(0);
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
        valorUnitario: valor,
      }),
    });

    setEnviando(false);

    if (resposta.ok) {
      router.push("/dashboard/servicos");
      router.refresh();
    }
  }

  return (
    <div className="max-w-md">
      <p className="mb-5 text-lg font-medium text-text">Novo serviço</p>

      <Card hoverable={false} className="p-5">
        <form onSubmit={handleSubmit}>
          <Label>Nome</Label>
          <Input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Gestão de Instagram"
            className="mb-4"
          />

          <Label>Descrição (aparece na proposta pro cliente)</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Planejamento, criação e publicação de conteúdo..."
            className="mb-4"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="mês, reel, post..."
              />
            </div>
          </div>

          <Label>Valor unitário</Label>
          <CurrencyInput value={valor} onChange={setValor} className="mb-6" />

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando..." : "Salvar serviço"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
