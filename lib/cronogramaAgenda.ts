import { chaveDiaSaoPaulo } from "@/lib/dataHora";

type DataCronograma = Date | string | null;
export type TarefaCronograma = {
  id: string;
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
    t.statusConteudo === "producao" ||
    t.categoria === "reel" ||
    t.categoria === "arte"
  )
    return { label: "Em produção", cor: "#A78BFA" };
  return t.status === "em_andamento"
    ? { label: "Em andamento", cor: "#60A5FA" }
    : { label: "A fazer", cor: "#9CA3AF" };
}

function noMes(valor: DataCronograma, mes: string) {
  return !!valor && chaveDiaSaoPaulo(new Date(valor)).slice(0, 7) === mes;
}

export function resumirCronograma(tarefas: TarefaCronograma[], mes: string) {
  const planejadas = tarefas.filter((t) => noMes(t.publicacaoSugeridaEm, mes));
  return {
    planejados: planejadas.length,
    publicados: tarefas.filter(
      (t) => t.statusConteudo === "publicado" && noMes(t.publicadoEm, mes),
    ).length,
    pendentes: planejadas.filter((t) => t.statusConteudo !== "publicado")
      .length,
    concluidas: tarefas.filter(
      (t) => t.status === "feito" && noMes(t.prazo, mes),
    ).length,
  };
}
