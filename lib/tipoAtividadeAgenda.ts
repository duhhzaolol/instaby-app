import { Video, Film, Users, Building2, CalendarClock, type LucideIcon } from "lucide-react";

export type TipoAtividadeAgenda = "captacao" | "edicao" | "reuniao" | "interno" | "compromisso";

export const TIPOS_ATIVIDADE_AGENDA: { valor: TipoAtividadeAgenda; label: string; icone: LucideIcon; cor: string }[] = [
  { valor: "captacao", label: "Captação", icone: Video, cor: "#E63946" },
  { valor: "edicao", label: "Edição", icone: Film, cor: "#A855F7" },
  { valor: "reuniao", label: "Reunião", icone: Users, cor: "#F59E0B" },
  { valor: "interno", label: "Trabalho interno", icone: Building2, cor: "#38bdf8" },
  { valor: "compromisso", label: "Compromisso", icone: CalendarClock, cor: "#4ade80" },
];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Classifica o texto livre de uma atividade de horas (ou título de tarefa) num tipo de agenda. */
export function classificarTipoAtividade(texto: string, temCliente: boolean): TipoAtividadeAgenda {
  const t = normalizar(texto);
  if (t.includes("captac") || t.includes("gravac")) return "captacao";
  if (t.includes("edic") || t.includes("edit")) return "edicao";
  if (t.includes("reuni")) return "reuniao";
  if (t.includes("intern") || t.includes("administrat") || !temCliente) return "interno";
  return "compromisso";
}

export function visualDoTipoAtividade(tipo: TipoAtividadeAgenda) {
  return TIPOS_ATIVIDADE_AGENDA.find((t) => t.valor === tipo) || TIPOS_ATIVIDADE_AGENDA[4];
}
