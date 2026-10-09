import { diaTrabalho, ehPlanejamento } from "@/lib/organizacaoTarefas";

type DataCronograma = Date | string | null;
export type TarefaCronograma = {
  id: string;
  tipo?: string | null;
  categoria: string | null;
  status: string;
  prazo: DataCronograma;
  publicacaoSugeridaEm: DataCronograma;
  publicadoEm: DataCronograma;
  statusConteudo: string | null;
  versoes?: {
    aprovadoEm: DataCronograma;
    alteracoesSolicitadasEm: DataCronograma;
  }[];
};
export type BaseDataAgenda = "trabalho" | "postagem" | "publicado";

export function dataDaAgenda(t: TarefaCronograma, base: BaseDataAgenda) {
  if (base === "postagem") return t.publicacaoSugeridaEm;
  if (base === "publicado")
    return t.statusConteudo === "publicado" ? t.publicadoEm : null;
  return t.prazo;
}

export function etapaDaTarefa(t: TarefaCronograma): {
  label: string;
  cor: string;
} {
  if (t.statusConteudo === "publicado")
    return { label: "Publicado", cor: "#34D399" };
  if (ehPlanejamento(t)) return { label: "Planejamento", cor: "#94A3B8" };
  if (t.statusConteudo === "agendado")
    return { label: "Agendado", cor: "#38BDF8" };
  const ultima = t.versoes?.[0];
  if (
    ultima?.alteracoesSolicitadasEm &&
    (!ultima.aprovadoEm ||
      new Date(ultima.alteracoesSolicitadasEm) >= new Date(ultima.aprovadoEm))
  )
    return { label: "Alterações solicitadas", cor: "#FB923C" };
  if (ultima?.aprovadoEm) return { label: "Aprovado", cor: "#2DD4BF" };
  if (t.statusConteudo === "aprovacao_cliente")
    return { label: "Aguardando cliente", cor: "#FBBF24" };
  if (t.statusConteudo === "revisao_interna")
    return { label: "Revisão interna", cor: "#C084FC" };
  if (t.status === "bloqueada") return { label: "Bloqueada", cor: "#F87171" };
  if (t.status === "feito")
    return { label: "Produção concluída", cor: "#A3E635" };
  if (
    t.statusConteudo === "producao"
  )
    return { label: "Em produção", cor: "#A78BFA" };
  return t.status === "em_andamento"
    ? { label: "Em andamento", cor: "#60A5FA" }
    : { label: t.categoria === "reel" || t.categoria === "arte" ? "A produzir" : "A fazer", cor: "#9CA3AF" };
}

function noMes(valor: DataCronograma, mes: string, legado = true) {
  return !!valor && diaTrabalho(valor, legado).slice(0, 7) === mes;
}

export function resumirCronograma(tarefas: TarefaCronograma[], mes: string) {
  const planejadas = tarefas.filter((t) => noMes(t.publicacaoSugeridaEm, mes));
  return {
    planejados: planejadas.length,
    publicados: tarefas.filter(
      (t) => t.statusConteudo === "publicado" && noMes(t.publicadoEm, mes, false),
    ).length,
    pendentes: planejadas.filter((t) => t.statusConteudo !== "publicado")
      .length,
    concluidas: tarefas.filter(
      (t) => !ehPlanejamento(t) && t.status === "feito" && noMes(t.prazo, mes),
    ).length,
  };
}
