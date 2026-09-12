"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Repeat, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIAS_FINANCEIRAS, STATUS_DESPESA, visualDaCategoriaFinanceira } from "@/lib/categoriasFinanceiras";
import { calcularStatusEfetivo, LABEL_STATUS_EFETIVO, COR_STATUS_EFETIVO } from "@/lib/statusFinanceiro";

export type DespesaRowData = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  cliente?: string | null;
  recorrente?: boolean;
  categoriaFinanceira?: string | null;
  categoria?: string | null;
  status?: string | null;
  vencimento?: string | null;
  totalPago?: number;
};

const STATUS_EDITAVEL = STATUS_DESPESA.filter((s) => s.valor !== "atrasado");

export function DespesaRow({ despesa, index }: { despesa: DespesaRowData; index: number }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [lancandoBaixa, setLancandoBaixa] = useState(false);
  const [valorBaixa, setValorBaixa] = useState(0);
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [valor, setValor] = useState(despesa.valor);
  const [data, setData] = useState(despesa.data.slice(0, 10));
  const [categoriaFinanceira, setCategoriaFinanceira] = useState(despesa.categoriaFinanceira || "");
  const [categoria, setCategoria] = useState(despesa.categoria || "");
  const [status, setStatus] = useState(despesa.status || "pago");
  const [vencimento, setVencimento] = useState(despesa.vencimento?.slice(0, 10) || "");
  const [salvando, setSalvando] = useState(false);

  const infoCategoria = visualDaCategoriaFinanceira(despesa.categoriaFinanceira);
  const infoCategoriaEditando = visualDaCategoriaFinanceira(categoriaFinanceira);

  const totalPago = despesa.totalPago || 0;
  const saldo = Math.max(0, despesa.valor - totalPago);
  const statusEfetivo = calcularStatusEfetivo({
    status: despesa.status || "pago",
    valor: despesa.valor,
    totalPago,
    vencimento: despesa.vencimento ? new Date(despesa.vencimento) : null,
  });
  const corStatus = COR_STATUS_EFETIVO[statusEfetivo];

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/despesas/${despesa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        valor,
        data,
        categoriaFinanceira: categoriaFinanceira || null,
        categoria: categoria || null,
        status,
        vencimento: status === "pendente" ? vencimento || null : null,
        dataPagamento: status === "pago" ? data : null,
      }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  async function lancarBaixa() {
    if (valorBaixa <= 0) return;
    await fetch(`/api/despesas/${despesa.id}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: valorBaixa }),
    });
    setValorBaixa(0);
    setLancandoBaixa(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir essa despesa?")) return;
    await fetch(`/api/despesas/${despesa.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mb-2" />

        <div className="mb-2 grid grid-cols-2 gap-2">
          <select
            value={categoriaFinanceira}
            onChange={(e) => {
              setCategoriaFinanceira(e.target.value);
              setCategoria("");
            }}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="">Sem classificação</option>
            {CATEGORIAS_FINANCEIRAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            list="sugestoes-editar"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria"
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          />
          <datalist id="sugestoes-editar">
            {infoCategoriaEditando?.sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            {STATUS_EDITAVEL.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
          {status === "pendente" && (
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              title="Vencimento"
              className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
            />
          )}
        </div>
        <p className="mb-2 text-[11px] text-muted">
          "Atrasado" não se escolhe mais aqui — calculado sozinho quando o vencimento passa e ainda tem saldo.
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <CurrencyInput value={valor} onChange={setValor} />
          <div>
            <label className="mb-1 block text-[10px] text-muted">Competência</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
            />
          </div>
        </div>
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
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-text">
            {despesa.descricao}
            {despesa.recorrente && (
              <span title="Recorrente — repete todo mês sozinha">
                <Repeat size={11} className="text-accent" />
              </span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {despesa.cliente && `${despesa.cliente} · `}
            {new Date(despesa.data).toLocaleDateString("pt-BR")}
            {despesa.categoria ? (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px]"
                style={{ backgroundColor: `${infoCategoria?.cor || "#9CA3AF"}1A`, color: infoCategoria?.cor || "#9CA3AF" }}
              >
                {despesa.categoria}
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">Sem categoria</span>
            )}
            {statusEfetivo !== "pago" && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${corStatus}1A`, color: corStatus }}
              >
                {LABEL_STATUS_EFETIVO[statusEfetivo]}
                {despesa.vencimento && ` · vence ${new Date(despesa.vencimento).toLocaleDateString("pt-BR")}`}
                {totalPago > 0 && saldo > 0 && ` · pago R$ ${totalPago.toFixed(0)}, saldo R$ ${saldo.toFixed(0)}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-text">R$ {despesa.valor.toFixed(0)}</span>
          {statusEfetivo !== "pago" && statusEfetivo !== "cancelado" && (
            <button onClick={() => setLancandoBaixa((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              <Plus size={11} /> Baixa
            </button>
          )}
          <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
            <Pencil size={13} />
          </button>
          <button onClick={excluir} className="text-muted hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {lancandoBaixa && (
        <div className="flex items-center gap-2 border-t border-border p-3">
          <CurrencyInput value={valorBaixa} onChange={setValorBaixa} className="flex-1" />
          <Button size="sm" onClick={lancarBaixa} disabled={valorBaixa <= 0}>
            Lançar baixa
          </Button>
        </div>
      )}
    </Card>
  );
}
