// Helpers centralizados do formulário de solicitação do cliente (Etapa 3 v157).
// Fica server-safe de propósito (sem "use client", sem importar ícone/lucide) pra
// poder ser usado tanto nas rotas de API quanto em componentes client e no server
// component da página pública — mesmo espírito de lib/tarefas.ts e
// lib/revisaoConteudo.ts.

import { CategoriaTarefa, CATEGORIAS_TAREFA } from "./categoriaTarefaVisual";

export const STATUS_SOLICITACAO_VALIDOS = ["pendente", "em_andamento", "concluida"];

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export function statusSolicitacaoLabel(status: string | null | undefined) {
  if (!status) return "—";
  return STATUS_SOLICITACAO_LABEL[status] || status;
}

export type PerguntaSolicitacao = {
  chave: string;
  rotulo: string;
  tipo: "texto" | "textarea";
  placeholder?: string;
};

// Perguntas dinâmicas por tipo de serviço (Etapa 3 item "Criar formulário de
// solicitação para o cliente com perguntas conforme o tipo de serviço") — usa o
// MESMO vocabulário de CategoriaTarefa de propósito (ver Solicitacao.categoria no
// schema): assim, quando a equipe "transforma em tarefa", a categoria já vem
// pronta, sem precisar traduzir de um catálogo pro outro. Cada categoria tem só
// as perguntas que realmente ajudam a equipe a entender o pedido sem precisar
// voltar no WhatsApp — a descrição livre e o prazo desejado já existem fora
// daqui (sempre presentes, pra qualquer categoria) e não precisam ser repetidos.
// Lista pensada pra cobrir o caso comum; é só editar esse objeto pra ajustar.
export const PERGUNTAS_POR_CATEGORIA: Record<CategoriaTarefa, PerguntaSolicitacao[]> = {
  gravacao: [
    { chave: "local", rotulo: "Local da gravação", tipo: "texto" },
    { chave: "duracaoEstimada", rotulo: "Duração estimada", tipo: "texto", placeholder: "ex: meio período, dia inteiro" },
    { chave: "pessoasEnvolvidas", rotulo: "Quem precisa estar presente?", tipo: "texto" },
  ],
  arte: [
    { chave: "finalidade", rotulo: "Pra onde vai essa arte?", tipo: "texto", placeholder: "feed, stories, impressão..." },
    { chave: "dimensoes", rotulo: "Tem tamanho ou formato específico?", tipo: "texto" },
    { chave: "referencia", rotulo: "Link de referência ou inspiração (se tiver)", tipo: "texto" },
  ],
  reel: [
    { chave: "tema", rotulo: "Tema ou objetivo do reel", tipo: "textarea" },
    { chave: "temMaterialBruto", rotulo: "Já existe gravação pronta, ou precisa agendar captação?", tipo: "texto" },
    { chave: "referencia", rotulo: "Link de referência ou inspiração (se tiver)", tipo: "texto" },
  ],
  fotos: [
    { chave: "local", rotulo: "Local da sessão", tipo: "texto" },
    { chave: "quantidadeFotos", rotulo: "Quantas fotos, aproximadamente?", tipo: "texto" },
    { chave: "usoPretendido", rotulo: "Onde essas fotos vão ser usadas?", tipo: "texto" },
  ],
  campanha: [
    { chave: "objetivo", rotulo: "Objetivo da campanha", tipo: "texto", placeholder: "mensagens, vendas, alcance..." },
    { chave: "publicoAlvo", rotulo: "Público-alvo desejado", tipo: "textarea" },
    { chave: "orcamentoSugerido", rotulo: "Já tem um orçamento de mídia em mente?", tipo: "texto" },
  ],
  reuniao: [
    { chave: "pauta", rotulo: "Pauta da reunião", tipo: "textarea" },
    { chave: "participantes", rotulo: "Quem precisa participar?", tipo: "texto" },
  ],
  contato: [{ chave: "motivo", rotulo: "Motivo do contato", tipo: "texto" }],
  orcamento: [{ chave: "escopo", rotulo: "O que você gostaria de orçar?", tipo: "textarea" }],
  ideia: [],
  outra: [],
};

export function perguntasParaCategoria(categoria: string | null | undefined): PerguntaSolicitacao[] {
  if (!categoria) return [];
  return PERGUNTAS_POR_CATEGORIA[categoria as CategoriaTarefa] || [];
}

// Junta descrição livre + respostas das perguntas dinâmicas num texto único —
// usado ao "transformar solicitação em tarefa" pra preencher Tarefa.descricao
// preservando o briefing todo (Etapa 3 item "preservando briefing e anexos").
export function formatarSolicitacaoComoDescricao(input: {
  descricao: string;
  categoria?: string | null;
  respostas?: Record<string, string> | null;
}): string {
  const partes: string[] = [];
  if (input.descricao?.trim()) partes.push(input.descricao.trim());

  const perguntas = perguntasParaCategoria(input.categoria);
  if (input.respostas && perguntas.length > 0) {
    const linhas = perguntas
      .map((p) => {
        const resposta = input.respostas?.[p.chave];
        return resposta?.trim() ? `${p.rotulo}: ${resposta.trim()}` : null;
      })
      .filter((l): l is string => !!l);
    if (linhas.length > 0) {
      partes.push(["Detalhes do pedido do cliente:", ...linhas].join("\n"));
    }
  }
  return partes.join("\n\n");
}

// Rótulo de cada campo rastreado no histórico de ServicoContratado (Etapa 3 v157)
// — mesmo padrão de lib/tarefas.ts: CAMPO_HISTORICO_LABEL.
export const CAMPO_HISTORICO_SERVICO_LABEL: Record<string, string> = {
  quantidade: "Quantidade",
  valor: "Valor combinado",
  ativo: "Ativo",
};

export function campoHistoricoServicoLabel(campo: string) {
  return CAMPO_HISTORICO_SERVICO_LABEL[campo] || campo;
}

// Categorias oferecidas no formulário público, na ordem em que aparecem — reusa
// CATEGORIAS_TAREFA inteiro (mesmos ícones/cores já usados no resto do app) pra
// não duplicar vocabulário nenhum.
export const CATEGORIAS_SOLICITACAO_PUBLICA = CATEGORIAS_TAREFA;
