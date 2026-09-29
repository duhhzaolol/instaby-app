import { prisma } from "@/lib/prisma";

export type TipoNotificacao =
  | "tarefa_atribuida"
  | "tarefa_sem_responsavel"
  | "comentario_tarefa"
  | "tarefa_bloqueada"
  | "comentario_relatorio"
  // Etapa 2 v153 — fluxo de revisão/aprovação de conteúdo (ver VersaoConteudo/
  // ComentarioRevisao em prisma/schema.prisma).
  | "comentario_revisao"
  | "revisao_aprovada";

type CriarNotificacaoInput = {
  usuarioId: string; // destinatário
  tipo: TipoNotificacao;
  titulo: string;
  corpo?: string | null;
  link?: string | null;
  tarefaId?: string | null;
  clienteId?: string | null;
  relatorioId?: string | null;
  criadaPorId?: string | null;
  // Se não vier, é derivada de tipo+referência — duas notificações com a mesma
  // chave e ainda não lidas viram UMA linha só (contador sobe), em vez de duas
  // separadas (Etapa 1 item 8: "agrupar notificações repetidas").
  agrupadorChave?: string | null;
};

// Cria (ou agrupa) uma notificação. Se já existir uma NÃO LIDA com a mesma
// agrupadorChave pra esse destinatário, não nasce uma linha nova — só sobe o
// "contador" e atualiza título/corpo/link/atualizadoEm, cancelando um "adiar"
// antigo (um evento novo do mesmo assunto merece reaparecer, mesmo que a pessoa
// tivesse adiado a versão anterior). Nunca lança — notificação é conveniência,
// nunca deve derrubar a rota que a disparou.
export async function criarNotificacao(input: CriarNotificacaoInput) {
  try {
    const agrupadorChave =
      input.agrupadorChave || `${input.tipo}:${input.tarefaId || input.clienteId || input.relatorioId || ""}`;

    const existente = await prisma.notificacao.findFirst({
      where: { usuarioId: input.usuarioId, agrupadorChave, lidaEm: null },
      orderBy: { createdAt: "desc" },
    });

    if (existente) {
      return await prisma.notificacao.update({
        where: { id: existente.id },
        data: {
          contador: { increment: 1 },
          titulo: input.titulo,
          ...(input.corpo !== undefined && { corpo: input.corpo }),
          ...(input.link !== undefined && { link: input.link }),
          adiadaAte: null,
        },
      });
    }

    return await prisma.notificacao.create({
      data: {
        usuarioId: input.usuarioId,
        tipo: input.tipo,
        titulo: input.titulo,
        corpo: input.corpo || null,
        link: input.link || null,
        tarefaId: input.tarefaId || null,
        clienteId: input.clienteId || null,
        relatorioId: input.relatorioId || null,
        criadaPorId: input.criadaPorId || null,
        agrupadorChave,
      },
    });
  } catch (e) {
    console.error("Não consegui criar notificação:", e);
    return null;
  }
}

// Mesmo evento, vários destinatários (ex.: comentário de relatório vai pra todo
// mundo com acesso ao cliente) — sem duplicar a chamada em cada rota.
export async function notificarVarios(usuarioIds: string[], input: Omit<CriarNotificacaoInput, "usuarioId">) {
  const unicos = Array.from(new Set(usuarioIds.filter(Boolean)));
  await Promise.all(unicos.map((usuarioId) => criarNotificacao({ ...input, usuarioId })));
}
