"use client";

import { useSearchParams } from "next/navigation";
import { PainelDetalheTarefa } from "@/components/dashboard/PainelDetalheTarefa";

// Ponto único de montagem do painel lateral de tarefa (Etapa 1 v152) — vive no
// layout do dashboard (app/dashboard/layout.tsx) pra funcionar em QUALQUER página
// (Início, Kanban, Agenda, ficha do cliente...) sem duplicar isso em cada uma: quem
// quiser abrir o painel só precisa navegar pra "?tarefa=ID" preservando os outros
// parâmetros da URL — ver os cliques em QuadroTarefas/QuadroTarefasPessoal/
// TarefaRow/AgendaGrid e as notificações (Notificacao.link).
export function PainelDetalheTarefaHost() {
  const searchParams = useSearchParams();
  const tarefaId = searchParams.get("tarefa");

  function fechar() {
    const url = new URL(window.location.href);
    url.searchParams.delete("tarefa");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (!tarefaId) return null;
  return <PainelDetalheTarefa key={tarefaId} tarefaId={tarefaId} onClose={fechar} amplo />;
}
