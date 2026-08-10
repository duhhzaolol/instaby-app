"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Wallet, Clock, ChevronDown, CalendarClock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { QuickCommandCenter } from "@/components/dashboard/QuickCommandCenter";
import { TarefaRow, TarefaRowData } from "@/components/dashboard/TarefaRow";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { useOcultarValores, BotaoOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";

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

export default function DashboardClient({
  metrics,
  tarefas,
  clientes,
  clientesResumo,
  tarefasHoje,
}: {
  metrics: Metrics;
  tarefas: Tarefa[];
  clientes: Cliente[];
  clientesResumo: ClienteResumo[];
  tarefasHoje: TarefaHoje[];
}) {
  const { oculto, alternar } = useOcultarValores();
  const [verConcluidas, setVerConcluidas] = useState(false);

  const abertas = tarefas.filter((t) => t.status !== "feito");
  const concluidas = tarefas.filter((t) => t.status === "feito");

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
                <p className="text-xl font-medium text-text">
                  {c.sensivel ? (
                    <ValorSensivel oculto={oculto}>
                      <CountUp value={c.value} prefix={c.prefix} />
                    </ValorSensivel>
                  ) : (
                    <CountUp value={c.value} prefix={c.prefix} />
                  )}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      <QuickCommandCenter clientes={clientes} />

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

      {clientesResumo.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <Users size={14} className="text-accent" /> Clientes ativos
            </p>
            <Link href="/dashboard/clientes" className="flex items-center gap-1 text-xs text-muted hover:text-text">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {clientesResumo.map((c) => (
              <Link key={c.id} href={`/dashboard/clientes/${c.id}`}>
                <Card hoverable={false} className="p-3 transition-colors hover:bg-hover">
                  <span
                    className="mb-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.cor || "#9CA3AF" }}
                  />
                  <p className="truncate text-xs font-medium text-text">{c.nome}</p>
                  <p className="text-[11px] text-muted">
                    {c.totalTarefas} tarefas
                    {c.pendentes > 0 && <span className="text-accent"> · {c.pendentes} pendente{c.pendentes > 1 ? "s" : ""}</span>}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          Afazeres <span className="text-muted">({abertas.length})</span>
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {abertas.length === 0 && (
          <p className="text-sm text-muted">Nada pendente — capriche no cafezinho ☕</p>
        )}
        {abertas.map((t, i) => (
          <TarefaRow key={t.id} index={i} tarefa={t} clienteNome={t.clienteNome} clienteCor={t.clienteCor} />
        ))}
      </div>

      {concluidas.length > 0 && (
        <div>
          <button
            onClick={() => setVerConcluidas((v) => !v)}
            className="mb-3 flex items-center gap-1 text-xs font-medium text-muted hover:text-text"
          >
            <ChevronDown size={13} className={verConcluidas ? "rotate-180 transition-transform" : "transition-transform"} />
            Concluídas ({concluidas.length})
          </button>
          {verConcluidas && (
            <div className="flex flex-col gap-2 opacity-60">
              {concluidas.map((t, i) => (
                <TarefaRow key={t.id} index={i} tarefa={t} clienteNome={t.clienteNome} clienteCor={t.clienteCor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
