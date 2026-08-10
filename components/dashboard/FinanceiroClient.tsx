"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, AlertTriangle, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CountUp } from "@/components/ui/CountUp";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";

type Cliente = { id: string; nome: string };
type CobrancaPendente = {
  id: string;
  cliente: string;
  clienteWhatsapp: string | null;
  valor: number;
  status: string;
  vencimento: string | null;
};

const PERIODOS = [
  { valor: "mes_atual", label: "Este mês" },
  { valor: "mes_anterior", label: "Mês anterior" },
  { valor: "3m", label: "Últimos 3 meses" },
  { valor: "6m", label: "Últimos 6 meses" },
];

function diasParaVencer(vencimento: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FinanceiroClient({
  periodo,
  resumo,
  grafico,
  cobrancasPendentes,
  custosFixos,
  custosFlexiveis,
  clientes,
}: {
  periodo: string;
  resumo: { entradas: number; despesasFixas: number; despesasFlexiveis: number; lucro: number };
  grafico: { mes: string; entradas: number; despesasFixas: number; despesasFlexiveis: number }[];
  cobrancasPendentes: CobrancaPendente[];
  custosFixos: DespesaRowData[];
  custosFlexiveis: DespesaRowData[];
  clientes: Cliente[];
}) {
  const router = useRouter();
  const [formAberto, setFormAberto] = useState<"fixa" | "flexivel" | null>(null);

  function mudarPeriodo(novo: string) {
    router.push(`/dashboard/financeiro?periodo=${novo}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-medium text-text">Financeiro</p>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              onClick={() => mudarPeriodo(p.valor)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de cobranças vencendo/vencidas */}
      {cobrancasPendentes.some((c) => c.vencimento && diasParaVencer(c.vencimento) <= 0) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-text">Tem cobrança vencendo hoje ou atrasada</p>
            <p className="text-xs text-muted">Confira a lista de pendentes embaixo e considera lembrar o cliente.</p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card index={0} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Entradas</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.entradas} prefix="R$ " />
          </p>
        </Card>
        <Card index={1} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Custos fixos</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.despesasFixas} prefix="R$ " />
          </p>
        </Card>
        <Card index={2} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Custos flexíveis</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.despesasFlexiveis} prefix="R$ " />
          </p>
        </Card>
        <Card index={3} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Lucro</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Wallet size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.lucro} prefix="R$ " />
          </p>
        </Card>
      </div>

      <Card index={4} hoverable={false} className="mb-6 p-5">
        <p className="mb-4 text-sm font-medium text-text">Entradas x Custos fixos x Custos flexíveis</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={grafico} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#1C2028",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                color: "#F9FAFB",
              }}
              formatter={(v: number, nome: string) => [
                `R$ ${v.toLocaleString("pt-BR")}`,
                nome === "entradas" ? "Entradas" : nome === "despesasFixas" ? "Custos fixos" : "Custos flexíveis",
              ]}
            />
            <Legend
              formatter={(v) => (v === "entradas" ? "Entradas" : v === "despesasFixas" ? "Custos fixos" : "Custos flexíveis")}
              wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }}
            />
            <Line type="monotone" dataKey="entradas" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="despesasFixas" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="despesasFlexiveis" stroke="#E63946" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card index={5} hoverable={false} className="mb-6 p-5">
        <p className="mb-4 text-sm font-medium text-text">Cobranças pendentes</p>
        <div className="flex flex-col gap-2">
          {cobrancasPendentes.length === 0 && <p className="text-sm text-muted">Nada pendente — tudo em dia.</p>}
          {cobrancasPendentes.map((c) => {
            const dias = c.vencimento ? diasParaVencer(c.vencimento) : null;
            const vencido = dias !== null && dias < 0;
            const venceHoje = dias === 0;
            const linkWhatsapp = c.clienteWhatsapp
              ? `https://wa.me/${c.clienteWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  dias === null
                    ? `Oi ${c.cliente}! Passando pra falar sobre o pagamento em aberto.`
                    : vencido
                    ? `Oi ${c.cliente}! Passando pra lembrar que seu boleto está atrasado há ${Math.abs(dias)} dia(s).`
                    : venceHoje
                    ? `Oi ${c.cliente}! Passando pra lembrar que seu boleto vence hoje.`
                    : `Oi ${c.cliente}! Passando pra lembrar que seu boleto vencerá em ${dias} dia(s).`
                )}`
              : null;

            return (
              <div
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 ${
                  vencido || venceHoje ? "bg-red-500/5" : "bg-base/60"
                }`}
              >
                <div>
                  <p className="text-sm text-text">
                    {c.cliente} · R$ {c.valor.toFixed(0)}
                  </p>
                  <p className={`text-xs ${vencido || venceHoje ? "text-red-400" : "text-muted"}`}>
                    {dias === null
                      ? "sem data"
                      : vencido
                      ? `atrasado há ${Math.abs(dias)} dia(s)`
                      : venceHoje
                      ? "vence hoje"
                      : `faltam ${dias} dia(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.status === "atrasado" || vencido ? "red" : "yellow"}>
                    {c.status === "atrasado" ? "Atrasado" : "Pendente"}
                  </Badge>
                  {linkWhatsapp && (
                    <a
                      href={linkWhatsapp}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <MessageCircle size={12} /> Lembrar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card index={6} hoverable={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Custos operacionais</p>
              <p className="text-xs text-muted">Aluguel, água, luz, internet, ferramentas...</p>
            </div>
            <button
              onClick={() => setFormAberto(formAberto === "fixa" ? null : "fixa")}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Novo
            </button>
          </div>
          {formAberto === "fixa" && (
            <NovaDespesaForm tipo="fixa" clientes={clientes} onSalvo={() => setFormAberto(null)} />
          )}
          <div className="flex flex-col gap-2">
            {custosFixos.length === 0 && <p className="text-sm text-muted">Nenhum custo fixo lançado ainda.</p>}
            {custosFixos.map((d, i) => (
              <DespesaRow key={d.id} despesa={d} index={i} />
            ))}
          </div>
        </Card>

        <Card index={7} hoverable={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Custos flexíveis</p>
              <p className="text-xs text-muted">Retiradas avulsas — material, equipamento, comida...</p>
            </div>
            <button
              onClick={() => setFormAberto(formAberto === "flexivel" ? null : "flexivel")}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Novo
            </button>
          </div>
          {formAberto === "flexivel" && (
            <NovaDespesaForm tipo="flexivel" clientes={clientes} onSalvo={() => setFormAberto(null)} />
          )}
          <div className="flex flex-col gap-2">
            {custosFlexiveis.length === 0 && <p className="text-sm text-muted">Nenhum custo flexível lançado ainda.</p>}
            {custosFlexiveis.map((d, i) => (
              <DespesaRow key={d.id} despesa={d} index={i} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NovaDespesaForm({
  tipo,
  clientes,
  onSalvo,
}: {
  tipo: "fixa" | "flexivel";
  clientes: Cliente[];
  onSalvo: () => void;
}) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch("/api/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, valor, clienteId: clienteId || null, data, tipo }),
    });

    setEnviando(false);
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-base/60 p-3">
      <Label>Descrição</Label>
      <Input
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder={tipo === "fixa" ? "Aluguel, internet, ferramenta..." : "Papel, equipamento, comida..."}
        className="mb-2"
      />
      <div className="mb-2 grid grid-cols-2 gap-2">
        <CurrencyInput value={valor} onChange={setValor} />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        />
      </div>
      <select
        value={clienteId}
        onChange={(e) => setClienteId(e.target.value)}
        className="mb-2 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
      >
        <option value="">Sem cliente</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={enviando || valor <= 0} className="w-full">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
