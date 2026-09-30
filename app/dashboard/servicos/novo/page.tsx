"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";

export default function NovoServicoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Social media");
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [unidade, setUnidade] = useState("mês");
  const [valor, setValor] = useState(0);
  const [clausulaContrato, setClausulaContrato] = useState("");
  const [categoriaTarefa, setCategoriaTarefa] = useState("");
  const [templatesCiclo, setTemplatesCiclo] = useState<{ id: string; nome: string; totalEtapas: number }[]>([]);
  const [templateRotinaId, setTemplateRotinaId] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/servicos")
      .then((r) => r.json())
      .then((servicos: { categoria: string }[]) => {
        setCategoriasExistentes(Array.from(new Set(servicos.map((s) => s.categoria))).sort());
      });
    // Etapa 4 (v158) — só templates em modo "ciclo completo" (com etapas) fazem
    // sentido aqui: um template "checklist simples" nunca gera nada sozinho (ver
    // garantirRotinasMensaisDoMes em lib/garantirRecorrentes.ts).
    fetch("/api/templates-tarefas/opcoes")
      .then((r) => r.json())
      .then((templates: { id: string; nome: string; temCiclo: boolean; totalEtapas: number }[]) => {
        setTemplatesCiclo(
          (Array.isArray(templates) ? templates : [])
            .filter((t) => t.temCiclo)
            .map((t) => ({ id: t.id, nome: t.nome, totalEtapas: t.totalEtapas }))
        );
      });
  }, []);

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
        clausulaContrato,
        categoriaTarefa: categoriaTarefa || null,
        templateRotinaId: templateRotinaId || null,
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
              <Input
                list="categorias-existentes"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
              <datalist id="categorias-existentes">
                {categoriasExistentes.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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
          <CurrencyInput value={valor} onChange={setValor} className="mb-4" />

          <Label>Texto pro contrato (opcional — se deixar em branco, usa a descrição acima)</Label>
          <Textarea
            value={clausulaContrato}
            onChange={(e) => setClausulaContrato(e.target.value)}
            rows={3}
            placeholder="Ex: A Instaby ficará responsável pela gestão de conteúdo do Instagram do cliente, incluindo planejamento e publicação."
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
            "Entregas" do cliente (ex: "Reels" → Criar Reel). Deixe em branco pra serviços sem entrega
            contável, como consultoria ou gestão de tráfego.
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
            {enviando ? "Salvando..." : "Salvar serviço"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
