"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";

type Servico = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string;
  valorUnitario: number;
  clausulaContrato: string;
  categoriaTarefa: string;
  templateRotinaId: string;
};

export default function EditarServicoForm({ servico }: { servico: Servico }) {
  const router = useRouter();
  const [nome, setNome] = useState(servico.nome);
  const [descricao, setDescricao] = useState(servico.descricao);
  const [categoria, setCategoria] = useState(servico.categoria);
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [categoriaTarefa, setCategoriaTarefa] = useState(servico.categoriaTarefa);
  const [templatesCiclo, setTemplatesCiclo] = useState<{ id: string; nome: string; totalEtapas: number }[]>([]);
  const [templateRotinaId, setTemplateRotinaId] = useState(servico.templateRotinaId);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((servicos: { categoria: string }[]) => {
        setCategoriasExistentes(Array.from(new Set(servicos.map((s) => s.categoria))).sort());
      });
    // Etapa 4 (v158) — ver comentário equivalente em app/dashboard/servicos/novo/page.tsx.
    fetch("/api/templates-tarefas/opcoes")
      .then((r) => r.json())
      .then((templates: { id: string; nome: string; temCiclo: boolean; totalEtapas: number }[]) => {
        setTemplatesCiclo(
          (Array.isArray(templates) ? templates : [])
            // Sempre inclui o template já ligado (mesmo que tenha perdido as etapas
            // depois), pra nunca fazer a seleção salva sumir sozinha do <select>.
            .filter((t) => t.temCiclo || t.id === servico.templateRotinaId)
            .map((t) => ({ id: t.id, nome: t.nome, totalEtapas: t.totalEtapas }))
        );
      });
  }, []);
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
      body: JSON.stringify({
        nome,
        descricao,
        categoria,
        unidade,
        valorUnitario: valor,
        clausulaContrato,
        categoriaTarefa: categoriaTarefa || null,
        templateRotinaId: templateRotinaId || null,
      }),
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

        <Label>Texto pro contrato (opcional — se deixar em branco, usa a descrição)</Label>
        <Textarea
          value={clausulaContrato}
          onChange={(e) => setClausulaContrato(e.target.value)}
          rows={3}
          className="mb-4"
        />

        <Label>Categoria de entrega (controle mensal de produção)</Label>
        <Select value={categoriaTarefa} onChange={(e) => setCategoriaTarefa(e.target.value)} className="mb-1.5">
          <option value="">— Não rastreia entregas —</option>
          {CATEGORIAS_TAREFA.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.label}
            </option>
          ))}
        </Select>
        <p className="mb-6 text-[11px] leading-relaxed text-muted">
          Opcional. Só preencha se esse serviço tiver uma quantidade mensal pra acompanhar na aba
          "Entregas" do cliente (ex: "Reels" → Criar Reel).
        </p>

        <Label>Rotina mensal automática</Label>
        {templatesCiclo.length === 0 ? (
          <p className="mb-6 text-[11px] leading-relaxed text-muted">
            Nenhum template em modo "ciclo completo" cadastrado ainda — crie um em Configurações →
            Templates de tarefas pra poder ligar aqui.
          </p>
        ) : (
          <>
            <Select value={templateRotinaId} onChange={(e) => setTemplateRotinaId(e.target.value)} className="mb-1.5">
              <option value="">— Nenhuma —</option>
              {templatesCiclo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.totalEtapas} etapas)
                </option>
              ))}
            </Select>
            <p className="mb-6 text-[11px] leading-relaxed text-muted">
              Opcional. Quando marcado, todo cliente com esse serviço contratado (ativo) ganha esse
              ciclo de tarefas gerado sozinho todo mês — prazo calculado a partir do último dia do mês.
              Pausa por cliente em Clientes → ficha → Serviços.
            </p>
          </>
        )}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}
