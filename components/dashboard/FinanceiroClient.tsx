"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CountUp } from "@/components/ui/CountUp";
import { CobrancaRow, CobrancaRowData } from "@/components/dashboard/CobrancaRow";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";

type Cliente = { id: string; nome: string };
type CobrancaPendente = CobrancaRowData & { cliente: string };

export default function FinanceiroClient({
  resumo,
  grafico,
  cobrancasPendentes,
  despesasRecentes,
  clientes,
}: {
  resumo: { entradas: number; saidas: number; lucro: number };
  grafico: { mes: string; entradas: number; saidas: number; lucro: number }[];
  cobrancasPendentes: CobrancaPendente[];
  despesasRecentes: DespesaRowData[];
  clientes: Cliente[];
}) {
  const [formAberto, setFormAberto] = useState(false);

  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Financeiro</p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card index={0} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Entradas (6 meses)</p>
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
            <p className="text-xs text-muted">Saídas (6 meses)</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.saidas} prefix="R$ " />
          </p>
        </Card>
        <Card index={2} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted">Lucro (6 meses)</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Wallet size={14} />
            </div>
          </div>
          <p className="text-2xl font-medium text-text">
            <CountUp value={resumo.lucro} prefix="R$ " />
          </p>
        </Card>
      </div>

      <Card index={3} hoverable={false} className="mb-6 p-5">
        <p className="mb-4 text-sm font-medium text-text">Entradas x Saídas por mês</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={grafico} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                color: "#F9FAFB",
              }}
              formatter={(v: number, nome: string) => [
                `R$ ${v.toLocaleString("pt-BR")}`,
                nome === "entradas" ? "Entradas" : "Saídas",
              ]}
            />
            <Bar dataKey="entradas" fill="#FACC15" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey="saidas" fill="#374151" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card index={4} hoverable={false} className="mb-6 p-5">
        <p className="mb-4 text-sm font-medium text-text">Lucro por mês</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={grafico} margin={{ left: -20, right: 8, top: 8 }}>
            <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                color: "#F9FAFB",
              }}
              formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Lucro"]}
            />
            <Line
              type="monotone"
              dataKey="lucro"
              stroke="#FACC15"
              strokeWidth={2}
              dot={{ fill: "#FACC15", r: 3 }}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card index={5} hoverable={false} className="p-5">
          <p className="mb-4 text-sm font-medium text-text">Cobranças pendentes</p>
          <div className="flex flex-col gap-2">
            {cobrancasPendentes.length === 0 && (
              <p className="text-sm text-muted">Nada pendente — tudo em dia.</p>
            )}
            {cobrancasPendentes.map((c, i) => (
              <CobrancaRow key={c.id} cobranca={c} index={i} clienteNome={c.cliente} />
            ))}
          </div>
        </Card>

        <Card index={6} hoverable={false} className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Despesas recentes</p>
            <button
              onClick={() => setFormAberto((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Nova
            </button>
          </div>

          {formAberto && <NovaDespesaForm clientes={clientes} onSalvo={() => setFormAberto(false)} />}

          <div className="flex flex-col gap-2">
            {despesasRecentes.length === 0 && (
              <p className="text-sm text-muted">Nenhuma despesa registrada ainda.</p>
            )}
            {despesasRecentes.map((d, i) => (
              <DespesaRow key={d.id} despesa={d} index={i} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NovaDespesaForm({ clientes, onSalvo }: { clientes: Cliente[]; onSalvo: () => void }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch("/api/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, valor, clienteId: clienteId || null, data }),
    });

    setEnviando(false);

    if (resposta.ok) {
      setDescricao("");
      setValor(0);
      setClienteId("");
      setData(new Date().toISOString().slice(0, 10));
      onSalvo();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-base/60 p-3">
      <Label>Descrição</Label>
      <Input
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Freela de edição"
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
        {enviando ? "Salvando..." : "Salvar despesa"}
      </Button>
    </form>
  );
}
