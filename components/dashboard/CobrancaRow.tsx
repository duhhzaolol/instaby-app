"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { diaFinanceiro, formatarDataFinanceira, mesFinanceiro } from "@/lib/datasFinanceiro";
import { calcularStatusEfetivo, LABEL_STATUS_EFETIVO } from "@/lib/statusFinanceiro";

const toneEfetivo: Record<string, "green" | "red" | "yellow" | "gray" | "blue"> = {
  pago: "green",
  atrasado: "red",
  pendente: "yellow",
  parcial: "blue",
  cancelado: "gray",
};

function dinheiro(valor: number) { return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export type CobrancaRowData = {
  id: string;
  valor: number;
  status: string;
  tipo: string;
  categoria?: string | null;
  vencimento: string | null;
  totalPago?: number;
  clienteId?: string;
  dataCompetencia?: string | null;
  createdAt?: string;
  competencia?: string;
  recorrenciaChave?: string | null;
};

export function CobrancaRow({
  cobranca,
  index,
  clienteNome,
  clienteId = cobranca.clienteId,
}: {
  cobranca: CobrancaRowData;
  index: number;
  clienteNome?: string;
  clienteId?: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [lancandoBaixa, setLancandoBaixa] = useState(false);
  const [valorBaixa, setValorBaixa] = useState(0);
  const [valor, setValor] = useState(cobranca.valor);
  const [tipo, setTipo] = useState(cobranca.tipo);
  const [status, setStatus] = useState(cobranca.status);
  const [vencimento, setVencimento] = useState(cobranca.vencimento ? diaFinanceiro(cobranca.vencimento) : "");
  const [salvando, setSalvando] = useState(false);

  const totalPago = cobranca.totalPago || 0;
  const saldo = Math.max(0, cobranca.valor - totalPago);
  const statusEfetivo = calcularStatusEfetivo({
    status: cobranca.status,
    valor: cobranca.valor,
    totalPago,
    vencimento: cobranca.vencimento ? new Date(cobranca.vencimento) : null,
  });

  async function enviar(dados: Record<string, unknown>, caminho = `/api/cobrancas/${cobranca.id}`, method = "PATCH") {
    setSalvando(true);
    try {
      const res = await fetch(caminho, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
      if (!res.ok) { const resposta = await res.json().catch(() => null); alert(resposta?.erro || "Não consegui salvar. Seu lançamento foi mantido."); return false; }
      router.refresh(); return true;
    } catch { alert("Não consegui salvar. Confira a conexão e tente novamente."); return false; }
    finally { setSalvando(false); }
  }

  async function salvar() {
    if (await enviar({ valor, tipo, status, vencimento: vencimento || null })) setEditando(false);
  }

  async function marcarPago() {
    await enviar({ status: "pago" });
  }

  async function lancarBaixa() {
    if (valorBaixa <= 0) return;
    if (await enviar({ valor: valorBaixa }, `/api/cobrancas/${cobranca.id}/pagamentos`, "POST")) {
      setValorBaixa(0); setLancandoBaixa(false);
    }
  }

  async function excluir() {
    if (!confirm(cobranca.recorrenciaChave ? "Cancelar essa mensalidade automática? O histórico será preservado." : "Excluir essa cobrança? Lançamentos com pagamentos registrados serão preservados.")) return;
    await enviar({}, `/api/cobrancas/${cobranca.id}`, "DELETE");
  }

  const competencia = cobranca.competencia || (cobranca.dataCompetencia || cobranca.vencimento || cobranca.createdAt ? mesFinanceiro(cobranca.dataCompetencia || cobranca.vencimento || cobranca.createdAt!) : "");

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <div className="mb-2 grid grid-cols-2 gap-2">
          <CurrencyInput value={valor} onChange={setValor} />
          <DatePicker value={vencimento} onChange={setVencimento} />
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="mb-2 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="recorrente">Mensalidade deste mês</option>
          <option value="unica">Única</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-1 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Recebido</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <p className="mb-3 text-[11px] text-muted">
          "Atrasado" não se escolhe mais aqui — o sistema calcula sozinho quando o vencimento passa e ainda tem saldo.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando} className="flex-1">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card index={index} hoverable={false} className="p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm text-text">
            {clienteNome && <>{clienteId ? <Link href={`/dashboard/clientes/${clienteId}?aba=financeiro`} className="hover:underline">{clienteNome}</Link> : clienteNome} · </>}R$ {dinheiro(cobranca.valor)}
          </p>
          <p className="text-xs text-muted">
            {cobranca.tipo === "recorrente" ? "Mensalidade" : "Única"}
            {competencia && ` · ${competencia.split("-").reverse().join("/")}`}
            {cobranca.tipo === "recorrente" && ` · ${cobranca.recorrenciaChave ? "Automática" : cobranca.categoria?.trim().toLowerCase() === "mensalidade" ? "Recorrente anterior" : "Manual"}`}
            {cobranca.vencimento && ` · vence ${formatarDataFinanceira(cobranca.vencimento)}`}
            {totalPago > 0 && ` · recebido R$ ${dinheiro(totalPago)}`}
            {totalPago > 0 && saldo > 0 && statusEfetivo !== "cancelado" && `, saldo R$ ${dinheiro(saldo)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={toneEfetivo[statusEfetivo]}>{LABEL_STATUS_EFETIVO[statusEfetivo]}</Badge>
          {statusEfetivo !== "pago" && statusEfetivo !== "cancelado" && (
            <Link
              href={`/dashboard/financeiro/cobrancas/${cobranca.id}/resumo`}
              target="_blank"
              title="Ver resumo pra enviar pro cliente"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <FileText size={11} /> Resumo
            </Link>
          )}
          {statusEfetivo !== "pago" && statusEfetivo !== "cancelado" && (
            <button onClick={() => setLancandoBaixa((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              <Plus size={11} /> Baixa
            </button>
          )}
          {statusEfetivo !== "pago" && statusEfetivo !== "cancelado" && (
            <button disabled={salvando} title="Receber o saldo restante hoje" onClick={marcarPago} className="text-xs font-medium text-accent hover:underline">
              Tudo pago
            </button>
          )}
          <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
            <Pencil size={13} />
          </button>
          {statusEfetivo !== "pago" && totalPago <= 0 && <button disabled={salvando} title={cobranca.recorrenciaChave ? "Cancelar mensalidade automática" : "Excluir cobrança sem pagamentos"} onClick={excluir} className="text-muted hover:text-red-400">
            <Trash2 size={13} />
          </button>}
        </div>
      </div>
      {lancandoBaixa && (
        <div className="flex items-center gap-2 border-t border-border p-3">
          <CurrencyInput value={valorBaixa} onChange={setValorBaixa} className="flex-1" />
          <Button size="sm" onClick={lancarBaixa} disabled={salvando || valorBaixa <= 0 || valorBaixa > saldo}>
            Lançar baixa
          </Button>
        </div>
      )}
    </Card>
  );
}
