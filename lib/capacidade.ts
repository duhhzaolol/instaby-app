// Capacidade da equipe (Etapa 4 v158) — "comparar trabalho previsto com
// capacidade disponível por semana" + "alertar sobre sobrecarga e conflitos".
// Fica server-safe (sem "use client"), mesmo espírito de lib/entregas.ts. Usa a
// MESMA definição de semana (segunda a domingo) já usada pra pasta do Drive —
// ver lib/google.ts: inicioDaSemana.

import { inicioDaSemana } from "./google";

// Vocabulário de Ausencia.tipo — mesmo padrão do resto do projeto (sem enum do
// Postgres/Prisma, só uma constante TS validada nas rotas de API).
export const TIPOS_AUSENCIA = ["folga", "ferias", "atestado", "compromisso"] as const;
export const TIPO_AUSENCIA_LABEL: Record<string, string> = {
  folga: "Folga",
  ferias: "Férias",
  atestado: "Atestado",
  compromisso: "Compromisso",
};

function fimDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Uma semana como [inicio (segunda 00:00), fim (domingo 23:59:59)].
export type Semana = { inicio: Date; fim: Date };

export function semanaDe(data: Date): Semana {
  const inicio = inicioDaSemana(data);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  return { inicio, fim: fimDoDia(fim) };
}

// N semanas a partir da semana que contém `data` (inclusive) — pra montar a visão
// "próximas 4 semanas" da tela de Capacidade.
export function proximasSemanas(data: Date, quantidade: number): Semana[] {
  const primeira = inicioDaSemana(data);
  const resultado: Semana[] = [];
  for (let i = 0; i < quantidade; i++) {
    const inicio = new Date(primeira);
    inicio.setDate(inicio.getDate() + i * 7);
    resultado.push(semanaDe(inicio));
  }
  return resultado;
}

export type AusenciaParaCapacidade = {
  id: string;
  tipo: string;
  inicio: Date;
  fim: Date;
  diaInteiro: boolean;
  horasPorDia: number | null;
};

export type TarefaParaCapacidade = {
  id: string;
  titulo: string;
  prazo: Date | null;
  status: string;
  estimativaHoras: number | null;
  responsavelId: string | null;
};

// Quantas horas de capacidade uma ausência abate de UMA semana específica.
// Considera só dias úteis (segunda a sexta, 5 dias) pra dividir a carga semanal
// em "capacidade por dia útil" — sábado/domingo não contam pontos de capacidade
// nem de abatimento, porque a carga semanal já representa dias úteis.
function horasAbatidasNaSemana(ausencia: AusenciaParaCapacidade, semana: Semana, capacidadeDiariaBase: number): number {
  const aInicio = inicioDoDia(ausencia.inicio);
  const aFim = fimDoDia(ausencia.fim);
  let abatido = 0;
  for (let i = 0; i < 5; i++) {
    // dias úteis da semana: segunda (i=0) a sexta (i=4) — semana.inicio já é a segunda
    const dia = new Date(semana.inicio);
    dia.setDate(dia.getDate() + i);
    if (dia >= aInicio && dia <= aFim) {
      abatido += ausencia.diaInteiro ? capacidadeDiariaBase : Math.min(capacidadeDiariaBase, ausencia.horasPorDia || 0);
    }
  }
  return abatido;
}

// Capacidade disponível de UMA pessoa em UMA semana: carga horária semanal
// cadastrada, menos o que as ausências dela abatem naquela semana específica.
// Nunca fica negativa (uma pessoa com mais dias de folga do que capacidade base
// simplesmente fica em 0h, não "capacidade negativa").
export function capacidadeDaSemana(
  usuario: { cargaHorariaSemanal: number },
  ausencias: AusenciaParaCapacidade[],
  semana: Semana
): number {
  const capacidadeDiariaBase = usuario.cargaHorariaSemanal / 5;
  const abatido = ausencias.reduce((soma, a) => soma + horasAbatidasNaSemana(a, semana, capacidadeDiariaBase), 0);
  return Math.max(0, usuario.cargaHorariaSemanal - abatido);
}

// Trabalho previsto de UMA pessoa em UMA semana: soma da estimativa de horas de
// tarefas dela, ainda não concluídas, com prazo dentro dessa semana. Tarefa sem
// estimativa preenchida não entra na soma (não conta como 0h "de graça" nem
// esconde o resto) — ver Tarefa.estimativaHoras.
export function trabalhoPrevistoDaSemana(tarefas: TarefaParaCapacidade[], usuarioId: string, semana: Semana): number {
  return tarefas
    .filter(
      (t) =>
        t.responsavelId === usuarioId &&
        t.status !== "feito" &&
        t.estimativaHoras != null &&
        t.prazo &&
        t.prazo >= semana.inicio &&
        t.prazo <= semana.fim
    )
    .reduce((soma, t) => soma + (t.estimativaHoras || 0), 0);
}

// Quantas tarefas (sem estimativa) caem nessa semana — só informativo, mostrado
// ao lado do total de horas pra não passar a falsa impressão de "só tem 3 tarefas
// de 2h essa semana" quando na real tem mais 5 tarefas sem estimativa nenhuma.
export function tarefasSemEstimativaNaSemana(tarefas: TarefaParaCapacidade[], usuarioId: string, semana: Semana): number {
  return tarefas.filter(
    (t) =>
      t.responsavelId === usuarioId &&
      t.status !== "feito" &&
      t.estimativaHoras == null &&
      t.prazo &&
      t.prazo >= semana.inicio &&
      t.prazo <= semana.fim
  ).length;
}

// "Alertar sobre sobrecarga" — 3 níveis pra colorir a tela de Capacidade: verde
// (folga), âmbar (perto do limite, ≥80%) e vermelho (previsto ultrapassa a
// capacidade). Capacidade 0 com algo previsto conta como sobrecarga na hora —
// não existe divisão por zero "ok".
export type NivelCapacidade = "ok" | "alerta" | "sobrecarga";
export function nivelDaSemana(previsto: number, capacidade: number): NivelCapacidade {
  if (capacidade <= 0) return previsto > 0 ? "sobrecarga" : "ok";
  const proporcao = previsto / capacidade;
  if (proporcao >= 1) return "sobrecarga";
  if (proporcao >= 0.8) return "alerta";
  return "ok";
}

export type ConflitoAusencia = { tarefaId: string; titulo: string; prazo: Date };

// "Alertar sobre... conflitos": tarefas com prazo caindo num dia em que o
// responsável está de folga/férias/atestado (ausência de dia inteiro) —
// compromisso parcial não gera esse alerta específico (a pessoa ainda está
// disponível parte do dia), só entra na conta de horas abatidas acima.
export function conflitosDeAusencia(
  tarefas: TarefaParaCapacidade[],
  usuarioId: string,
  ausencias: AusenciaParaCapacidade[]
): ConflitoAusencia[] {
  const diasIndisponiveis = ausencias.filter((a) => a.diaInteiro);
  const conflitos: ConflitoAusencia[] = [];
  for (const t of tarefas) {
    if (t.responsavelId !== usuarioId || t.status === "feito" || !t.prazo) continue;
    const bate = diasIndisponiveis.some((a) => t.prazo! >= inicioDoDia(a.inicio) && t.prazo! <= fimDoDia(a.fim));
    if (bate) conflitos.push({ tarefaId: t.id, titulo: t.titulo, prazo: t.prazo });
  }
  return conflitos;
}
