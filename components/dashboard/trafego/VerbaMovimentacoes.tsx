"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Check, PiggyBank, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { StatTile } from "@/components/ui/StatTile";

type Movimentacao = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  dataMovimento: string;
  criadoPorNome: string | null;
};
type Saldo = {
  temVerbaCadastrada: boolean;
  saldoInicial: number;
  totalAportes: number;
  totalDevolucoes: number;
  totalAjustes: number;
  totalSaldoTransportado: number;
  gastoAcumulado: number;
  saldoRestante: number;
  gastoHistorico: number;
  gastosPorMes: { mes: string; gasto: number }[];
  inicioControle: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  aporte: "Aporte",
  devolucao: "Devolução",
  ajuste: "Ajuste",
  saldo_transportado: "Saldo transportado do mês anterior",
};
// Só pra exibição — quem decide o sinal de verdade no saldo é o tipo, calculado no
// servidor (lib/trafego.ts calcularSaldoCliente). O valor em si é sempre gravado
// positivo (magnitude).
const TIPO_SOMA: Record<string, boolean> = { aporte: true, saldo_transportado: true, devolucao: false, ajuste: false };

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function NovaMovimentacaoForm({ clienteId, onSalvo }: { clienteId: string; onSalvo: () => void }) {
  const router = useRouter();
  const [tipo, setTipo] = useState("aporte");
  const [valor, setValor] = useState(0);
  const [dataMovimento, setDataMovimento] = useState(new Date().toLocaleDateString("en-CA"));
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!valor || valor <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    setEnviando(true);
    setErro("");
    const res = await fetch(`/api/clientes/${clienteId}/verba/movimentacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, valor, dataMovimento, descricao: descricao || null }),
    });
    setEnviando(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErro(json.erro || "Não consegui registrar essa movimentação. Tenta de novo.");
      return;
    }
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="mt-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova movimentação</p>
        <button type="button" onClick={onSalvo} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
      >
        {Object.entries(TIPO_LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l} ({TIPO_SOMA[v] ? "soma ao saldo" : "reduz o saldo"})
          </option>
        ))}
      </select>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <CurrencyInput value={valor} onChange={setValor} placeholder="Valor" />
        <DatePicker value={dataMovimento} onChange={setDataMovimento} placeholder="Data" />
      </div>
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        placeholder="Descrição (opcional) — ex: repasse de setembro via Pix"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
      />
      {erro && <p className="mb-2 text-[11px] text-red-400">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Registrar"}
      </button>
    </form>
  );
}

function EditarSaldoInicialForm({
  clienteId,
  saldoInicial,
  observacoes,
  inicioControle,
  onFechar,
}: {
  clienteId: string;
  saldoInicial: number;
  observacoes: string | null;
  inicioControle: string | null;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(saldoInicial);
  const [mesInicio, setMesInicio] = useState(inicioControle?.slice(0,7) || "");
  const [obs, setObs] = useState(observacoes || "");
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setEnviando(true);
    const res = await fetch(`/api/clientes/${clienteId}/verba`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saldoInicial: valor, observacoes: obs || null, inicioControle: mesInicio ? `${mesInicio}-01` : null }),
    });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui salvar o saldo inicial. Tenta de novo.");
      return;
    }
    onFechar();
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-2xl border border-accent/30 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Ajustar ponto de partida do controle</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <p className="mb-3 text-[11px] text-muted">
        Isso não é um aporte — é o valor de onde esse controle começa a contar (por exemplo, ao migrar de uma
        planilha). Pra dinheiro entrando ou saindo depois disso, use "Nova movimentação".
      </p>
      <label className="mb-3 block text-xs text-muted">Mês de início do controle<input aria-label="Mês de início do controle" type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"/><span className="mt-1 block">Com um mês definido, o saldo inicial começa nesse mês. Gastos e movimentações anteriores ficam no histórico e não entram nesse saldo.</span></label>
      <div className="mb-3">
        <CurrencyInput value={valor} onChange={setValor} placeholder="Saldo inicial" />
      </div>
      <textarea
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
      />
      <button
        onClick={salvar}
        disabled={enviando}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        <Check size={14} /> {enviando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

export function VerbaMovimentacoes({
  clienteId,
  saldoInicial,
  observacoesVerba,
  inicioControle,
  movimentacoes,
  saldo,
}: {
  clienteId: string;
  clienteNome: string;
  saldoInicial: number;
  observacoesVerba: string | null;
  inicioControle: string | null;
  movimentacoes: Movimentacao[];
  saldo: Saldo;
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoSaldoInicial, setEditandoSaldoInicial] = useState(false);

  return (
    <div>
      <p className="mb-4 rounded-xl border border-border bg-card/60 p-3 text-xs text-muted">Cadastre aqui o dinheiro destinado aos anúncios do cliente. Essa verba é separada do contrato e da mensalidade da agência. Use “Cadastrar saldo inicial e mês” para começar o controle; depois registre os repasses em “Nova movimentação”.</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile icone={<PiggyBank size={12} style={{ color: "#0D9488" }} />} label="Saldo inicial" valor={fmtMoeda(saldo.saldoInicial)} index={0} />
        <StatTile icone={<ArrowUpCircle size={12} style={{ color: "#22C55E" }} />} label="Aportes" valor={fmtMoeda(saldo.totalAportes)} index={1} />
        <StatTile icone={<ArrowDownCircle size={12} style={{ color: "#E63946" }} />} label="Devoluções + ajustes" valor={fmtMoeda(saldo.totalDevolucoes + saldo.totalAjustes)} index={2} />
        <StatTile icone={<TrendingDown size={12} style={{ color: "#E63946" }} />} label="Gasto desde o início do controle" valor={fmtMoeda(saldo.gastoAcumulado)} index={3} />
      </div>

      <div className="mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className={saldo.saldoRestante < 0 ? "text-red-400" : "text-accent"} />
            <p className="text-sm font-medium text-text">Saldo restante</p>
          </div>
          <p className={`text-xl font-semibold ${saldo.saldoRestante < 0 ? "text-red-400" : "text-text"}`}>
            {saldo.temVerbaCadastrada ? fmtMoeda(saldo.saldoRestante) : "Cadastre a verba"}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Saldo inicial + aportes + saldo transportado − devoluções − ajustes − gasto acumulado. Esse é o controle
          interno da verba, não uma consulta ao saldo dentro da própria Meta.
        </p>
        <p className="mt-1 text-xs text-muted">{inicioControle ? `Controle a partir de ${dataBr(inicioControle)}.` : "Sem mês inicial definido: considera todo o histórico registrado."}</p>
        <details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Ver origem dos gastos por mês</summary>{saldo.gastosPorMes.map((m) => <p key={m.mes}>{m.mes} · {fmtMoeda(m.gasto)}</p>)}</details>
        {saldo.totalSaldoTransportado > 0 && (
          <p className="mt-1 text-[11px] text-muted">
            Inclui {fmtMoeda(saldo.totalSaldoTransportado)} de saldo transportado de meses anteriores.
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/30 bg-accent/5 py-2.5 text-xs font-medium text-accent hover:bg-accent/10"
        >
          <Plus size={13} /> Nova movimentação
        </button>
        <button
          onClick={() => setEditandoSaldoInicial((v) => !v)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs text-muted hover:text-text"
        >
          <Pencil size={12} /> Cadastrar saldo inicial e mês
        </button>
      </div>
      {formAberto && <NovaMovimentacaoForm clienteId={clienteId} onSalvo={() => setFormAberto(false)} />}
      {editandoSaldoInicial && (
        <EditarSaldoInicialForm
          clienteId={clienteId}
          saldoInicial={saldoInicial}
          observacoes={observacoesVerba}
          inicioControle={inicioControle}
          onFechar={() => setEditandoSaldoInicial(false)}
        />
      )}

      <p className="mb-2 mt-5 text-sm font-medium text-text">Extrato</p>
      {movimentacoes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
          Nenhuma movimentação registrada ainda pra esse cliente.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {movimentacoes.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text">
                  {TIPO_LABEL[m.tipo] || m.tipo} · {dataBr(m.dataMovimento)}
                </p>
                {m.descricao && <p className="text-[11px] text-muted">{m.descricao}</p>}
                {m.criadoPorNome && <p className="text-[11px] text-muted/70">Registrado por {m.criadoPorNome}</p>}
              </div>
              <p className={`text-sm font-medium ${TIPO_SOMA[m.tipo] ? "text-emerald-400" : "text-red-400"}`}>
                {TIPO_SOMA[m.tipo] ? "+" : "−"} {fmtMoeda(m.valor)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
