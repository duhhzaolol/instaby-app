"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

function horaAtualStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [hora, minuto] = value ? value.split(":") : ["", ""];

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  function definir(h: string, m: string) {
    onChange(`${h}:${m}`);
  }

  const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutos = ["00", "10", "15", "20", "30", "40", "45", "50"];

  return (
    <div className={`relative ${className || ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-left text-sm text-text"
      >
        <Clock size={14} className="shrink-0 text-muted" />
        {value ? <span className="flex-1">{value}</span> : <span className="flex-1 text-muted/70">{placeholder || "Horário"}</span>}
      </button>

      {aberto && (
        <div className="absolute z-50 mt-1.5 flex w-48 gap-1 rounded-2xl border border-border bg-card p-2 shadow-premium-lg">
          <div className="max-h-48 flex-1 overflow-y-auto">
            {horas.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => definir(h, minuto || "00")}
                className={`w-full rounded-lg px-2 py-1 text-left text-sm ${
                  hora === h ? "bg-accent text-white" : "text-text hover:bg-hover"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="max-h-48 flex-1 overflow-y-auto">
            {minutos.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  definir(hora || horaAtualStr().split(":")[0], m);
                  setAberto(false);
                }}
                className={`w-full rounded-lg px-2 py-1 text-left text-sm ${
                  minuto === m ? "bg-accent text-white" : "text-text hover:bg-hover"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
