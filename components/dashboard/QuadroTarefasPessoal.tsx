"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardDrive, Play, Inbox, Check, Clock, ChevronDown } from "lucide-react";
import { COLUNAS, LIMITE_FEITO, TarefaQuadro } from "@/components/dashboard/QuadroTarefas";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { formatarDuracao } from "@/lib/formatarDuracao";
import { ChecklistTarefa, type ChecklistItemData } from "@/components/dashboard/ChecklistTarefa";

// Quadro Kanban "pessoal" — mesmo estilo visual de components/dashboard/QuadroTarefas.tsx
// (cores/ícones/colunas importados de lá, nunca redefinidos aqui), usado no Início do
// Editor e do Tráfego (redesign v144, Parte 3). Diferença pro quadro genérico: aqui a
// coluna "A fazer" mistura tarefas sem dono (disponíveis pra qualquer um pegar) com as
// já assumidas por essa pessoa, e os cartões têm ações específicas — pegar pra mim,
// iniciar (assume + liga o cronômetro, igual ao antigo botão "Iniciar" da fila pessoal)
// e marcar como feito (com a mesma opção de registrar horas do quadro genérico).
export type TarefaPessoal = TarefaQuadro & {
  responsavelId?: string | null;
  driveFolderId?: string | null;
  checklist?: ChecklistItemData[];
};

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function CartaoPessoal({
  tarefa,
  usuarioId,
  arrastando,
  carregando,
  onDragStart,
  onDragEnd,
  onClaim,
  onIniciar,
  onConcluir,
}: {
  tarefa: TarefaPessoal;
  usuarioId: string;
  arrastando: boolean;
  carregando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClaim: () => void;
  onIniciar: () => void;
  onConcluir: () => void;
}) {
  const { icone: Icon, cor } = visualDaCategoriaTarefa(tarefa.categoria);
  const urgencia = urgenciaPrazo(tarefa.prazo);
  const minha = tarefa.responsavelId === usuarioId;
  const [expandido, setExpandido] = useState(false);

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
          {tarefa.driveFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${tarefa.driveFolderId}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-text"
            >
              <HardDrive size={9} /> Baixar conteúdo
            </a>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
        {tarefa.status === "a_fazer" && !minha && (
          <button
            onClick={onClaim}
            disabled={carregando}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted hover:border-accent/40 hover:text-text disabled:opacity-40"
          >
            <Inbox size={10} /> {carregando ? "..." : "Pegar pra mim"}
          </button>
        )}
        {tarefa.status === "a_fazer" && minha && (
          <button
            onClick={onIniciar}
            disabled={carregando}
            className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
          >
            <Play size={10} /> {carregando ? "..." : "Iniciar"}
          </button>
        )}
        {tarefa.status === "em_andamento" && (
          <>
            <button
              onClick={onConcluir}
              disabled={carregando}
              className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
            >
              <Check size={10} /> {carregando ? "..." : "Marcar feito"}
            </button>
            <button
              onClick={() => setExpandido((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-muted hover:text-text"
            >
              Sub-passos <ChevronDown size={10} className={expandido ? "rotate-180" : ""} />
            </button>
          </>
        )}
      </div>

      {tarefa.status === "em_andamento" && expandido && (
        <div className="mt-2 border-t border-border/60 pt-2">
          <ChecklistTarefa tarefaId={tarefa.id} itens={tarefa.checklist || []} />
        </div>
      )}
    </div>
  );
}

export default function QuadroTarefasPessoal({ usuarioId, tarefas }: { usuarioId: string; tarefas: TarefaPessoal[] }) {
  const router = useRouter();
  const [itens, setItens] = useState(tarefas);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<TarefaPessoal | null>(null);
  const [horaInicio, setHoraInicio] = useState(horaAtual());
  const [horaFim, setHoraFim] = useState(horaAtual());
  const [salvandoConclusao, setSalvandoConclusao] = useState(false);
  const [verTodasFeitas, setVerTodasFeitas] = useState(false);

  useEffect(() => setItens(tarefas), [tarefas]);

  async function patchTarefa(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui atualizar essa tarefa.");
      return false;
    }
    return true;
  }

  async function claim(tarefa: TarefaPessoal) {
    setCarregandoId(tarefa.id);
    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, responsavelId: usuarioId } : t)));
    await patchTarefa(tarefa.id, { responsavelId: usuarioId });
    setCarregandoId(null);
    router.refresh();
  }

  async function iniciar(tarefa: TarefaPessoal) {
    setCarregandoId(tarefa.id);
    setItens((prev) =>
      prev.map((t) => (t.id === tarefa.id ? { ...t, status: "em_andamento", responsavelId: usuarioId } : t))
    );
    const ok = await patchTarefa(tarefa.id, { status: "em_andamento", responsavelId: usuarioId });
    if (ok) {
      // Mesmo mecanismo do cronômetro do topo — um registro de horas sem "fim" fica
      // rodando até a pessoa parar (na Horas ou no cronômetro da barra superior).
      await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: tarefa.clienteId || null,
          atividade: tarefa.titulo,
          inicio: new Date().toISOString(),
        }),
      });
    }
    setCarregandoId(null);
    router.refresh();
  }

  function pedirConclusao(tarefa: TarefaPessoal) {
    setConfirmando(tarefa);
    setHoraInicio(horaAtual());
    setHoraFim(horaAtual());
  }

  async function confirmarConclusao(registrarHoras: boolean) {
    if (!confirmando) return;
    setSalvandoConclusao(true);
    const tarefa = confirmando;

    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status: "feito", responsavelId: usuarioId } : t)));
    const ok = await patchTarefa(tarefa.id, { status: "feito", responsavelId: usuarioId });

    if (!ok) {
      setSalvandoConclusao(false);
      router.refresh();
      return;
    }

    if (registrarHoras && horaInicio && horaFim) {
      const hoje = new Date().toLocaleDateString("en-CA");
      const resHoras = await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividade: tarefa.titulo,
          clienteId: tarefa.clienteId || null,
          inicio: `${hoje}T${horaInicio}:00-03:00`,
          fim: `${hoje}T${horaFim}:00-03:00`,
        }),
      });
      if (!resHoras.ok) {
        alert("A tarefa foi marcada como feita, mas não consegui lançar as horas — lança manualmente em Horas.");
      }
    }

    setSalvandoConclusao(false);
    setConfirmando(null);
    router.refresh();
  }

  function soltar(status: string) {
    setColunaSobre(null);
    if (!arrastandoId) return;
    const tarefa = itens.find((t) => t.id === arrastandoId);
    setArrastandoId(null);
    if (!tarefa || tarefa.status === status) return;

    if (status === "feito") {
      pedirConclusao(tarefa);
      return;
    }
    // Só liga o cronômetro quando é de fato "começar a trabalhar" (saindo de "a
    // fazer"). Reabrir um "feito" ou devolver "em andamento" pra "a fazer" é só
    // o status mudando, sem mexer em responsável nem em hora nenhuma.
    if (status === "em_andamento" && tarefa.status === "a_fazer") {
      iniciar(tarefa);
      return;
    }
    setCarregandoId(tarefa.id);
    setItens((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, status } : t)));
    patchTarefa(tarefa.id, { status }).then(() => {
      setCarregandoId(null);
      router.refresh();
    });
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
    <div>
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
                  <CartaoPessoal
                    key={t.id}
                    tarefa={t}
                    usuarioId={usuarioId}
                    arrastando={arrastandoId === t.id}
                    carregando={carregandoId === t.id}
                    onDragStart={() => setArrastandoId(t.id)}
                    onDragEnd={() => setArrastandoId(null)}
                    onClaim={() => claim(t)}
                    onIniciar={() => iniciar(t)}
                    onConcluir={() => pedirConclusao(t)}
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
