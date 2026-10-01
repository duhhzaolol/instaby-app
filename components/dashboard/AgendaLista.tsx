"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Plus } from "lucide-react";
import type { EventoAgenda } from "@/components/dashboard/AgendaGrid";
import type { ClienteAgenda } from "@/components/dashboard/FiltroClienteAgenda";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import {
  EtapaAgenda,
  dataHoraAgenda,
  horarioEventoAgenda,
  rotuloDataAgenda,
} from "@/components/dashboard/EtapaAgenda";

export function AgendaLista({
  eventos,
  mesChave,
  clientes = [],
  clienteIdAtual = "",
  baseData = "trabalho",
}: {
  eventos: EventoAgenda[];
  mesChave: string;
  clientes?: ClienteAgenda[];
  clienteIdAtual?: string;
  baseData?: "trabalho" | "postagem";
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  useEffect(() => {
    function fechar(e: KeyboardEvent) {
      if (e.key === "Escape") setCriando(false);
    }
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, []);
  const itens = eventos
    .filter((e) => e.data.slice(0, 7) === mesChave)
    .sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        (a.horaInicio || a.hora || "").localeCompare(
          b.horaInicio || b.hora || "",
        ) ||
        a.texto.localeCompare(b.texto, "pt-BR"),
    );

  function conteudo(e: EventoAgenda) {
    const hora = horarioEventoAgenda(e);
    const producao = dataHoraAgenda(e.prazo);
    const planejada = dataHoraAgenda(e.postagemPlanejada);
    const publicado = dataHoraAgenda(e.publicadoEm);
    const dia = `${e.data.slice(8, 10)}/${e.data.slice(5, 7)}`;
    return (
      <>
        <div className="flex shrink-0 items-start gap-2 sm:w-40">
          <div>
            <p className="text-base font-semibold text-text">{dia}</p>
            {hora && <p className="mt-0.5 text-xs text-muted">{hora}</p>}
            <p className="mt-1 text-[11px] text-muted">
              {e.origem === "hora"
                ? "Horas registradas"
                : rotuloDataAgenda(e.tipoData)}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-text">
            {e.texto}
          </p>
          <p className="mt-1 break-words text-xs text-muted">
            {[
              e.clienteNome || "Sem cliente",
              e.categoriaLabel || "Horas registradas",
              e.usuarioNome,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {e.origem === "tarefa" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <EtapaAgenda etapa={e.etapa} />
              {e.urgencia && (
                <span className="text-[11px]" style={{ color: e.urgencia.cor }}>
                  {e.urgencia.label}
                </span>
              )}
            </div>
          )}
          {e.origem === "tarefa" && (
            <dl className="mt-3 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
              <div className="flex flex-wrap gap-x-1">
                <dt>Produção:</dt>
                <dd>{producao || "Sem prazo definido"}</dd>
              </div>
              <div className="flex flex-wrap gap-x-1">
                <dt>Postagem planejada:</dt>
                <dd>{planejada || "Sem data definida"}</dd>
              </div>
              {publicado && (
                <div className="flex flex-wrap gap-x-1">
                  <dt>Publicado:</dt>
                  <dd>{publicado}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <ArrowUpRight size={16} className="shrink-0 text-muted" />
      </>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Clique numa tarefa para abrir os detalhes completos.
        </p>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-white"
        >
          <Plus size={15} /> Nova tarefa na agenda
        </button>
      </div>
      <div className="space-y-2" aria-label="Cronograma do mês em lista">
        {!itens.length && (
          <div className="rounded-2xl border border-border bg-card/40 px-5 py-10 text-center">
            <CalendarDays size={24} className="mx-auto mb-3 text-muted" />
            <p className="text-sm text-text">
              Nenhum item neste mês com os filtros selecionados.
            </p>
            <p className="mt-1 text-xs text-muted">
              Confira os filtros e a data escolhida para visualizar a agenda.
            </p>
          </div>
        )}
        {itens.map((e) => {
          const estilo =
            "flex w-full flex-col items-start gap-3 rounded-xl border border-border bg-card/40 p-4 text-left hover:border-accent/40 hover:bg-hover sm:flex-row sm:gap-5";
          if (e.origem === "hora")
            return (
              <Link
                key={`${e.origem}-${e.id}`}
                href={e.href}
                className={estilo}
                aria-label={`Abrir horas: ${e.texto}`}
              >
                {conteudo(e)}
              </Link>
            );
          return (
            <button
              type="button"
              key={`${e.origem}-${e.id}`}
              className={estilo}
              aria-label={`Abrir tarefa: ${e.texto}${e.clienteNome ? ` · ${e.clienteNome}` : ""}`}
              onClick={() => router.push(e.href, { scroll: false })}
            >
              {conteudo(e)}
            </button>
          );
        })}
      </div>
      {criando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setCriando(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Nova tarefa do cronograma"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-base p-3 sm:p-5"
          >
            <p className="mb-3 text-xs text-muted">
              {baseData === "postagem"
                ? "Escolha o dia da postagem planejada. O horário é opcional."
                : "Escolha o prazo de produção. O dia de postagem pode ser definido separadamente."}
            </p>
            <NovaTarefaGlobalForm
              key={clienteIdAtual}
              clientes={clientes}
              abertoInicial
              clienteInicial={clienteIdAtual}
              prazoInicial=""
              postagemInicial=""
              aoCancelar={() => setCriando(false)}
              aoConcluir={() => setCriando(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
