"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CircleDollarSign, History, X, ExternalLink } from "lucide-react";

export type EventoAgenda = {
  id: string;
  tipo: "cobranca" | "tarefa" | "hora";
  texto: string;
  cor?: string | null;
  href: string;
  data: string; // YYYY-MM-DD
  hora?: string | null; // HH:mm — só tarefa
  horaInicio?: string | null; // só hora trabalhada
  horaFim?: string | null; // só hora trabalhada
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendaGrid({
  dias,
  eventosPorDia,
  mes,
  hojeChave,
}: {
  dias: string[];
  eventosPorDia: Record<string, EventoAgenda[]>;
  mes: number;
  hojeChave: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<EventoAgenda | null>(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [salvando, setSalvando] = useState(false);

  function abrir(e: EventoAgenda) {
    setEditando(e);
    setData(e.data);
    setHora(e.hora || "");
    setHoraInicio(e.horaInicio || "");
    setHoraFim(e.horaFim || "");
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);

    if (editando.tipo === "tarefa") {
      await fetch(`/api/tarefas/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prazo: `${data}T${hora || "00:00"}:00-03:00` }),
      });
    } else if (editando.tipo === "cobranca") {
      await fetch(`/api/cobrancas/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vencimento: `${data}T12:00:00-03:00` }),
      });
    } else if (editando.tipo === "hora") {
      await fetch(`/api/registros-tempo/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inicio: `${data}T${horaInicio}:00-03:00`,
          fim: horaFim ? `${data}T${horaFim}:00-03:00` : null,
        }),
      });
    }

    setSalvando(false);
    setEditando(null);
    router.refresh();
  }

  async function excluir() {
    if (!editando) return;
    if (!confirm("Excluir esse item?")) return;
    setSalvando(true);

    const rota =
      editando.tipo === "tarefa"
        ? `/api/tarefas/${editando.id}`
        : editando.tipo === "cobranca"
        ? `/api/cobrancas/${editando.id}`
        : `/api/registros-tempo/${editando.id}`;

    await fetch(rota, { method: "DELETE" });

    setSalvando(false);
    setEditando(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-card/40">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((chave) => {
            const d = new Date(chave + "T12:00:00");
            const eventos = eventosPorDia[chave] || [];
            const foraDoMes = d.getMonth() !== mes;
            const ehHoje = chave === hojeChave;

            return (
              <div
                key={chave}
                className={`min-h-[92px] border-b border-r border-border p-1.5 last:border-r-0 ${
                  foraDoMes ? "bg-black/20" : ""
                }`}
              >
                <span
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    ehHoje ? "bg-accent text-white" : foraDoMes ? "text-muted/40" : "text-muted"
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {eventos.slice(0, 3).map((e, i) => {
                    const estilo =
                      e.tipo === "cobranca"
                        ? { backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171" }
                        : e.tipo === "hora"
                        ? { backgroundColor: `${e.cor || "#22C55E"}1A`, color: e.cor || "#4ade80" }
                        : { backgroundColor: "rgba(56,189,248,0.1)", color: "#38bdf8" };
                    const IconeEvento = e.tipo === "cobranca" ? CircleDollarSign : e.tipo === "hora" ? History : Clock;
                    return (
                      <button
                        key={i}
                        onClick={() => abrir(e)}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] hover:opacity-80"
                        style={estilo}
                        title={e.texto}
                      >
                        <IconeEvento size={9} className="shrink-0" />
                        <span className="truncate">{e.texto}</span>
                      </button>
                    );
                  })}
                  {eventos.length > 3 && (
                    <p className="text-[10px] text-muted">+{eventos.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-text">{editando.texto}</p>
              <button onClick={() => setEditando(null)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            <label className="mb-1 block text-xs text-muted">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mb-3 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
            />

            {editando.tipo === "tarefa" && (
              <>
                <label className="mb-1 block text-xs text-muted">Horário (opcional)</label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="mb-3 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
                />
              </>
            )}

            {editando.tipo === "hora" && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">Início</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-base px-2 text-sm text-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Fim</label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-base px-2 text-sm text-text"
                  />
                </div>
              </div>
            )}

            <div className="mb-3 flex gap-2">
              <button
                onClick={salvar}
                disabled={salvando}
                className="h-10 flex-1 rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={excluir}
                disabled={salvando}
                className="h-10 rounded-lg border border-red-500/30 px-3 text-sm text-red-400 hover:bg-red-500/10"
              >
                Excluir
              </button>
            </div>

            <Link
              href={editando.href}
              className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-text"
            >
              <ExternalLink size={11} /> Ver detalhes completos
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
