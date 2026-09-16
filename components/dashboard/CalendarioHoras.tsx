"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RegistroTempoRow, RegistroTempoData } from "@/components/dashboard/RegistroTempoRow";
import { formatarDuracao } from "@/lib/formatarDuracao";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

type Cliente = { id: string; nome: string };

export function CalendarioHoras({
  dias,
  registrosPorDia,
  totaisPorDia,
  mes,
  hojeChave,
  clientes,
  corPadrao,
}: {
  dias: string[];
  registrosPorDia: Record<string, RegistroTempoData[]>;
  totaisPorDia: Record<string, { horas: number; cor: string | null }>;
  mes: number;
  hojeChave: string;
  clientes: Cliente[];
  corPadrao?: string | null;
}) {
  const [diaAberto, setDiaAberto] = useState<string | null>(null);

  const registrosDoDiaAberto = diaAberto ? registrosPorDia[diaAberto] || [] : [];

  function fmtDataLegivel(chave: string) {
    const d = new Date(chave + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-card/40">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="px-2 py-2 text-center text-[11px] font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((chave) => {
            const d = new Date(chave + "T12:00:00");
            const info = totaisPorDia[chave];
            const foraDoMes = d.getMonth() !== mes;
            const ehHoje = chave === hojeChave;
            const cor = corPadrao || info?.cor || "#E63946";
            const temRegistro = (registrosPorDia[chave] || []).length > 0;

            return (
              <button
                key={chave}
                onClick={() => temRegistro && setDiaAberto(chave)}
                disabled={!temRegistro}
                className={`min-h-[64px] border-b border-r border-border p-1.5 text-left last:border-r-0 ${
                  foraDoMes ? "bg-black/20" : ""
                } ${temRegistro ? "cursor-pointer hover:bg-hover" : "cursor-default"}`}
              >
                <span
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    ehHoje ? "bg-accent text-white" : foraDoMes ? "text-muted/40" : "text-muted"
                  }`}
                >
                  {d.getDate()}
                </span>
                {info && info.horas > 0 && (
                  <p className="rounded px-1 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${cor}1A`, color: cor }}>
                    {formatarDuracao(info.horas)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {diaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDiaAberto(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-text">{fmtDataLegivel(diaAberto)}</p>
              <button onClick={() => setDiaAberto(null)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {registrosDoDiaAberto
                .slice()
                .sort((a, b) => a.inicio.localeCompare(b.inicio))
                .map((r, i) => (
                  <RegistroTempoRow key={r.id} index={i} registro={r} clientes={clientes} />
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
