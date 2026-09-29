// Rótulos e regras do fluxo de revisão/aprovação de conteúdo (Etapa 2 v153) — ver
// Tarefa.statusConteudo e prisma/schema.prisma: VersaoConteudo/ComentarioRevisao.
// Mesmo espírito de lib/tarefas.ts (STATUS_VALIDOS/statusLabel), só que pra essa
// segunda dimensão de status (a do CONTEÚDO em si, separada do status geral da
// tarefa no quadro).

export const STATUS_CONTEUDO_VALIDOS = [
  "producao",
  "revisao_interna",
  "aprovacao_cliente",
  "agendado",
  "publicado",
] as const;

export type StatusConteudo = (typeof STATUS_CONTEUDO_VALIDOS)[number];

export const STATUS_CONTEUDO_LABELS: Record<StatusConteudo, string> = {
  producao: "Produção",
  revisao_interna: "Revisão interna",
  aprovacao_cliente: "Aprovação do cliente",
  agendado: "Agendado",
  publicado: "Publicado",
};

export function statusConteudoLabel(status: string | null | undefined): string {
  if (!status) return "Sem revisão";
  return STATUS_CONTEUDO_LABELS[status as StatusConteudo] || status;
}

// Próximo passo sugerido do fluxo — usado pro botão "Avançar" do painel de
// revisão. O fluxo sempre sobe uma etapa de cada vez; voltar pra trás (ex: cliente
// pediu ajuste depois de "Aprovação do cliente") é uma escolha manual de quem tá
// usando, não uma sugestão automática.
export function proximoStatusConteudo(atual: string | null | undefined): StatusConteudo | null {
  const idx = atual ? STATUS_CONTEUDO_VALIDOS.indexOf(atual as StatusConteudo) : -1;
  if (idx === -1) return STATUS_CONTEUDO_VALIDOS[0];
  if (idx >= STATUS_CONTEUDO_VALIDOS.length - 1) return null;
  return STATUS_CONTEUDO_VALIDOS[idx + 1];
}

// Uma versão está aprovada quando aprovadoEm está preenchido (sempre junto de um
// aprovador — contato cadastrado ou nome livre, ver rota de aprovação).
export function versaoAprovada(v: { aprovadoEm: Date | string | null }): boolean {
  return !!v.aprovadoEm;
}

// Nome de exibição do aprovador de uma versão, priorizando o contato cadastrado
// (mais confiável) sobre o nome livre digitado na hora.
export function nomeAprovador(v: {
  aprovadoPorContato?: { nome: string } | null;
  aprovadoPorNomeLivre?: string | null;
}): string | null {
  return v.aprovadoPorContato?.nome || v.aprovadoPorNomeLivre || null;
}

// Nome de exibição do autor de um comentário de revisão — mesma prioridade
// (equipe > contato cadastrado > nome livre digitado na página pública).
export function nomeAutorComentario(c: {
  usuario?: { nome: string } | null;
  contato?: { nome: string } | null;
  autorNomeLivre?: string | null;
}): string {
  return c.usuario?.nome || c.contato?.nome || c.autorNomeLivre || "Alguém";
}

// Formata um "momento" de comentário (segundos de vídeo, ou ponto x/y de imagem)
// pra mostrar junto do texto — null quando o comentário é geral (não aponta pra
// nada específico).
export function formatarMomentoComentario(c: {
  momentoVideoSegundos?: number | null;
  pontoImagemX?: number | null;
  pontoImagemY?: number | null;
}): string | null {
  if (c.momentoVideoSegundos !== undefined && c.momentoVideoSegundos !== null) {
    const min = Math.floor(c.momentoVideoSegundos / 60);
    const seg = Math.floor(c.momentoVideoSegundos % 60)
      .toString()
      .padStart(2, "0");
    return `aos ${min}:${seg}`;
  }
  if (c.pontoImagemX !== undefined && c.pontoImagemX !== null && c.pontoImagemY !== undefined && c.pontoImagemY !== null) {
    return `num ponto da imagem`;
  }
  return null;
}
