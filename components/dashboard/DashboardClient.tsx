"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Wallet,
  Clock,
  CalendarClock,
  Target,
  TrendingUp,
  TrendingDown,
  FileSignature,
  FileText,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { QuickCommandCenter } from "@/components/dashboard/QuickCommandCenter";
import QuadroTarefas from "@/components/dashboard/QuadroTarefas";
import type { TarefaRowData } from "@/components/dashboard/TarefaRow";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { useOcultarValores, BotaoOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";

function compactar(v: number): string {
  const sinal = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sinal}${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sinal}${(abs / 1_000).toFixed(1).replace(".", ",")}K`;
  return `${sinal}${Math.round(abs).toLocaleString("pt-BR")}`;
}

function GraficoFaturamento({ dados, oculto }: { dados: { mes: string; valor: number }[]; oculto: boolean }) {
  const temDados = dados.some((d) => d.valor > 0);

  return (
    <Card hoverable={false} className="mb-6 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        Faturamento — últimos 6 meses
      </p>
      {oculto ? (
        <div className="flex h-[200px] items-center justify-center text-sm tracking-widest text-muted">
          ••••••••••
        </div>
      ) : !temDados ? (
        <p className="flex h-[200px] items-center justify-center text-center text-xs text-muted">
          Ainda sem cobranças pagas suficientes pra montar o gráfico.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dados} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-faturamento-dash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E63946" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E63946" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => compactar(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: "#E63946", strokeWidth: 1, strokeOpacity: 0.35 }}
              contentStyle={{ fontSize: 12, borderRadius: 10, background: "#1C2028", border: "1px solid rgba(255,255,255,.08)" }}
              labelStyle={{ color: "#9CA3AF", marginBottom: 2 }}
              formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Faturamento"]}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#E63946"
              strokeWidth={2}
              fill="url(#grad-faturamento-dash)"
              dot={{ r: 3, fill: "#E63946", stroke: "#1C2028", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#E63946", stroke: "#1C2028", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

type Metrics = {
  clientesAtivos: number;
  leadsPendentes: number;
  faturamentoMes: number;
  cobrancasPendentesValor: number;
  cobrancasPendentesQtd: number;
  tarefasAbertas: number;
};

type Cliente = { id: string; nome: string; cor: string | null };
type ClienteResumo = { id: string; nome: string; cor: string | null; totalTarefas: number; pendentes: number };
type Tarefa = TarefaRowData & { clienteNome: string | null; clienteCor: string | null };
type TarefaHoje = { id: string; titulo: string; categoria: string | null; prazo: string; clienteNome: string | null; clienteCor: string | null };
type Meta = { valor: number; atual: number };
type PerformanceCliente = { nome: string; cor: string | null; valor: number; percentual: number };
type Atividade = { id: string; texto: string; cliente: string; valor?: number; data: string; tipo: string };

const iconePorAtividade: Record<string, any> = {
  pagamento: Wallet,
  cliente: UserPlus,
  contrato: FileSignature,
  orcamento: FileText,
};
const corPorAtividade: Record<string, string> = {
  pagamento: "#22C55E",
  cliente: "#3B82F6",
  contrato: "#E63946",
  orcamento: "#A855F7",
};

function tempoRelativo(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  const mesmodia = data.toDateString() === hoje.toDateString();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (mesmodia) return `hoje, ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (data.toDateString() === ontem.toDateString()) return "ontem";
  return data.toLocaleDateString("pt-BR");
}

export default function DashboardClient({
  metrics,
  tarefas,
  clientes,
  clientesResumo,
  tarefasHoje,
  tarefasAmanha,
  meta,
  alertas,
  performancePorCliente,
  atividades,
  variacaoFaturamento,
  faturamentoPorMes,
}: {
  metrics: Metrics;
  tarefas: Tarefa[];
  clientes: Cliente[];
  clientesResumo: ClienteResumo[];
  tarefasHoje: TarefaHoje[];
  tarefasAmanha: TarefaHoje[];
  alertas: { label: string; contagem: number; href: string; cor: string }[];
  meta: Meta;
  performancePorCliente: PerformanceCliente[];
  atividades: Atividade[];
  variacaoFaturamento: number | null;
  faturamentoPorMes: { mes: string; valor: number }[];
}) {
  const { oculto, alternar } = useOcultarValores();

  const cards = [
    {
      label: "Clientes ativos",
      value: metrics.clientesAtivos,
      icon: Users,
      sensivel: false,
      href: "/dashboard/clientes?status=ativo",
      cor: "#3B82F6",
    },
    {
      label: "Leads em aberto",
      value: metrics.leadsPendentes,
      icon: UserPlus,
      sensivel: false,
      href: "/dashboard/clientes?status=lead",
      cor: "#A855F7",
    },
    {
      label: "Faturamento do mês",
      value: metrics.faturamentoMes,
      prefix: "R$ ",
      icon: Wallet,
      sensivel: true,
      href: "/dashboard/financeiro",
      cor: "#22C55E",
      delta: variacaoFaturamento,
    },
    {
      label: "Cobranças pendentes",
      value: metrics.cobrancasPendentesValor,
      prefix: "R$ ",
      icon: Clock,
      sensivel: true,
      href: "/dashboard/financeiro",
      cor: "#F59E0B",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <BotaoOcultarValores oculto={oculto} onClick={alternar} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}>
              <Card index={i} className="p-4 transition-shadow hover:shadow-glow">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-muted">{c.label}</p>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${c.cor}1A`, color: c.cor }}
                  >
                    <Icon size={14} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-medium text-text">
                    {c.sensivel ? (
                      <ValorSensivel oculto={oculto}>
                        <CountUp value={c.value} prefix={c.prefix} />
                      </ValorSensivel>
                    ) : (
                      <CountUp value={c.value} prefix={c.prefix} />
                    )}
                  </p>
                  {"delta" in c && c.delta !== null && c.delta !== undefined && !oculto && (
                    <span
                      className={`flex items-center gap-0.5 text-[11px] font-medium ${
                        c.delta >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {c.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(c.delta)}%
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <GraficoFaturamento dados={faturamentoPorMes} oculto={oculto} />

      {alertas.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
            <AlertTriangle size={14} className="text-amber-400" /> Precisa da sua atenção
          </p>
          <div className="flex flex-col gap-1.5">
            {alertas.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-hover"
              >
                <span className="text-text">{a.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${a.cor}1A`, color: a.cor }}
                >
                  {a.contagem}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {meta.valor > 0 && (
        <Card index={4} hoverable={false} className="mb-6 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <Target size={14} className="text-accent" /> Meta do mês
            </p>
            <p className="text-xs text-muted">
              <ValorSensivel oculto={oculto}>
                R$ {meta.atual.toFixed(0)} de R$ {meta.valor.toFixed(0)}
              </ValorSensivel>
              {" · "}
              {Math.min(100, Math.round((meta.atual / meta.valor) * 100))}%
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-base">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, (meta.atual / meta.valor) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      <QuickCommandCenter clientes={clientes} />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { label: "Nova tarefa", href: "/dashboard/tarefas" },
          { label: "Registrar horas", href: "/dashboard/horas" },
          { label: "Nova cobrança", href: "/dashboard/financeiro" },
          { label: "Nova despesa", href: "/dashboard/financeiro?nova=despesa" },
          { label: "Novo lead", href: "/dashboard/oportunidades" },
          { label: "Novo orçamento", href: "/dashboard/clientes" },
        ].map((atalho) => (
          <Link
            key={atalho.label}
            href={atalho.href}
            className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted hover:border-accent/30 hover:text-text"
          >
            + {atalho.label}
          </Link>
        ))}
      </div>

      {tarefasHoje.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
            <CalendarClock size={14} className="text-accent" /> Hoje
          </p>
          <div className="flex flex-col gap-2">
            {tarefasHoje.map((t) => {
              const { icone: Icon, cor } = visualDaCategoriaTarefa(t.categoria);
              const hora = new Date(t.prazo).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5"
                  style={t.clienteCor ? { borderLeft: `2px solid ${t.clienteCor}` } : undefined}
                >
                  <span className="w-12 shrink-0 text-xs font-medium text-muted">{hora}</span>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cor}1A`, color: cor }}
                  >
                    <Icon size={13} />
                  </div>
                  <p className="text-sm text-text">
                    {t.titulo}
                    {t.clienteNome && <span className="text-muted"> — {t.clienteNome}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tarefasAmanha.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
            <CalendarClock size={13} /> Amanhã
          </p>
          <div className="flex flex-col gap-2">
            {tarefasAmanha.map((t) => {
              const { icone: Icon, cor } = visualDaCategoriaTarefa(t.categoria);
              const hora = new Date(t.prazo).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/30 px-4 py-2.5 opacity-90"
                  style={t.clienteCor ? { borderLeft: `2px solid ${t.clienteCor}` } : undefined}
                >
                  <span className="w-12 shrink-0 text-xs font-medium text-muted">{hora}</span>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cor}1A`, color: cor }}
                  >
                    <Icon size={13} />
                  </div>
                  <p className="text-sm text-text">
                    {t.titulo}
                    {t.clienteNome && <span className="text-muted"> — {t.clienteNome}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <QuadroTarefas tarefas={tarefas} />

      {variacaoFaturamento !== null && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
            <Sparkles size={13} /> Insight Instaby
          </p>
          <p className="mb-1 text-lg font-medium text-text">
            {variacaoFaturamento >= 0
              ? `Seu faturamento cresceu ${variacaoFaturamento}% esse mês!`
              : `Seu faturamento caiu ${Math.abs(variacaoFaturamento)}% esse mês.`}
          </p>
          <p className="mb-3 text-sm text-muted">
            {variacaoFaturamento >= 0
              ? "Comparado ao mês anterior — confira o detalhe no Financeiro."
              : "Comparado ao mês anterior — vale dar uma olhada no que mudou."}
          </p>
          <Link href="/dashboard/financeiro" className="text-sm font-medium text-accent hover:underline">
            Ver Financeiro completo →
          </Link>
        </div>
      )}

      {(performancePorCliente.length > 0 || atividades.length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {performancePorCliente.length > 0 && (
            <Card hoverable={false} className="p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
                <TrendingUp size={14} className="text-accent" /> Performance por cliente
              </p>
              <div className="flex flex-col gap-2.5">
                {performancePorCliente.map((c) => (
                  <div key={c.nome}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.cor || "#9CA3AF" }} />
                        {c.nome}
                      </span>
                      <span className="text-muted">
                        <ValorSensivel oculto={oculto}>R$ {c.valor.toFixed(0)}</ValorSensivel>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-base">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.percentual}%`, backgroundColor: c.cor || "#E63946" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {atividades.length > 0 && (
            <Card hoverable={false} className="p-4">
              <p className="mb-3 text-sm font-medium text-text">Últimas atividades</p>
              <div className="flex flex-col gap-3">
                {atividades.map((a) => {
                  const Icon = iconePorAtividade[a.tipo] || Wallet;
                  const cor = corPorAtividade[a.tipo] || "#9CA3AF";
                  return (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${cor}1A`, color: cor }}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-text">
                          {a.texto} <span className="text-muted">— {a.cliente}</span>
                        </p>
                        <p className="text-[11px] text-muted">
                          {tempoRelativo(a.data)}
                          {a.valor !== undefined && (
                            <>
                              {" · "}
                              <ValorSensivel oculto={oculto}>R$ {a.valor.toFixed(0)}</ValorSensivel>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
