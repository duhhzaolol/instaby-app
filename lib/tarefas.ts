// Helpers centralizados do módulo de Tarefas (Etapa 1 v152 — painel lateral,
// histórico e bloqueio). Fica server-safe de propósito (sem "use client", sem
// importar ícone/lucide) pra poder ser usado tanto nas rotas de API quanto em
// componentes client — o registro visual de cada status (cor/ícone) continua em
// components/dashboard/QuadroTarefas.tsx (COLUNAS), que é a fonte única do "estilo
// de Kanban" do sistema; aqui é só o vocabulário em texto.

export const STATUS_LABEL: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  bloqueada: "Bloqueada",
  feito: "Feito",
};

export function statusLabel(status: string | null | undefined) {
  if (!status) return "—";
  return STATUS_LABEL[status] || status;
}

// Rótulo de cada campo rastreado no histórico da tarefa (HistoricoTarefa.campo) —
// usado tanto ao escrever a linha (PATCH de /api/tarefas/[id]) quanto ao exibir o
// histórico no painel lateral.
export const CAMPO_HISTORICO_LABEL: Record<string, string> = {
  titulo: "Título",
  descricao: "Descrição",
  responsavel: "Responsável",
  prioridade: "Prioridade",
  prazo: "Prazo",
  categoria: "Categoria",
  status: "Status",
  link: "Link",
  // Etapa 2 v153 — fluxo de revisão/aprovação de conteúdo.
  statusConteudo: "Status da revisão",
  linkPublicacao: "Link da publicação",
  videoBrutoExcecao: "Exceção de vídeo bruto",
  // Etapa 4 v158 — capacidade/estimativa.
  estimativaHoras: "Estimativa de horas",
};

export function campoHistoricoLabel(campo: string) {
  return CAMPO_HISTORICO_LABEL[campo] || campo;
}

// Status que representam "parou de trabalhar nisso agora" — sempre que a tarefa
// entra em um desses, qualquer cronômetro (RegistroTempo sem "fim") ligado a ela é
// fechado sozinho no servidor (ver PATCH de /api/tarefas/[id]). É essa regra,
// central e no servidor, que evita o registro de horas duplicado/órfão pedido na
// Etapa 1 item 9 — não importa qual das 3 telas (quadro geral, quadro pessoal,
// ficha do cliente) disparou a mudança.
const STATUS_QUE_FECHAM_CRONOMETRO = new Set(["feito", "bloqueada"]);

export function statusFechaCronometro(status: string) {
  return STATUS_QUE_FECHAM_CRONOMETRO.has(status);
}

// Status válidos pra a tarefa — usado só como trava simples no servidor (o front
// já restringe via <select>/colunas do Kanban, isso aqui é a última linha de defesa).
export const STATUS_VALIDOS = ["a_fazer", "em_andamento", "bloqueada", "feito"];
