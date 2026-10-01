"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ExternalLink, Plus } from "lucide-react";
import {
  visualDoTipoAtividade,
  type TipoAtividadeAgenda,
} from "@/lib/tipoAtividadeAgenda";
import { DatePicker } from "@/components/ui/DatePicker";
import { AvatarPessoa } from "@/components/ui/AvatarPessoa";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import type { ClienteAgenda } from "@/components/dashboard/FiltroClienteAgenda";
import {
  EtapaAgenda,
  horarioEventoAgenda,
  rotuloDataAgenda,
} from "@/components/dashboard/EtapaAgenda";

export type EventoAgenda = {
  id: string;
  origem: "tarefa" | "hora";
  tipoAtividade: TipoAtividadeAgenda;
  texto: string;
  categoriaLabel?: string;
  status?: string;
  etapa?: { label: string; cor: string };
  tipoData?: "trabalho" | "postagem" | "publicado";
  prazo?: string | null;
  postagemPlanejada?: string | null;
  publicadoEm?: string | null;
  linkPublicacao?: string | null;
  clienteNome?: string | null;
  usuarioNome?: string | null;
  usuarioFotoUrl?: string | null;
  cor?: string | null;
  href: string;
  data: string;
  hora?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  urgencia?: { cor: string; label: string } | null;
};
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dataCurta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

export function AgendaGrid({
  dias,
  eventosPorDia,
  mes,
  hojeChave,
  clientes,
  clienteIdAtual,
  baseData = "trabalho",
}: {
  dias: string[];
  eventosPorDia: Record<string, EventoAgenda[]>;
  mes: number;
  hojeChave: string;
  clientes: ClienteAgenda[];
  clienteIdAtual: string;
  baseData?: "trabalho" | "postagem";
}) {
  const router = useRouter();
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  const [editandoHora, setEditandoHora] = useState<EventoAgenda | null>(null);
  const [novaData, setNovaData] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function fechar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDiaAberto(null);
        setEditandoHora(null);
        setNovaData(null);
      }
    }
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, []);

  function abrir(e: EventoAgenda) {
    setDiaAberto(null);
    if (e.origem === "tarefa") {
      router.push(e.href, { scroll: false });
      return;
    }
    setEditandoHora(e);
    setData(e.data);
    setHoraInicio(e.horaInicio || "");
    setHoraFim(e.horaFim || "");
    setErro("");
  }
  function criarNoDia(dia: string) {
    setDiaAberto(null);
    setNovaData(dia);
  }

  async function salvarHora() {
    if (!editandoHora) return;
    const inicio = new Date(`${data}T${horaInicio}:00-03:00`);
    const fim = horaFim ? new Date(`${data}T${horaFim}:00-03:00`) : null;
    if (
      !Number.isFinite(inicio.getTime()) ||
      (fim && (!Number.isFinite(fim.getTime()) || fim <= inicio))
    ) {
      setErro(
        "Informe o início e um fim posterior ao início, ou deixe o fim vazio.",
      );
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch(`/api/registros-tempo/${editandoHora.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inicio: inicio.toISOString(),
          fim: fim?.toISOString() || null,
        }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(d?.erro || "Não consegui salvar o registro de horas.");
        return;
      }
      setEditandoHora(null);
      router.refresh();
    } catch {
      setErro("Não consegui salvar. Confira a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Clique numa tarefa para editar ou no + de um dia para criar.
        </p>
        <button
          type="button"
          onClick={() => criarNoDia("")}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-white"
        >
          <Plus size={15} /> Nova tarefa na agenda
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-border bg-card/40">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-medium text-muted"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((chave) => {
              const eventos = eventosPorDia[chave] || [];
              const foraDoMes = Number(chave.slice(5, 7)) - 1 !== mes;
              return (
                <div
                  key={chave}
                  className={`min-h-[120px] border-b border-r border-border p-1.5 ${foraDoMes ? "bg-black/20" : ""}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label={`Ver dia ${dataCurta(chave)}`}
                      onClick={() => setDiaAberto(chave)}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs hover:ring-1 hover:ring-accent/40 ${chave === hojeChave ? "bg-accent text-white" : foraDoMes ? "text-muted/40" : "text-muted"}`}
                    >
                      {Number(chave.slice(8))}
                    </button>
                    <button
                      type="button"
                      aria-label={`Criar tarefa em ${dataCurta(chave)}`}
                      onClick={() => criarNoDia(chave)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {eventos.slice(0, 3).map((e) => {
                      const visual = visualDoTipoAtividade(e.tipoAtividade);
                      const Icon = visual.icone;
                      const cor = e.urgencia?.cor || e.cor || visual.cor;
                      return (
                        <button
                          type="button"
                          key={`${e.origem}-${e.id}`}
                          aria-label={`Abrir ${e.origem === "tarefa" ? "tarefa" : "horas"}: ${e.texto}${e.clienteNome ? ` · ${e.clienteNome}` : ""}`}
                          onClick={() => abrir(e)}
                          className="rounded-lg px-1.5 py-1 text-left text-[11px] hover:opacity-80"
                          style={{ backgroundColor: `${cor}1A`, color: cor }}
                          title={[
                            e.texto,
                            e.categoriaLabel,
                            e.clienteNome,
                            e.urgencia?.label,
                            e.etapa?.label,
                            e.origem === "tarefa"
                              ? rotuloDataAgenda(e.tipoData)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" — ")}
                        >
                          <span className="flex items-start gap-1">
                            <Icon size={11} className="mt-0.5 shrink-0" />
                            <span className="line-clamp-2 break-words font-medium">
                              {e.texto}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] opacity-80">
                            {[
                              horarioEventoAgenda(e),
                              e.categoriaLabel || "Horas",
                              e.clienteNome,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {e.origem === "tarefa" && (
                            <>
                              <span className="mt-1 block">
                                <EtapaAgenda etapa={e.etapa} compacto />
                              </span>
                              <span className="mt-0.5 block text-[9px] opacity-80">
                                {rotuloDataAgenda(e.tipoData)}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                    {eventos.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setDiaAberto(chave)}
                        className="text-left text-[11px] text-muted hover:text-text"
                      >
                        +{eventos.length - 3} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {diaAberto && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3"
          onClick={() => setDiaAberto(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Itens do dia"
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-text">
                {new Date(`${diaAberto}T12:00:00-03:00`).toLocaleDateString(
                  "pt-BR",
                  {
                    timeZone: "America/Sao_Paulo",
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  },
                )}
              </p>
              <button
                type="button"
                aria-label="Fechar itens do dia"
                onClick={() => setDiaAberto(null)}
                className="text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mb-4 flex flex-col gap-2">
              {(eventosPorDia[diaAberto] || []).map((e) => (
                <button
                  type="button"
                  key={`${e.origem}-${e.id}`}
                  onClick={() => abrir(e)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-base/60 px-3 py-3 text-left hover:border-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap break-words text-sm text-text">
                      {e.texto}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {[
                        horarioEventoAgenda(e),
                        e.categoriaLabel || "Horas registradas",
                        e.clienteNome,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {e.origem === "tarefa" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <EtapaAgenda etapa={e.etapa} />
                        <span className="text-xs text-muted">
                          {rotuloDataAgenda(e.tipoData)}
                        </span>
                      </div>
                    )}
                    {e.urgencia && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: e.urgencia.cor }}
                      >
                        {e.urgencia.label}
                      </p>
                    )}
                  </div>
                  {e.usuarioNome && (
                    <AvatarPessoa
                      nome={e.usuarioNome}
                      fotoUrl={e.usuarioFotoUrl}
                      tamanho={24}
                    />
                  )}
                </button>
              ))}
              {!eventosPorDia[diaAberto]?.length && (
                <p className="text-sm text-muted">
                  Nenhum item neste dia com os filtros selecionados.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => criarNoDia(diaAberto)}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-white"
            >
              <Plus size={15} /> Criar tarefa neste dia
            </button>
          </div>
        </div>
      )}

      {novaData !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setNovaData(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Nova tarefa do cronograma"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-base p-3 sm:p-5"
          >
            <NovaTarefaGlobalForm
              key={`${clienteIdAtual}-${novaData}`}
              clientes={clientes}
              abertoInicial
              clienteInicial={clienteIdAtual}
              prazoInicial={baseData === "trabalho" ? novaData : ""}
              postagemInicial={baseData === "postagem" ? novaData : ""}
              aoCancelar={() => setNovaData(null)}
              aoConcluir={() => setNovaData(null)}
            />
          </div>
        </div>
      )}

      {editandoHora && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setEditandoHora(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar registro de horas"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">
                  {editandoHora.texto}
                </p>
                <p className="text-xs text-muted">
                  {editandoHora.clienteNome} · Horas registradas
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar registro de horas"
                onClick={() => setEditandoHora(null)}
                className="text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <label className="mb-1 block text-xs text-muted">Data</label>
            <DatePicker value={data} onChange={setData} className="mb-3" />
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="inicio-hora-agenda"
                  className="mb-1 block text-xs text-muted"
                >
                  Início
                </label>
                <input
                  id="inicio-hora-agenda"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
                />
              </div>
              <div>
                <label
                  htmlFor="fim-hora-agenda"
                  className="mb-1 block text-xs text-muted"
                >
                  Fim (opcional)
                </label>
                <input
                  id="fim-hora-agenda"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-base px-3 text-sm text-text"
                />
              </div>
            </div>
            {erro && (
              <p role="alert" className="mb-3 text-sm text-red-400">
                {erro}
              </p>
            )}
            <button
              type="button"
              onClick={salvarHora}
              disabled={salvando}
              className="mb-3 h-10 w-full rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-40"
            >
              {salvando ? "Salvando..." : "Salvar horas"}
            </button>
            <Link
              href={editandoHora.href}
              className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-text"
            >
              <ExternalLink size={12} /> Ver registros completos
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
