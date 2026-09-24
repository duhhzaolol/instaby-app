"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Circle, PlayCircle, CheckCircle2, Trash2, Clock } from "lucide-react";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { formatarDuracao } from "@/lib/formatarDuracao";

export type TarefaQuadro = {
  id: string;
  titulo: string;
  status: string;
  categoria?: string | null;
  prazo?: string | null;
  clienteId?: string | null;
  clienteNome?: string | null;
  clienteCor?: string | null;
};

const COLUNAS = [
  { valor: "a_fazer", label: "A fazer", icone: Circle, cor: "#9CA3AF" },
  { valor: "em_andamento", label: "Em andamento", icone: PlayCircle, cor: "#38BDF8" },
  { valor: "feito", label: "Feito", icone: CheckCircle2, cor: "#22C55E" },
] as const;

const LIMITE_FEITO = 8;

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Cartão arrastável — HTML5 drag nativo (sem lib nova): o handle é o cartão inteiro,
// mas o clique de excluir tem seu próprio botão pra não conflitar com o arraste.
function CartaoTarefa({
  tarefa,
  arrastando,
  onDragStart,
  onDragEnd,
  onExcluir,
}: {
  tarefa: TarefaQuadro;
  arrastando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onExcluir: () => void;
}) {
  const { icone: Icon, cor } = visualDaCategoriaTarefa(tarefa.categoria);
  const urgencia = urgenciaPrazo(tarefa.prazo);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", tarefa.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-border bg-base/60 p-3 transition-all active:cursor-grabbing ${
        arrastando ? "opacity-30" : "hover:border-white/20 hover:shadow-premium"
      }`}
      style={tarefa.clienteCor ? { borderLeft: `2px solid ${tarefa.clienteCor}` } : undefined}
    >
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${cor}1A`, color: cor }}
        >
          <Icon size={11} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-text">{tarefa.titulo}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] text-muted">
            {tarefa.clienteNome && <span>{tarefa.clienteNome}</span>}
            {tarefa.prazo && (
              <span style={urgencia ? { color: urgencia.cor } : undefined}>
                {new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onExcluir}
          className="shrink-0 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

export default function QuadroTarefas({ tarefas }: { tarefas: TarefaQuadro[] }) {
  const router = useRouter();
  const [itens, setItens] = useState(tarefas);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<TarefaQuadro | null>(null);
  const [horaInicio, setHoraInicio] = useState(horaAtual());
  const [horaFim, setHoraFim] = useState(horaAtual());
  const [salvandoConclusao, setSalvandoConclusao] = useState(false);
  const [verTodasFeitas, setVerTodasFeitas] = useState(false);

  useEffect(() => setItens(tarefas), [tarefas]);

  async function aplicarStatus(id: string, status: string) {
    setItens((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function soltar(status: string) {
    setColunaSobre(null);
    if (!arrastandoId) return;
    const tarefa = itens.find((t) => t.id === arrastandoId);
    setArrastandoId(null);
    if (!tarefa || tarefa.status === status) return;

    // Marcar "feito" pelo drag pergunta sobre registrar horas, igual já acontecia na
    // lista antiga — só não faz isso pras outras colunas, que não têm esse gancho.
    if (status === "feito") {
      setConfirmando(tarefa);
      setHoraInicio(horaAtual());
      setHoraFim(horaAtual());
      return;
    }
    aplicarStatus(tarefa.id, status);
  }

  async function confirmarConclusao(registrarHoras: boolean) {
    if (!confirmando) return;
    setSalvandoConclusao(true);
    const tarefa = confirmando;

    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: "feito" } : t)));
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "feito" }),
    });

    if (registrarHoras && horaInicio && horaFim) {
      const hoje = new Date().toLocaleDateString("en-CA");
      await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividade: tarefa.titulo,
          clienteId: tarefa.clienteId || null,
          inicio: `${hoje}T${horaInicio}:00-03:00`,
          fim: `${hoje}T${horaFim}:00-03:00`,
        }),
      });
    }

    setSalvandoConclusao(false);
    setConfirmando(null);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir essa tarefa?")) return;
    setItens((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tarefas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const duracaoPrevia =
    horaInicio && horaFim
      ? (() => {
          const [h1, m1] = horaInicio.split(":").map(Number);
          const [h2, m2] = horaFim.split(":").map(Number);
          const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
          return minutos > 0 ? formatarDuracao(minutos / 60) : null;
        })()
      : null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          Afazeres <span className="font-normal text-muted">— arraste pra mudar o status</span>
        </p>
        <Link href="/dashboard/tarefas" className="text-xs text-muted hover:text-text">
          Ver tudo →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COLUNAS.map((coluna) => {
          const Icon = coluna.icone;
          const todasDaColuna = itens.filter((t) => t.status === coluna.valor);
          const daColuna =
            coluna.valor === "feito" && !verTodasFeitas ? todasDaColuna.slice(0, LIMITE_FEITO) : todasDaColuna;

          return (
            <div
              key={coluna.valor}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaSobre(coluna.valor);
              }}
              onDragLeave={() => setColunaSobre((atual) => (atual === coluna.valor ? null : atual))}
              onDrop={(e) => {
                e.preventDefault();
                soltar(coluna.valor);
              }}
              className={`rounded-2xl border p-3 transition-colors ${
                colunaSobre === coluna.valor ? "border-accent/50 bg-accent/5" : "border-border bg-card/40"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: coluna.cor }}>
                  <Icon size={13} /> {coluna.label}
                </p>
                <span className="rounded-full bg-base px-2 py-0.5 text-[10px] text-muted">{todasDaColuna.length}</span>
              </div>

              <div className="flex min-h-[64px] flex-col gap-2">
                {daColuna.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted">
                    {colunaSobre === coluna.valor ? "Solte aqui" : "Nada por aqui"}
                  </p>
                )}
                {daColuna.map((t) => (
                  <CartaoTarefa
                    key={t.id}
                    tarefa={t}
                    arrastando={arrastandoId === t.id}
                    onDragStart={() => setArrastandoId(t.id)}
                    onDragEnd={() => setArrastandoId(null)}
                    onExcluir={() => excluir(t.id)}
                  />
                ))}
                {coluna.valor === "feito" && todasDaColuna.length > LIMITE_FEITO && !verTodasFeitas && (
                  <button
                    onClick={() => setVerTodasFeitas(true)}
                    className="text-center text-[11px] text-muted hover:text-text"
                  >
                    + {todasDaColuna.length - LIMITE_FEITO} concluída(s) — ver todas
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <p className="mb-1 text-sm font-medium text-text">Marcar "{confirmando.titulo}" como feito</p>
            <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
              <Clock size={12} /> Já sabe o horário que você fez isso? Já registro nas Horas junto.
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Início</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Fim</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                />
              </div>
            </div>
            {duracaoPrevia && <p className="mb-3 text-xs text-muted">Vai registrar {duracaoPrevia} nas Horas.</p>}
            <div className="flex gap-2">
              <button
                onClick={() => confirmarConclusao(true)}
                disabled={salvandoConclusao || !horaInicio || !horaFim}
                className="h-9 flex-1 rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-40"
              >
                {salvandoConclusao ? "Salvando..." : "Marcar feito e registrar horas"}
              </button>
              <button
                onClick={() => confirmarConclusao(false)}
                disabled={salvandoConclusao}
                className="h-9 rounded-lg border border-border px-3 text-xs text-muted hover:text-text"
              >
                Só marcar feito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
