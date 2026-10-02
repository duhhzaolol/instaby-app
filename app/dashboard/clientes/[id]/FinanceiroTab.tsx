"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CobrancaRow, CobrancaRowData } from "@/components/dashboard/CobrancaRow";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import { CATEGORIAS_RECEITA } from "@/lib/categoriasFinanceiras";

export default function FinanceiroTab({
  clienteId,
  cobrancas,
  despesas,
}: {
  clienteId: string;
  cobrancas: CobrancaRowData[];
  despesas: DespesaRowData[];
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [filtro, setFiltro] = useState("abertas");
  function aparece(status: string) { return filtro === "todas" || (filtro === "recebidas" ? status === "pago" : filtro === "canceladas" ? status === "cancelado" : !["pago", "cancelado"].includes(status)); }
  const cobrancasVisiveis = cobrancas.filter(c => aparece(calcularStatusEfetivo({ status: c.status, valor: c.valor, totalPago: c.totalPago || 0, vencimento: c.vencimento ? new Date(c.vencimento) : null })));
  const despesasVisiveis = despesas.filter(d => aparece(calcularStatusEfetivo({ status: d.status || "pago", valor: d.valor, totalPago: d.totalPago || 0, vencimento: d.vencimento ? new Date(d.vencimento) : null })));

  return (
    <div>
      <select aria-label="Filtrar lançamentos financeiros do cliente" value={filtro} onChange={e => setFiltro(e.target.value)} className="mb-4 h-10 rounded-xl border border-border bg-card px-3 text-sm text-text">
        <option value="abertas">Em aberto</option><option value="recebidas">Recebidos e pagos</option><option value="canceladas">Cancelados</option><option value="todas">Todos os lançamentos</option>
      </select>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted">Cobranças</p>
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Plus size={12} /> Lançar cobrança
        </button>
      </div>

      {formAberto && <NovaCobrancaForm clienteId={clienteId} onSalvo={(status) => { setFormAberto(false); setFiltro(status === "pago" ? "recebidas" : "abertas"); }} />}

      <div className="mb-6 flex flex-col gap-2">
        {cobrancasVisiveis.length === 0 && <p className="text-sm text-muted">Nenhuma cobrança nesse filtro.</p>}
        {cobrancasVisiveis.map((c, i) => (
          <CobrancaRow key={c.id} cobranca={c} index={i} />
        ))}
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Despesas</p>
      <div className="flex flex-col gap-2">
        {despesasVisiveis.length === 0 && <p className="text-sm text-muted">Nenhuma despesa nesse filtro.</p>}
        {despesasVisiveis.map((d, i) => (
          <DespesaRow key={d.id} despesa={d} index={i} />
        ))}
      </div>
    </div>
  );
}

function NovaCobrancaForm({ clienteId, onSalvo }: { clienteId: string; onSalvo: (status: string) => void }) {
  const router = useRouter();
  const [valor, setValor] = useState(0);
  const [tipo, setTipo] = useState("unica");
  const [categoria, setCategoria] = useState("Serviços");
  const [status, setStatus] = useState("pago");
  const [data, setData] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // O DatePicker é um botão, não um <input> nativo — não dá pra contar com
    // o "required" do HTML pra impedir envio sem data, então valida aqui.
    if (!data) {
      alert("Escolhe uma data.");
      return;
    }
    setEnviando(true); setErro("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}/cobrancas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, tipo, categoria, status, vencimento: data, dataCompetencia: data, data: status === "pago" ? data : undefined }),
      });
      if (!res.ok) { const resposta = await res.json().catch(() => null); setErro(resposta?.erro || "Não consegui criar a cobrança. Tente novamente."); return; }
      onSalvo(status); router.refresh();
    } catch { setErro("Não consegui criar a cobrança. Confira a conexão e tente novamente."); }
    finally { setEnviando(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-base/60 p-3">
      <p className="mb-2 text-[11px] text-muted">
        Use "Pago" com uma data passada pra lançar meses que você já recebeu.
      </p>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Valor</Label>
          <CurrencyInput value={valor} onChange={setValor} />
        </div>
        <div>
          <Label>Data</Label>
          <DatePicker value={data} onChange={setData} />
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <Label>Tipo</Label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="recorrente">Mensalidade deste mês</option>
            <option value="unica">Única</option>
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <Label>Categoria da receita</Label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          {CATEGORIAS_RECEITA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-[11px] text-muted">Este lançamento vale só para a data escolhida. A cobrança automática é configurada no Financeiro do cliente.</p>
      {erro && <p role="alert" className="mb-3 text-xs text-red-400">{erro}</p>}
      <Button type="submit" size="sm" disabled={enviando || valor <= 0} className="w-full">
        {enviando ? "Salvando..." : "Lançar cobrança"}
      </Button>
    </form>
  );
}
