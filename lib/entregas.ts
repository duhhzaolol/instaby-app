// Controle mensal de entregas (Etapa 3 v157) — transforma "serviço contratado" +
// "tarefas do mês" no painel pedido no exemplo da especificação: "8 reels
// contratados, 3 publicados, 2 aprovados, 2 em edição e 1 aguardando material".
// Fica server-safe (sem "use client") — é usado direto no server component da
// aba Entregas (app/dashboard/clientes/[id]/page.tsx).

import { CATEGORIAS_COM_REVISAO } from "./categoriaTarefaVisual";

export type BucketEntrega = "publicado" | "aprovado" | "em_edicao" | "aguardando_material";

export const BUCKETS_ENTREGA: BucketEntrega[] = ["publicado", "aprovado", "em_edicao", "aguardando_material"];

export const BUCKET_ENTREGA_LABEL: Record<BucketEntrega, string> = {
  publicado: "Publicado",
  aprovado: "Aprovado",
  em_edicao: "Em edição",
  aguardando_material: "Aguardando material",
};

export type TarefaParaEntrega = {
  id: string;
  titulo: string;
  categoria: string | null;
  status: string;
  statusConteudo: string | null;
  motivoBloqueio?: string | null;
  prazo: Date | null;
  createdAt: Date;
};

// Classifica UMA tarefa num dos 4 buckets pedidos pela Etapa 3. Contagem sempre
// por TAREFA (nunca por versão) — é isso que garante sozinho o item "não contar
// correções ou novas versões como entregas adicionais": uma tarefa que já passou
// por 5 versões antes de aprovar continua sendo 1 entrega só, porque essa função
// olha só o estado ATUAL da tarefa, nunca o histórico de versões dela.
//
// Categorias com fluxo de revisão (reel/arte — ver CATEGORIAS_COM_REVISAO) usam
// Tarefa.statusConteudo, que já é bem mais granular que os 4 buckets pedidos;
// "aprovação do cliente" (aprovacao_cliente) cai dentro de "em_edicao" porque a
// especificação só previu 4 categorias, mas o detalhe real de cada tarefa (ver
// detalheStatusEntrega) continua disponível na lista embaixo de cada bucket, pra
// não esconder a diferença — só a CONTAGEM agregada é que arredonda pra 4.
//
// Categorias sem revisão (fotos, campanha, gravação, reunião, contato, orçamento,
// ideia, outra) não têm um "aprovado pelo cliente" registrado no sistema hoje, só
// o status geral da tarefa (a_fazer/em_andamento/bloqueada/feito) — o bucket
// "aprovado" simplesmente não é usado por elas (fica sempre 0), o que é o
// comportamento esperado: a especificação usa reels como exemplo justamente
// porque é a categoria com o fluxo mais completo.
export function bucketDeEntrega(tarefa: Pick<TarefaParaEntrega, "categoria" | "status" | "statusConteudo">): BucketEntrega {
  if (CATEGORIAS_COM_REVISAO.includes((tarefa.categoria || "") as any)) {
    switch (tarefa.statusConteudo) {
      case "publicado":
        return "publicado";
      case "agendado":
        return "aprovado";
      case "revisao_interna":
      case "aprovacao_cliente":
        return "em_edicao";
      case "producao":
      default:
        return "aguardando_material";
    }
  }
  switch (tarefa.status) {
    case "feito":
      return "publicado";
    case "em_andamento":
      return "em_edicao";
    case "bloqueada":
    case "a_fazer":
    default:
      return "aguardando_material";
  }
}

// Rótulo detalhado pra mostrar dentro da lista de cada bucket (nunca só pra
// contar) — é aqui que "aguardando aprovação do cliente" ou o motivo de um
// bloqueio continuam visíveis, mesmo a contagem tendo arredondado pra "em_edicao"
// ou "aguardando_material".
export function detalheStatusEntrega(tarefa: Pick<TarefaParaEntrega, "categoria" | "status" | "statusConteudo" | "motivoBloqueio">): string {
  if (CATEGORIAS_COM_REVISAO.includes((tarefa.categoria || "") as any)) {
    switch (tarefa.statusConteudo) {
      case "publicado":
        return "Publicado";
      case "agendado":
        return "Aprovado — agendado pra publicar";
      case "aprovacao_cliente":
        return "Aguardando aprovação do cliente";
      case "revisao_interna":
        return "Em revisão interna";
      default:
        return "Aguardando material bruto";
    }
  }
  if (tarefa.status === "bloqueada") return tarefa.motivoBloqueio ? `Bloqueada: ${tarefa.motivoBloqueio}` : "Bloqueada";
  if (tarefa.status === "feito") return "Concluída";
  if (tarefa.status === "em_andamento") return "Em andamento";
  return "Ainda não iniciada";
}

// Mês de referência de uma tarefa pro controle mensal: usa o PRAZO quando
// existe (é a data que representa "quando essa entrega deveria sair"); cai pra
// createdAt só quando a tarefa ainda não tem prazo definido, pra ela não ficar
// invisível em todo mês pra sempre — aparece no mês em que foi pedida até
// ganhar um prazo. Decisão reversível, documentada no relatório da etapa.
function mesDaTarefa(tarefa: Pick<TarefaParaEntrega, "prazo" | "createdAt">): { ano: number; mes: number } {
  const data = tarefa.prazo || tarefa.createdAt;
  return { ano: data.getFullYear(), mes: data.getMonth() };
}

function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 };
}

export type ServicoContratadoParaEntrega = {
  id: string;
  quantidade: number;
  rolloverPendencias: boolean;
  servico: { nome: string; categoriaTarefa: string | null; unidade: string | null };
};

export type EntregaServico = {
  servicoContratadoId: string;
  servicoNome: string;
  unidade: string | null;
  categoriaTarefa: string;
  quantidadeContratada: number;
  rolloverAnterior: number;
  quantidadeEfetiva: number;
  totalNoMes: number;
  saldo: number;
  buckets: Record<BucketEntrega, { count: number; tarefas: { id: string; titulo: string; prazo: Date | null; detalhe: string }[] }>;
};

// Monta o painel de entregas de UM mês pra todos os serviços contratados que têm
// categoriaTarefa configurada. `tarefas` deve vir SEM filtro de mês (todas as
// tarefas do cliente nas categorias rastreadas) — a função filtra por mês por
// dentro, porque precisa também olhar o mês ANTERIOR quando rollover está ligado.
export function calcularEntregasDoMes(input: {
  servicosContratados: ServicoContratadoParaEntrega[];
  tarefas: TarefaParaEntrega[];
  ano: number;
  mes: number; // 0-11 (mesmo formato de Date.getMonth())
}): EntregaServico[] {
  const { ano, mes } = input;
  const anterior = mesAnterior(ano, mes);

  const rastreaveis = input.servicosContratados.filter((sc) => !!sc.servico.categoriaTarefa);

  return rastreaveis.map((sc) => {
    const categoriaTarefa = sc.servico.categoriaTarefa as string;
    const tarefasDaCategoria = input.tarefas.filter((t) => t.categoria === categoriaTarefa);

    const tarefasDoMes = tarefasDaCategoria.filter((t) => {
      const m = mesDaTarefa(t);
      return m.ano === ano && m.mes === mes;
    });
    const tarefasMesAnterior = tarefasDaCategoria.filter((t) => {
      const m = mesDaTarefa(t);
      return m.ano === anterior.ano && m.mes === anterior.mes;
    });

    const rolloverAnterior = sc.rolloverPendencias
      ? Math.max(0, sc.quantidade - tarefasMesAnterior.length)
      : 0;
    const quantidadeEfetiva = sc.quantidade + rolloverAnterior;

    const buckets = Object.fromEntries(
      BUCKETS_ENTREGA.map((b) => [b, { count: 0, tarefas: [] as EntregaServico["buckets"][BucketEntrega]["tarefas"] }])
    ) as EntregaServico["buckets"];

    tarefasDoMes.forEach((t) => {
      const bucket = bucketDeEntrega(t);
      buckets[bucket].count += 1;
      buckets[bucket].tarefas.push({ id: t.id, titulo: t.titulo, prazo: t.prazo, detalhe: detalheStatusEntrega(t) });
    });

    return {
      servicoContratadoId: sc.id,
      servicoNome: sc.servico.nome,
      unidade: sc.servico.unidade,
      categoriaTarefa,
      quantidadeContratada: sc.quantidade,
      rolloverAnterior,
      quantidadeEfetiva,
      totalNoMes: tarefasDoMes.length,
      saldo: quantidadeEfetiva - tarefasDoMes.length,
      buckets,
    };
  });
}
