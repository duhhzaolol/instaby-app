"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function paraIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  limpavel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  limpavel?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dataSelecionada = value ? new Date(value + "T12:00:00") : null;
  const [mesVisto, setMesVisto] = useState(() => dataSelecionada || new Date());

  useEffect(() => {
    if (dataSelecionada) setMesVisto(dataSelecionada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const ano = mesVisto.getFullYear();
  const mes = mesVisto.getMonth();
  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0);
  const inicioGrade = new Date(inicioMes);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
  const fimGrade = new Date(fimMes);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

  const dias: Date[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) dias.push(new Date(d));

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function selecionar(d: Date) {
    onChange(paraIso(d));
    setAberto(false);
  }

  return (
    <div className={`relative ${className || ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-left text-sm text-text"
      >
        <CalendarIcon size={14} className="shrink-0 text-muted" />
        {dataSelecionada ? (
          <span className="flex-1">{dataSelecionada.toLocaleDateString("pt-BR")}</span>
        ) : (
          <span className="flex-1 text-muted/70">{placeholder || "Selecionar data"}</span>
        )}
        {limpavel && value && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="text-muted hover:text-text"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute z-50 mt-1.5 w-64 rounded-2xl border border-border bg-card p-3 shadow-premium-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMesVisto(new Date(ano, mes - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
            >
              <ChevronLeft size={14} />
            </button>
            <p className="text-xs font-medium text-text">
              {NOMES_MESES[mes]} {ano}
            </p>
            <button
              type="button"
              onClick={() => setMesVisto(new Date(ano, mes + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="text-center text-[10px] text-muted">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {dias.map((d, i) => {
              const foraDoMes = d.getMonth() !== mes;
              const ehHoje = d.getTime() === hoje.getTime();
              const ehSelecionado = dataSelecionada && d.toDateString() === dataSelecionada.toDateString();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selecionar(d)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors ${
                    ehSelecionado
                      ? "bg-accent font-medium text-white"
                      : ehHoje
                      ? "border border-accent/50 text-accent"
                      : foraDoMes
                      ? "text-muted/30 hover:bg-hover"
                      : "text-text hover:bg-hover"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => selecionar(new Date())}
            className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs text-muted hover:bg-hover hover:text-text"
          >
            Hoje
          </button>
        </div>
      )}
    </div>
  );
}
