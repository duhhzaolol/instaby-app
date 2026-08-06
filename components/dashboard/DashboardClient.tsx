"use client";

import { useState } from "react";
import { Users, UserPlus, Wallet, Clock, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { QuickAddTarefa } from "@/components/dashboard/QuickAddTarefa";
import { TarefaRow, TarefaRowData } from "@/components/dashboard/TarefaRow";
import { useOcultarValores, BotaoOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";

type Metrics = {
  clientesAtivos: number;
  leadsPendentes: number;
  faturamentoMes: number;
  cobrancasPendentesValor: number;
  cobrancasPendentesQtd: number;
  tarefasAbertas: number;
};

type Cliente = { id: string; nome: string };
type Tarefa = TarefaRowData & { clienteNome: string | null };

export default function DashboardClient({
  metrics,
  tarefas,
  clientes,
}: {
  metrics: Metrics;
  tarefas: Tarefa[];
  clientes: Cliente[];
}) {
  const { oculto, alternar } = useOcultarValores();
  const [verConcluidas, setVerConcluidas] = useState(false);

  const abertas = tarefas.filter((t) => t.status !== "feito");
  const concluidas = tarefas.filter((t) => t.status === "feito");

  const cards = [
    { label: "Clientes ativos", value: metrics.clientesAtivos, icon: Users, sensivel: false },
    { label: "Leads em aberto", value: metrics.leadsPendentes, icon: UserPlus, sensivel: false },
    { label: "Faturamento do mês", value: metrics.faturamentoMes, prefix: "R$ ", icon: Wallet, sensivel: true },
    {
      label: "Cobranças pendentes",
      value: metrics.cobrancasPendentesValor,
      prefix: "R$ ",
      icon: Clock,
      sensivel: true,
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
            <Card key={c.label} index={i} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted">{c.label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
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
          );
        })}
      </div>

      <QuickAddTarefa clientes={clientes} />

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
          <TarefaRow key={t.id} index={i} tarefa={t} clienteNome={t.clienteNome} />
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
                <TarefaRow key={t.id} index={i} tarefa={t} clienteNome={t.clienteNome} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
