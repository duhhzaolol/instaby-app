"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import {
  Wallet,
  Users,
  Repeat,
  Clock,
  TrendingUp,
  FileText,
  ListChecks,
  UserPlus,
  CheckSquare,
  FileCheck,
  CircleDollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";

type Metrics = {
  faturamentoMes: number;
  clientesAtivos: number;
  receitaRecorrente: number;
  cobrancasPendentesValor: number;
  cobrancasPendentesQtd: number;
  despesasMes: number;
  orcamentosPendentes: number;
  tarefasAbertas: number;
};

type TimelineItem = {
  tipo: "cliente" | "tarefa" | "orcamento" | "cobranca";
  texto: string;
  data: string;
};

const iconesTimeline: Record<TimelineItem["tipo"], any> = {
  cliente: UserPlus,
  tarefa: CheckSquare,
  orcamento: FileCheck,
  cobranca: CircleDollarSign,
};

const CORES_DONUT = ["#FACC15", "#3B82F6", "#4B5563"];

export default function DashboardClient({
  metrics,
  clientesPorStatus,
  receitaMensal,
  hoje,
  timeline,
}: {
  metrics: Metrics;
  clientesPorStatus: { name: string; value: number }[];
  receitaMensal: { mes: string; valor: number }[];
  hoje: { cobrancasVencendo: number; tarefasCriadas: number; orcamentosEnviados: number };
  timeline: TimelineItem[];
}) {
  const lucro = metrics.faturamentoMes - metrics.despesasMes;

  const cards = [
    {
      label: "Faturamento do mês",
      value: metrics.faturamentoMes,
      prefix: "R$ ",
      icon: Wallet,
    },
    {
      label: "Clientes ativos",
      value: metrics.clientesAtivos,
      icon: Users,
    },
    {
      label: "Receita recorrente",
      value: metrics.receitaRecorrente,
      prefix: "R$ ",
      icon: Repeat,
    },
    {
      label: "Cobranças pendentes",
      value: metrics.cobrancasPendentesValor,
      prefix: "R$ ",
      sub: `${metrics.cobrancasPendentesQtd} no total`,
      icon: Clock,
    },
    {
      label: "Lucro do mês",
      value: lucro,
      prefix: "R$ ",
      icon: TrendingUp,
    },
    {
      label: "Orçamentos pendentes",
      value: metrics.orcamentosPendentes,
      icon: FileText,
    },
    {
      label: "Tarefas em aberto",
      value: metrics.tarefasAbertas,
      icon: ListChecks,
    },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} index={i} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-muted">{c.label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-medium text-text">
                <CountUp value={c.value} prefix={c.prefix} />
              </p>
              {c.sub && <p className="mt-1 text-xs text-muted">{c.sub}</p>}
            </Card>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card index={7} hoverable={false} className="p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-text">Receita recebida — últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={receitaMensal} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="corReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FACC15" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FACC15" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="mes"
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: "#FACC15", strokeOpacity: 0.2 }}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#F9FAFB",
                }}
                formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#FACC15"
                strokeWidth={2}
                fill="url(#corReceita)"
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card index={8} hoverable={false} className="p-5">
          <p className="mb-4 text-sm font-medium text-text">Clientes por status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={clientesPorStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {clientesPorStatus.map((_, i) => (
                  <Cell key={i} fill={CORES_DONUT[i % CORES_DONUT.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#F9FAFB",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {clientesPorStatus.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CORES_DONUT[i % CORES_DONUT.length] }}
                />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card index={9} hoverable={false} className="p-5">
          <p className="mb-4 text-sm font-medium text-text">Hoje</p>
          <div className="flex flex-col gap-3">
            <LinhaHoje label="Cobranças vencendo" valor={hoje.cobrancasVencendo} />
            <LinhaHoje label="Tarefas criadas" valor={hoje.tarefasCriadas} />
            <LinhaHoje label="Orçamentos enviados" valor={hoje.orcamentosEnviados} />
          </div>
        </Card>

        <Card index={10} hoverable={false} className="p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-text">Atividade recente</p>
          {timeline.length === 0 && <p className="text-sm text-muted">Nada por aqui ainda.</p>}
          <div className="flex flex-col">
            {timeline.map((item, i) => {
              const Icon = iconesTimeline[item.tipo];
              const hora = new Date(item.data).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className="flex items-start gap-3 border-l border-border pb-4 pl-4 last:pb-0"
                  style={{ marginLeft: 6 }}
                >
                  <div className="absolute -ml-[27px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card ring-4 ring-base">
                    <Icon size={11} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">{hora}</p>
                    <p className="text-sm text-text">{item.texto}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LinhaHoje({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-base/60 px-3 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{valor}</span>
    </div>
  );
}
