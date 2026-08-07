"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

type Servico = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string;
  valorUnitario: number;
  clausulaContrato: string;
};

export default function EditarServicoForm({ servico }: { servico: Servico }) {
  const router = useRouter();
  const [nome, setNome] = useState(servico.nome);
  const [descricao, setDescricao] = useState(servico.descricao);
  const [categoria, setCategoria] = useState(servico.categoria);
  const [unidade, setUnidade] = useState(servico.unidade);
  const [valor, setValor] = useState(servico.valorUnitario);
  const [clausulaContrato, setClausulaContrato] = useState(servico.clausulaContrato);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch(`/api/servicos/${servico.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, categoria, unidade, valorUnitario: valor, clausulaContrato }),
    });

    setEnviando(false);
    router.push("/dashboard/servicos");
    router.refresh();
  }

  return (
    <Card hoverable={false} className="p-5">
      <form onSubmit={handleSubmit}>
        <Label>Nome</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} className="mb-4" />

        <Label>Descrição (aparece na proposta pro cliente)</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="mb-4" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} />
          </div>
        </div>

        <Label>Valor unitário</Label>
        <CurrencyInput value={valor} onChange={setValor} className="mb-4" />

        <Label>Texto pro contrato (opcional — se deixar em branco, usa a descrição)</Label>
        <Textarea
          value={clausulaContrato}
          onChange={(e) => setClausulaContrato(e.target.value)}
          rows={3}
          className="mb-6"
        />

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}
