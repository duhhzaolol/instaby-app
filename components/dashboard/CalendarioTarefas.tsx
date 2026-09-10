"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ExternalLink, Check } from "lucide-react";

export type TarefaCalendario = {
  id: string;
  titulo: string;
  categoria: string | null;
  categoriaLabel: string;
  clienteId: string | null;
  clienteNome: string | null;
  clienteCor: string | null;
  status: string;
  data: string; // YYYY-MM-DD
  hora: string | null;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioTarefas({
  dias,
  tarefasPorDia,
  mes,
  hojeChave,
}: {
  dias: string[];
  tarefasPorDia: Record<string, TarefaCalendario[]>;
  mes: number;
  hojeChave: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<TarefaCalendario | null>(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] = useState("a_fazer");
  const [salvando, setSalvando] = useState(false);

  function abrir(t: TarefaCalendario) {
    setEditando(t);
    setData(t.data);
    setHora(t.hora || "");
    setStatus(t.status);
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    await fetch(`/api/tarefas/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prazo: `${data}T${hora || "00:00"}:00-03:00`, status }),
    });
    setSalvando(false);
    setEditando(null);
    router.refresh();
  }

  async function marcarFeito() {
    if (!editando) return;
    setSalvando(true);
    await fetch(`/api/tarefas/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "feito" }),
    });
    setSalvando(false);
    setEditando(null);
    router.refresh();
  }

  async function excluir() {
    if (!editando) return;
    if (!confirm("Excluir esse item do cronograma?")) return;
    setSalvando(true);
    await fetch(`/api/tarefas/${editando.id}`, { method: "DELETE" });
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
            const tarefas = tarefasPorDia[chave] || [];
            const foraDoMes = d.getMonth() !== mes;
            const ehHoje = chave === hojeChave;

            return (
              <div
                key={chave}
                className={`min-h-[100px] border-b border-r border-border p-1.5 last:border-r-0 ${
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
                  {tarefas.slice(0, 3).map((t) => {
                    const cor = t.clienteCor || "#9CA3AF";
                    return (
                      <button
                        key={t.id}
                        onClick={() => abrir(t)}
                        className="truncate rounded px-1 py-0.5 text-left text-[10px] hover:opacity-80"
                        style={{ backgroundColor: `${cor}1A`, color: cor }}
                        title={t.titulo}
                      >
                        {t.titulo}
                      </button>
                    );
                  })}
                  {tarefas.length > 3 && <p className="text-[10px] text-muted">+{tarefas.length - 3} mais</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-text">{editando.titulo}</p>
              <button onClick={() => setEditando(null)} className="text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 flex items-center gap-1.5 text-xs text-muted">
              {editando.clienteNome && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: editando.clienteCor || "#9CA3AF" }} />
                  {editando.clienteNome} ·{" "}
                </>
              )}
              {editando.categoriaLabel}
            </p>

            <label className="mb-1 block text-xs text-muted">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mb-3 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
            />

            <label className="mb-1 block text-xs text-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mb-4 h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
            >
              <option value="a_fazer">A fazer</option>
              <option value="em_andamento">Em andamento</option>
              <option value="feito">Feito</option>
            </select>

            <div className="mb-3 flex gap-2">
              <button
                onClick={salvar}
                disabled={salvando}
                className="h-10 flex-1 rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              {editando.status !== "feito" && (
                <button
                  onClick={marcarFeito}
                  disabled={salvando}
                  className="flex h-10 items-center gap-1 rounded-lg border border-emerald-500/30 px-3 text-sm text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Check size={14} /> Feito
                </button>
              )}
              <button
                onClick={excluir}
                disabled={salvando}
                className="h-10 rounded-lg border border-red-500/30 px-3 text-sm text-red-400 hover:bg-red-500/10"
              >
                Excluir
              </button>
            </div>

            {editando.clienteId && (
              <Link
                href={`/dashboard/clientes/${editando.clienteId}?aba=tarefas`}
                className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-text"
              >
                <ExternalLink size={11} /> Ver detalhes completos
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
