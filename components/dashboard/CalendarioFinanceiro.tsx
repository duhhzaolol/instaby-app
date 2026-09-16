"use client";

import { useState } from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

type Movimento = {
  dia: number;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  cliente: string | null;
};

export function CalendarioFinanceiro({
  movimentos,
  mes,
  ano,
}: {
  movimentos: Movimento[];
  mes: number; // 0-11
  ano: number;
}) {
  const { oculto } = useOcultarValores();
  const [diaAberto, setDiaAberto] = useState<number | null>(null);

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  const ehMesAtual = hoje.getMonth() === mes && hoje.getFullYear() === ano;

  const porDia: Record<number, Movimento[]> = {};
  movimentos.forEach((m) => {
    porDia[m.dia] ||= [];
    porDia[m.dia].push(m);
  });

  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const movimentosDoDia = diaAberto ? porDia[diaAberto] || [] : [];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted/70">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`vazio-${i}`} />;
          const movs = porDia[dia] || [];
          const entradas = movs.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0);
          const saidas = movs.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0);
          const temMovimento = movs.length > 0;
          const ehHoje = ehMesAtual && hoje.getDate() === dia;

          return (
            <button
              key={dia}
              disabled={!temMovimento}
              onClick={() => setDiaAberto(dia)}
              className={`flex min-h-[56px] flex-col items-center justify-start rounded-lg border p-1 text-left transition-colors ${
                ehHoje ? "border-accent/40" : "border-border"
              } ${temMovimento ? "bg-card/60 hover:border-accent/30 cursor-pointer" : "bg-transparent cursor-default"}`}
            >
              <span className={`mb-1 text-[11px] ${ehHoje ? "font-semibold text-accent" : "text-muted"}`}>{dia}</span>
              {entradas > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] leading-tight text-emerald-400">
                  <ArrowUpRight size={9} />
                  <ValorSensivel oculto={oculto}>{Math.round(entradas)}</ValorSensivel>
                </span>
              )}
              {saidas > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] leading-tight text-red-400">
                  <ArrowDownRight size={9} />
                  <ValorSensivel oculto={oculto}>{Math.round(saidas)}</ValorSensivel>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {diaAberto !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setDiaAberto(null)}
        >
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text">
                Dia {diaAberto} — {movimentosDoDia.length} movimentação{movimentosDoDia.length === 1 ? "" : "ões"}
              </p>
              <button onClick={() => setDiaAberto(null)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {movimentosDoDia.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border bg-base/60 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{m.descricao}</p>
                    {m.cliente && <p className="truncate text-xs text-muted">{m.cliente}</p>}
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      m.tipo === "entrada" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    <ValorSensivel oculto={oculto}>
                      {m.tipo === "entrada" ? "+" : "−"}R$ {m.valor.toFixed(0)}
                    </ValorSensivel>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
