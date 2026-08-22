"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { ServicoContratadoRow, ServicoContratadoData } from "@/components/dashboard/ServicoContratadoRow";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Servico = { id: string; nome: string; categoria: string; valorUnitario: number };
type Contratado = ServicoContratadoData & { servicoId: string };

export default function ServicosContratadosTab({
  clienteId,
  contratados,
  catalogo,
  descontoMensal,
  acrescimoMensal,
  prazoContratoMeses,
  valorRenovacao,
}: {
  clienteId: string;
  contratados: Contratado[];
  catalogo: Servico[];
  descontoMensal: number;
  acrescimoMensal: number;
  prazoContratoMeses: number | null;
  valorRenovacao: number | null;
}) {
  const router = useRouter();
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [editandoContrato, setEditandoContrato] = useState(false);
  const [desconto, setDesconto] = useState(descontoMensal);
  const [acrescimo, setAcrescimo] = useState(acrescimoMensal);
  const [prazo, setPrazo] = useState(prazoContratoMeses?.toString() || "");
  const [renovacao, setRenovacao] = useState(valorRenovacao || 0);
  const [salvando, setSalvando] = useState(false);

  const jaContratadosIds = new Set(contratados.map((c) => c.servicoId));
  const categorias = useMemo(() => Array.from(new Set(catalogo.map((s) => s.categoria))), [catalogo]);

  const totalServicos = contratados.reduce((soma, c) => soma + c.valor, 0);
  const mensalidadeFinal = Math.max(0, totalServicos - descontoMensal + acrescimoMensal);

  async function adicionar(servico: Servico) {
    setAdicionando(servico.id);
    await fetch(`/api/clientes/${clienteId}/servicos-contratados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicoId: servico.id, quantidade: 1, valor: servico.valorUnitario }),
    });
    setAdicionando(null);
    router.refresh();
  }

  async function salvarContrato() {
    setSalvando(true);
    await fetch(`/api/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descontoMensal: desconto,
        acrescimoMensal: acrescimo,
        prazoContratoMeses: prazo || null,
        valorRenovacao: renovacao || null,
      }),
    });
    setSalvando(false);
    setEditandoContrato(false);
    router.refresh();
  }

  const mostrarResumo = contratados.length > 0 || descontoMensal > 0 || acrescimoMensal > 0;

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Serviços contratados</p>

      <div className="mb-4 flex flex-col gap-2">
        {contratados.length === 0 && (
          <p className="text-sm text-muted">Nenhum serviço contratado ainda — adicione abaixo.</p>
        )}
        {contratados.map((c, i) => (
          <ServicoContratadoRow key={c.id} item={c} index={i} />
        ))}
      </div>

      {mostrarResumo && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          {editandoContrato ? (
            <div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <Label>Desconto mensal</Label>
                  <CurrencyInput value={desconto} onChange={setDesconto} />
                </div>
                <div>
                  <Label>Acréscimo mensal</Label>
                  <CurrencyInput value={acrescimo} onChange={setAcrescimo} />
                </div>
              </div>
              <p className="mb-3 text-[11px] text-muted">
                Use o acréscimo pra cobrir o que já foi combinado com o cliente mas ainda não virou serviço
                cadastrado aqui — vai somando ao total conforme você for detalhando os serviços de verdade.
              </p>
              <Label>Prazo do contrato (meses)</Label>
              <Input
                type="number"
                min={0}
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                placeholder="ex: 12"
                className="mb-3"
              />
              <Label>Valor após renovação (opcional)</Label>
              <CurrencyInput value={renovacao} onChange={setRenovacao} className="mb-3" />
              <div className="flex gap-2">
                <Button size="sm" onClick={salvarContrato} disabled={salvando} className="flex-1">
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditandoContrato(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted">Total dos serviços</span>
                <span className="text-sm text-text">R$ {totalServicos.toFixed(0)}</span>
              </div>
              {descontoMensal > 0 && (
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted">Desconto mensal</span>
                  <span className="text-sm text-red-400">− R$ {descontoMensal.toFixed(0)}</span>
                </div>
              )}
              {acrescimoMensal > 0 && (
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted">Acréscimo mensal</span>
                  <span className="text-sm text-emerald-400">+ R$ {acrescimoMensal.toFixed(0)}</span>
                </div>
              )}
              <div className="mb-3 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm font-medium text-text">Mensalidade final</span>
                <span className="text-lg font-medium text-accent">R$ {mensalidadeFinal.toFixed(0)}</span>
              </div>
              {(prazoContratoMeses || valorRenovacao) && (
                <p className="mb-2 text-xs text-muted">
                  {prazoContratoMeses && `Contrato de ${prazoContratoMeses} meses`}
                  {prazoContratoMeses && valorRenovacao && " · "}
                  {valorRenovacao && `renova por R$ ${valorRenovacao.toFixed(0)}`}
                </p>
              )}
              <button
                onClick={() => setEditandoContrato(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Pencil size={11} /> Ajustar desconto, acréscimo, prazo e renovação
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Adicionar do catálogo</p>
      {catalogo.length === 0 ? (
        <p className="text-sm text-muted">Cadastre serviços no catálogo primeiro.</p>
      ) : (
        categorias.map((cat) => (
          <div key={cat} className="mb-3">
            <p className="mb-1.5 text-[11px] text-muted">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {catalogo
                .filter((s) => s.categoria === cat)
                .map((s) => {
                  const jaTem = jaContratadosIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={jaTem || adicionando === s.id}
                      onClick={() => adicionar(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        jaTem
                          ? "cursor-default border border-border bg-transparent text-muted/40"
                          : "border border-border bg-card/60 text-muted hover:border-accent/30 hover:text-text"
                      }`}
                    >
                      {jaTem ? "✓ " : "+ "}
                      {s.nome}
                    </button>
                  );
                })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
