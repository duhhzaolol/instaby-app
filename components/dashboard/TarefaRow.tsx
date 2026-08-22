"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { visualDaCategoriaTarefa, PRIORIDADES } from "@/lib/categoriaTarefaVisual";
import { formatarDuracao } from "@/lib/formatarDuracao";

export type TarefaRowData = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  prazo?: string | null;
  categoria?: string | null;
  descricao?: string | null;
  prioridade?: string | null;
  clienteId?: string | null;
};

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TarefaRow({
  tarefa,
  index,
  clienteNome,
  clienteCor,
}: {
  tarefa: TarefaRowData;
  index: number;
  clienteNome?: string | null;
  clienteCor?: string | null;
}) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [descricao, setDescricao] = useState(tarefa.descricao || "");
  const [data, setData] = useState(tarefa.prazo ? tarefa.prazo.slice(0, 10) : "");
  const [hora, setHora] = useState(tarefa.prazo ? tarefa.prazo.slice(11, 16) : "");
  const [prioridade, setPrioridade] = useState(tarefa.prioridade || "");
  const [salvando, setSalvando] = useState(false);

  const [confirmandoConclusao, setConfirmandoConclusao] = useState(false);
  const [horaInicioConclusao, setHoraInicioConclusao] = useState("");
  const [horaFimConclusao, setHoraFimConclusao] = useState(horaAtual());
  const [registrandoConclusao, setRegistrandoConclusao] = useState(false);

  const prazoVencido = tarefa.prazo && tarefa.status !== "feito" && new Date(tarefa.prazo) < new Date();
  const { icone: Icon, cor } = visualDaCategoriaTarefa(tarefa.categoria);
  const prioridadeInfo = PRIORIDADES.find((p) => p.valor === tarefa.prioridade);

  const duracaoPrevia =
    horaInicioConclusao && horaFimConclusao
      ? (() => {
          const [h1, m1] = horaInicioConclusao.split(":").map(Number);
          const [h2, m2] = horaFimConclusao.split(":").map(Number);
          const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
          return minutos > 0 ? formatarDuracao(minutos / 60) : null;
        })()
      : null;

  async function mudarStatus(status: string) {
    if (status === "feito" && tarefa.status !== "feito") {
      setConfirmandoConclusao(true);
      return;
    }
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function confirmarConclusao(registrarHoras: boolean) {
    setRegistrandoConclusao(true);

    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "feito" }),
    });

    if (registrarHoras && horaInicioConclusao && horaFimConclusao) {
      const hoje = new Date().toISOString().slice(0, 10);
      await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividade: tarefa.titulo,
          clienteId: tarefa.clienteId || null,
          inicio: `${hoje}T${horaInicioConclusao}:00`,
          fim: `${hoje}T${horaFimConclusao}:00`,
        }),
      });
    }

    setRegistrandoConclusao(false);
    setConfirmandoConclusao(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir essa tarefa?")) return;
    setExcluindo(true);
    await fetch(`/api/tarefas/${tarefa.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function salvarDetalhe() {
    setSalvando(true);
    const prazo = data ? `${data}T${hora || "00:00"}:00` : null;
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao: descricao || null, prazo, prioridade: prioridade || null }),
    });
    setSalvando(false);
    setDetalheAberto(false);
    router.refresh();
  }

  return (
    <Card
      index={index}
      hoverable={false}
      className="overflow-hidden p-0"
      style={clienteCor ? { borderLeft: `2px solid ${clienteCor}` } : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setDetalheAberto((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${cor}1A`, color: cor }}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text">{tarefa.titulo}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              {clienteNome && <span>{clienteNome}</span>}
              {prioridadeInfo && <span>{prioridadeInfo.label}</span>}
              {tarefa.prazo ? (
                <span className={prazoVencido ? "text-red-400" : ""}>
                  {new Date(tarefa.prazo).toLocaleDateString("pt-BR")}
                  {tarefa.prazo.slice(11, 16) !== "00:00" && ` · ${tarefa.prazo.slice(11, 16)}`}
                </span>
              ) : (
                <span>Sem prazo</span>
              )}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <select
            value={tarefa.status}
            onChange={(e) => mudarStatus(e.target.value)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              tarefa.status === "feito"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : tarefa.status === "em_andamento"
                ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                : "border-white/10 bg-white/5 text-muted"
            }`}
          >
            <option value="a_fazer">A fazer</option>
            <option value="em_andamento">Em andamento</option>
            <option value="feito">Feito</option>
          </select>
          <button onClick={excluir} disabled={excluindo} className="text-muted hover:text-red-400">
            <Trash2 size={13} />
          </button>
          <ChevronDown
            size={14}
            className={`text-muted transition-transform ${detalheAberto ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {confirmandoConclusao && (
        <div className="border-t border-accent/20 bg-accent/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent">
            <Clock size={12} /> Já sabe o horário que você fez isso? Já registro nas Horas junto.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Início</label>
              <input
                type="time"
                value={horaInicioConclusao}
                onChange={(e) => setHoraInicioConclusao(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Fim</label>
              <input
                type="time"
                value={horaFimConclusao}
                onChange={(e) => setHoraFimConclusao(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
              />
            </div>
          </div>
          {duracaoPrevia && <p className="mb-3 text-xs text-muted">Vai registrar {duracaoPrevia} nas Horas.</p>}
          <div className="flex gap-2">
            <button
              onClick={() => confirmarConclusao(true)}
              disabled={registrandoConclusao || !horaInicioConclusao || !horaFimConclusao}
              className="h-9 flex-1 rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-40"
            >
              {registrandoConclusao ? "Salvando..." : "Marcar feito e registrar horas"}
            </button>
            <button
              onClick={() => confirmarConclusao(false)}
              disabled={registrandoConclusao}
              className="h-9 rounded-lg border border-border px-3 text-xs text-muted hover:text-text"
            >
              Só marcar feito
            </button>
          </div>
        </div>
      )}

      {detalheAberto && (
        <div className="border-t border-border bg-base/40 p-4">
          <label className="mb-1 block text-xs text-muted">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Detalhes da tarefa..."
            className="mb-3 w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
          />
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Horário</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
              >
                <option value="">—</option>
                {PRIORIDADES.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={salvarDetalhe}
            disabled={salvando}
            className="h-9 w-full rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar detalhes"}
          </button>
        </div>
      )}
    </Card>
  );
}
