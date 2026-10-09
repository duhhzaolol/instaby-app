// Planejamento guarda ideias e datas pretendidas; produção guarda o trabalho
// assumido pela equipe. A categoria (Reel, Arte etc.) não muda essa distinção.
export const TIPOS_TRABALHO = ["tarefa", "ideia"] as const;
export type TipoTrabalho = (typeof TIPOS_TRABALHO)[number];
export type FiltroTrabalho = "todas" | "atrasadas" | "sem_responsavel" | "postagens_pendentes" | "semana";

export type TrabalhoOrganizavel = {
  tipo?: string | null;
  status?: string | null;
  prazo?: Date | string | null;
  responsavelId?: string | null;
  publicacaoSugeridaEm?: Date | string | null;
  publicadoEm?: Date | string | null;
  statusConteudo?: string | null;
};

export function ehPlanejamento(tarefa: Pick<TrabalhoOrganizavel, "tipo">): boolean {
  return tarefa.tipo === "ideia";
}

export function tipoTrabalhoValido(tipo: unknown): tipo is TipoTrabalho {
  return tipo === "tarefa" || tipo === "ideia";
}

// Os prazos antigos à meia-noite UTC representavam apenas um dia civil. Manter
// esse dia evita adiantar um prazo antigo para a véspera em Brasília.
export function diaTrabalho(valor: Date | string | null | undefined, legado = true): string {
  if (!valor) return "";
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (!Number.isFinite(data.getTime())) return "";
  if (legado && data.toISOString().endsWith("T00:00:00.000Z")) return data.toISOString().slice(0, 10);
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(data);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value || "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

export function inicioDiaTrabalho(agora: Date = new Date()): Date {
  return new Date(`${diaTrabalho(agora, false)}T00:00:00-03:00`);
}

export function tarefaAtrasada(tarefa: TrabalhoOrganizavel, agora: Date = new Date()): boolean {
  const prazo = diaTrabalho(tarefa.prazo);
  return !ehPlanejamento(tarefa) && tarefa.status !== "feito" && !!prazo && prazo < diaTrabalho(agora, false);
}

export function postagemPendente(tarefa: TrabalhoOrganizavel, agora: Date = new Date()): boolean {
  const postagem = diaTrabalho(tarefa.publicacaoSugeridaEm);
  return !!postagem && postagem < diaTrabalho(agora, false) &&
    tarefa.statusConteudo !== "publicado" && !tarefa.publicadoEm;
}

// Os avisos do Início e os filtros da lista usam os mesmos predicados. Postagens
// pendentes incluem planejamento: deixar uma ideia fora da produção não publica
// o conteúdo nem apaga a data que foi combinada.
export function filtrarTrabalho<T extends TrabalhoOrganizavel>(
  tarefas: readonly T[], filtro: FiltroTrabalho | string = "todas", agora: Date = new Date(),
): T[] {
  if (filtro === "postagens_pendentes") return tarefas.filter(t => postagemPendente(t, agora));
  const producao = tarefas.filter(t => !ehPlanejamento(t));
  if (filtro === "atrasadas") return producao.filter(t => tarefaAtrasada(t, agora));
  if (filtro === "sem_responsavel") return producao.filter(t => t.status !== "feito" && !t.responsavelId);
  if (filtro === "semana") {
    const hoje = diaTrabalho(agora, false);
    const fimSemana = new Date(inicioDiaTrabalho(agora).getTime() + 7 * 86400000);
    const ate = diaTrabalho(fimSemana, false);
    return producao.filter(t => t.status !== "feito" &&
      (tarefaAtrasada(t, agora) || (!!diaTrabalho(t.prazo) && diaTrabalho(t.prazo) >= hoje && diaTrabalho(t.prazo) < ate)));
  }
  return producao;
}

export function podeVoltarAoPlanejamento(tarefa: {
  status: string;
  statusConteudo?: string | null;
  publicadoEm?: Date | string | null;
  linkPublicacao?: string | null;
  concluidaEm?: Date | string | null;
  versoes?: number;
  registrosTempo?: number;
  passosFeitos?: number;
  jaTrabalhada?: boolean;
}): boolean {
  return tarefa.status === "a_fazer" && !tarefa.statusConteudo && !tarefa.publicadoEm &&
    !tarefa.linkPublicacao && !tarefa.concluidaEm && !tarefa.versoes &&
    !tarefa.registrosTempo && !tarefa.passosFeitos && !tarefa.jaTrabalhada;
}
