"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { FORMATOS_CONTEUDO } from "@/lib/conteudoVisual";

type Servico = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string;
  valorUnitario: number;
  clausulaContrato: string;
  formatoConteudo?: string | null;
};

export default function EditarServicoForm({ servico }: { servico: Servico }) {
  const router = useRouter();
  const [nome, setNome] = useState(servico.nome);
  const [descricao, setDescricao] = useState(servico.descricao);
  const [categoria, setCategoria] = useState(servico.categoria);
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((servicos: { categoria: string }[]) => {
        setCategoriasExistentes(Array.from(new Set(servicos.map((s) => s.categoria))).sort());
      });
  }, []);
  const [unidade, setUnidade] = useState(servico.unidade);
  const [valor, setValor] = useState(servico.valorUnitario);
  const [clausulaContrato, setClausulaContrato] = useState(servico.clausulaContrato);
  const [formatoConteudo, setFormatoConteudo] = useState(servico.formatoConteudo || "");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch(`/api/servicos/${servico.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, categoria, unidade, valorUnitario: valor, clausulaContrato, formatoConteudo }),
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
            <Input list="categorias-existentes" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            <datalist id="categorias-existentes">
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Unidade</Label>
            <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} />
          </div>
        </div>

        <Label>Valor unitário</Label>
        <CurrencyInput value={valor} onChange={setValor} className="mb-4" />

        <Label>Formato de conteúdo (opcional)</Label>
        <select
          value={formatoConteudo}
          onChange={(e) => setFormatoConteudo(e.target.value)}
          className="mb-1 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="">Não é um formato de conteúdo (ex: reunião, orçamento)</option>
          {FORMATOS_CONTEUDO.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.label}
            </option>
          ))}
        </select>
        <p className="mb-4 text-xs text-muted">
          Se esse serviço é tipo "8 Reels por mês", liga ele ao formato "Reel" — assim o Escopo
          mensal do cliente sabe comparar contratado x entregue automaticamente.
        </p>

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
