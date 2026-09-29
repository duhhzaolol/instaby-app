// Lógica compartilhada do módulo de Tráfego Pago (v151) — status interno, avaliação,
// saldo/verba por cliente e agregação de métricas sem misturar indicadores diferentes.
// Usado pelas rotas de API e pelas telas novas (Visão Geral, Campanhas, Finalizadas,
// Verba e Movimentações, Histórico de Importações, Relatórios).
import { prisma } from "@/lib/prisma";

// ───────────────────────────── Status interno ─────────────────────────────
// `Campanha.statusInterno` é o controle de verdade a partir daqui. `Campanha.status`
// (o campo antigo, "ativa"/"pausada"/"encerrada") é mantido em espelho só pra não
// quebrar quem ainda lê ele: o Início do gestor de tráfego (app/dashboard/page.tsx)
// e o alerta de criativos pendentes, ambos com `where: { status: "ativa" }`.
export const STATUS_INTERNO = ["em_acompanhamento", "pausada", "finalizada", "arquivada"] as const;
export type StatusInterno = (typeof STATUS_INTERNO)[number];

export const STATUS_INTERNO_LABEL: Record<string, string> = {
  em_acompanhamento: "Em acompanhamento",
  pausada: "Pausada",
  finalizada: "Finalizada",
  arquivada: "Arquivada",
};

export function statusInternoValido(v: string): v is StatusInterno {
  return (STATUS_INTERNO as readonly string[]).includes(v);
}

// Projeção do status interno pro campo legado — usada em toda escrita de
// statusInterno (criação, edição, importação) pra manter os dois em sincronia.
export function mapStatusInternoParaLegado(statusInterno: string): string {
  if (statusInterno === "pausada") return "pausada";
  if (statusInterno === "finalizada" || statusInterno === "arquivada") return "encerrada";
  return "ativa"; // em_acompanhamento (ou qualquer valor desconhecido, por segurança)
}

// Projeção inversa — só usada uma vez, pra decidir o statusInterno inicial de uma
// campanha criada antes da v151 (que só tinha o campo legado preenchido).
export function mapStatusLegadoParaInterno(status: string): StatusInterno {
  if (status === "pausada") return "pausada";
  if (status === "encerrada") return "finalizada";
  return "em_acompanhamento";
}

// Sincroniza os dois campos a partir do que a rota recebeu — usada em toda criação/
// edição de Campanha. Durante a transição, o formulário antigo (TrafegoClient.tsx)
// ainda manda só `status`; as telas novas mandam `statusInterno`. Se os dois vierem
// juntos, statusInterno manda (é o campo de verdade a partir da v151).
// Retorna null se nenhum dos dois campos foi enviado (quem chama deve omitir os dois
// do update/create nesse caso) ou "invalido" se statusInterno veio com um valor fora
// da lista — quem chama decide como reportar isso (400, etc.).
export function sincronizarStatus(
  body: { status?: string; statusInterno?: string }
): { status: string; statusInterno: StatusInterno } | "invalido" | null {
  if (body.statusInterno !== undefined) {
    if (!statusInternoValido(body.statusInterno)) return "invalido";
    return { status: mapStatusInternoParaLegado(body.statusInterno), statusInterno: body.statusInterno };
  }
  if (body.status !== undefined) {
    return { status: body.status, statusInterno: mapStatusLegadoParaInterno(body.status) };
  }
  return null;
}

// statusInterno "de verdade" de uma campanha, corrigindo uma armadilha de migração:
// quando a coluna statusInterno foi criada (v151), um `prisma db push` preenche
// colunas novas com o valor de @default pra TODA linha já existente — é o literal
// "em_acompanhamento", não a projeção do status legado dela. Então uma campanha que já
// estava "pausada" ou "encerrada" antes da v151 ficou com statusInterno="em_acompanhamento"
// (errado) e status="pausada"/"encerrada" (o valor de verdade, intacto). Como
// sincronizarStatus sempre grava os dois campos juntos a partir da v151, a única forma
// de statusInterno ficar em "em_acompanhamento" enquanto status não é "ativa" é essa
// campanha nunca ter passado por um write novo — ou seja, é exatamente o caso a corrigir.
export function statusInternoEfetivo(c: { status: string; statusInterno: string }): StatusInterno {
  if (c.statusInterno !== "em_acompanhamento") {
    return statusInternoValido(c.statusInterno) ? c.statusInterno : "em_acompanhamento";
  }
  if (c.status !== "ativa") return mapStatusLegadoParaInterno(c.status);
  return "em_acompanhamento";
}

// Aplica statusInternoEfetivo numa lista de campanhas recém-buscada e já devolve os
// valores certos pra essa renderização (nunca espera nada de rede) — e, em paralelo,
// tenta corrigir no banco de uma vez por todas as linhas que precisarem, sem bloquear
// nem derrubar a página se a escrita falhar. Depois da primeira correção, a campanha
// já fica com o valor certo gravado e para de precisar dessa ponte.
export function repararStatusInternoLegado<T extends { id: string; status: string; statusInterno: string }>(
  campanhas: T[]
): T[] {
  const idsParaCorrigir: { id: string; statusInterno: StatusInterno }[] = [];
  const corrigidas = campanhas.map((c) => {
    const efetivo = statusInternoEfetivo(c);
    if (efetivo === c.statusInterno) return c;
    idsParaCorrigir.push({ id: c.id, statusInterno: efetivo });
    return { ...c, statusInterno: efetivo };
  });
  if (idsParaCorrigir.length > 0) {
    Promise.all(
      idsParaCorrigir.map((item) =>
        prisma.campanha
          .update({
            where: { id: item.id },
            data: { statusInterno: item.statusInterno, status: mapStatusInternoParaLegado(item.statusInterno) },
          })
          .catch(() => {})
      )
    ).catch(() => {});
  }
  return corrigidas;
}

// ───────────────────────────── Avaliação ─────────────────────────────
export const AVALIACAO = ["nao_avaliada", "dentro_da_meta", "abaixo_da_meta", "inconclusiva"] as const;
export type Avaliacao = (typeof AVALIACAO)[number];

export const AVALIACAO_LABEL: Record<string, string> = {
  nao_avaliada: "Não avaliada",
  dentro_da_meta: "Dentro da meta",
  abaixo_da_meta: "Abaixo da meta",
  inconclusiva: "Inconclusiva",
};

export function avaliacaoValida(v: string): v is Avaliacao {
  return (AVALIACAO as readonly string[]).includes(v);
}

// ───────────────────────────── Indicadores de resultado ─────────────────────────────
// Nomes técnicos que o Meta usa em "Indicador de resultados" — traduzidos só pra leitura;
// o valor original continua guardado e é o que decide se dois números podem ser somados
// (nunca somamos `resultados` de indicadores diferentes entre si).
export const INDICADOR_LABEL: Record<string, string> = {
  "actions:onsite_conversion.messaging_conversation_started_7d": "Conversas iniciadas por mensagem",
  "actions:onsite_conversion.total_messaging_connection": "Conexões de mensagem",
  "actions:post_engagement": "Engajamentos com a publicação",
  "actions:link_click": "Cliques no link",
  "actions:landing_page_view": "Visualizações da página de destino",
  "actions:offsite_conversion.fb_pixel_purchase": "Compras (pixel)",
  video_thruplay_watched_actions: "Visualizações do vídeo (ThruPlay)",
  reach: "Contas alcançadas",
  impressions: "Impressões",
};

export function labelIndicador(indicador: string | null | undefined): string {
  if (!indicador) return "não informado";
  return INDICADOR_LABEL[indicador] || indicador;
}

export function formatarNumeroOuNaoInformado(v: number | null | undefined): string {
  if (v === null || v === undefined) return "não informado";
  return v.toLocaleString("pt-BR");
}

// Agrupa "resultados" por indicador — nunca soma tipos diferentes (conversa, engajamento,
// visualização de vídeo etc. são unidades incompatíveis). Linhas sem indicador OU sem
// resultado numérico ficam de fora da soma (aparecem como "não informado" na tela, não como 0).
export type GrupoResultado = { indicador: string; label: string; total: number; qtdCampanhas: number };

export function agruparResultadosPorIndicador(
  linhas: { indicadorResultado: string | null | undefined; resultados: number | null | undefined }[]
): GrupoResultado[] {
  const porIndicador = new Map<string, { total: number; qtd: number }>();
  linhas.forEach((l) => {
    if (l.resultados === null || l.resultados === undefined) return;
    const chave = l.indicadorResultado || "(sem indicador)";
    const atual = porIndicador.get(chave) || { total: 0, qtd: 0 };
    porIndicador.set(chave, { total: atual.total + l.resultados, qtd: atual.qtd + 1 });
  });
  return Array.from(porIndicador.entries())
    .map(([indicador, v]) => ({ indicador, label: labelIndicador(indicador), total: v.total, qtdCampanhas: v.qtd }))
    .sort((a, b) => b.total - a.total);
}

// ───────────────────────────── Ledger de gasto acumulado ─────────────────────────────
// O CSV do Meta é acumulado desde o dia 1 do mês — cada campanha tem, POR MÊS, um único
// "gasto acumulado até agora" que só faz sentido comparar dentro do mesmo mês (no mês
// seguinte a contagem do Meta reinicia do zero). Por isso o ledger é sempre por
// (campanha, ano, mês): a fonte da verdade é o histórico em ItemImportacao (nunca um
// contador solto que alguém poderia sobrescrever); campanhas/meses de antes da v151
// (sem nenhum ItemImportacao ainda) caem no legado ResultadoCampanha como ponte.

export type UltimoAcumulo = { valor: number; periodoFim: Date | null; origem: "novo" | "legado" | "nenhum" };

// Usado durante a prévia/confirmação de importação: "o que o sistema já sabia" pra UM
// mês específico, antes do arquivo que está sendo importado agora. `antesDe` limita a
// busca a lotes com período-fim ANTERIOR a essa data — usado só no caso de "arquivo
// antigo" (spec §1): aí o "gasto anterior" certo não é o valor mais recente que existe
// (que é de um período mais novo), e sim o que já se sabia até o momento cronológico
// desse arquivo antigo, pra o incremento calculado fazer sentido como correção.
export async function ultimoAcumuloDoMes(
  campanhaId: string,
  ano: number,
  mesIndex0: number,
  antesDe?: Date
): Promise<UltimoAcumulo> {
  const inicioMes = new Date(Date.UTC(ano, mesIndex0, 1));
  const inicioProximoMes = new Date(Date.UTC(ano, mesIndex0 + 1, 1));

  const itens = await prisma.itemImportacao.findMany({
    where: {
      campanhaId,
      lote: {
        periodoInicio: { gte: inicioMes, lt: inicioProximoMes },
        ...(antesDe ? { periodoFim: { lt: antesDe } } : {}),
      },
    },
    include: { lote: { select: { periodoFim: true } } },
  });

  if (itens.length > 0) {
    // Em empate de período-fim (reimportação do mesmo período), desempata pelo
    // criado mais recentemente — a última correção gravada é a que vale.
    const maisRecente = itens.reduce((a: any, b: any) => {
      if (b.lote.periodoFim.getTime() !== a.lote.periodoFim.getTime()) return b.lote.periodoFim > a.lote.periodoFim ? b : a;
      return b.createdAt > a.createdAt ? b : a;
    });
    return { valor: Number(maisRecente.gastoAcumuladoArquivo), periodoFim: maisRecente.lote.periodoFim, origem: "novo" };
  }

  const legado = await prisma.resultadoCampanha.findMany({
    where: {
      campanhaId,
      origem: "meta_import",
      inicio: { gte: inicioMes, lt: inicioProximoMes },
      ...(antesDe ? { fim: { lt: antesDe } } : {}),
    },
    select: { fim: true, verbaInvestida: true, createdAt: true },
  });
  if (legado.length === 0) return { valor: 0, periodoFim: null, origem: "nenhum" };
  const maisRecenteLegado = legado.reduce((a: any, b: any) => {
    if (b.fim.getTime() !== a.fim.getTime()) return b.fim > a.fim ? b : a;
    return b.createdAt > a.createdAt ? b : a;
  });
  return {
    valor: maisRecenteLegado.verbaInvestida ? Number(maisRecenteLegado.verbaInvestida) : 0,
    periodoFim: maisRecenteLegado.fim,
    origem: "legado",
  };
}

// Gasto acumulado TOTAL de uma campanha desde sempre (soma o "último valor conhecido"
// de cada mês, novo ledger com prioridade sobre o legado no mesmo mês) — é isso que
// entra no cálculo do saldo do cliente. Arquivar/finalizar a campanha não muda essa
// conta: ela não filtra por statusInterno.
export async function gastoAcumuladoTotalCampanha(campanhaId: string): Promise<number> {
  const itens = await prisma.itemImportacao.findMany({
    where: { campanhaId },
    include: { lote: { select: { periodoInicio: true, periodoFim: true } } },
  });
  const porMes = new Map<string, { periodoFim: Date; criadoEm: Date; valor: number }>();
  itens.forEach((item: any) => {
    const d = item.lote.periodoInicio as Date;
    const chave = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const atual = porMes.get(chave);
    // Em empate de período-fim (ex: reimportação do mesmo período com um valor
    // corrigido pelo Meta), desempata por criado mais recentemente — mesma regra de
    // ultimoAcumuloDoMes ("a última correção gravada é a que vale"). Sem isso, a ordem
    // de retorno do findMany (não garantida) poderia escolher a correção antiga.
    const ganha =
      !atual ||
      item.lote.periodoFim.getTime() > atual.periodoFim.getTime() ||
      (item.lote.periodoFim.getTime() === atual.periodoFim.getTime() && item.createdAt.getTime() > atual.criadoEm.getTime());
    if (ganha) {
      porMes.set(chave, { periodoFim: item.lote.periodoFim, criadoEm: item.createdAt, valor: Number(item.gastoAcumuladoArquivo) });
    }
  });

  const legado = await prisma.resultadoCampanha.findMany({
    where: { campanhaId, origem: "meta_import" },
    select: { inicio: true, fim: true, verbaInvestida: true },
  });
  const porMesLegado = new Map<string, { fim: Date; valor: number }>();
  legado.forEach((r: any) => {
    const chave = `${r.inicio.getUTCFullYear()}-${r.inicio.getUTCMonth()}`;
    const atual = porMesLegado.get(chave);
    if (!atual || r.fim > atual.fim) {
      porMesLegado.set(chave, { fim: r.fim, valor: r.verbaInvestida ? Number(r.verbaInvestida) : 0 });
    }
  });

  const todasAsChaves = Array.from(new Set([...Array.from(porMes.keys()), ...Array.from(porMesLegado.keys())]));
  let total = 0;
  todasAsChaves.forEach((chave) => {
    const doNovo = porMes.get(chave);
    if (doNovo) total += doNovo.valor;
    else {
      const doLegado = porMesLegado.get(chave);
      if (doLegado) total += doLegado.valor;
    }
  });
  return total;
}

export type SnapshotCampanha = {
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: GrupoResultado[];
  dataAtualizacao: Date | null; // periodoFim do lote mais recente considerado
  temDados: boolean;
};

// "Estado atual" de uma campanha dentro de um período — usado na Visão Geral, na
// tela de Campanhas e na geração de Relatórios. Como o Meta manda tudo acumulado
// desde o dia 1 do mês, o "total do período" nunca é uma soma de linhas: é a leitura
// mais recente disponível dentro do período pedido, por mês (mesma regra do gasto —
// ver gastoAcumuladoTotalCampanha), sem olhar nenhuma importação posterior a
// `ateData` — assim um relatório de um mês fechado nunca inclui dado de depois.
export async function snapshotCampanhaNoPeriodo(
  campanhaId: string,
  desde: Date,
  ateData: Date
): Promise<SnapshotCampanha> {
  const itens = await prisma.itemImportacao.findMany({
    where: { campanhaId, lote: { periodoInicio: { gte: desde }, periodoFim: { lte: ateData } } },
    include: { lote: { select: { periodoInicio: true, periodoFim: true } } },
  });

  const porMes = new Map<string, { periodoFim: Date; item: any }>();
  itens.forEach((item: any) => {
    const d = item.lote.periodoInicio as Date;
    const chave = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const atual = porMes.get(chave);
    // Mesmo desempate por criado-mais-recente de gastoAcumuladoTotalCampanha (ver lá) —
    // garante que uma correção reimportada pro mesmo período sempre vence, independente
    // da ordem em que o findMany devolveu as linhas.
    const ganha =
      !atual ||
      item.lote.periodoFim.getTime() > atual.periodoFim.getTime() ||
      (item.lote.periodoFim.getTime() === atual.periodoFim.getTime() && item.createdAt.getTime() > atual.item.createdAt.getTime());
    if (ganha) {
      porMes.set(chave, { periodoFim: item.lote.periodoFim, item });
    }
  });

  const escolhidos = Array.from(porMes.values());
  if (escolhidos.length === 0) {
    return { gasto: 0, impressoes: null, alcance: null, resultadosPorIndicador: [], dataAtualizacao: null, temDados: false };
  }

  const gasto = escolhidos.reduce((s, v) => s + Number(v.item.gastoAcumuladoArquivo), 0);
  const temImpressoes = escolhidos.some((v) => v.item.impressoes != null);
  const temAlcance = escolhidos.some((v) => v.item.alcance != null);
  const impressoes = temImpressoes ? escolhidos.reduce((s, v) => s + (v.item.impressoes || 0), 0) : null;
  const alcance = temAlcance ? escolhidos.reduce((s, v) => s + (v.item.alcance || 0), 0) : null;
  const resultadosPorIndicador = agruparResultadosPorIndicador(escolhidos.map((v) => v.item));
  const dataAtualizacao = escolhidos.reduce((max: Date, v) => (v.periodoFim > max ? v.periodoFim : max), escolhidos[0].periodoFim);

  return { gasto, impressoes, alcance, resultadosPorIndicador, dataAtualizacao, temDados: true };
}

// Atalho pras telas de estado ATUAL (Visão Geral, Campanhas): mês corrente, sem
// limite superior de data — a leitura mais recente que existir esse mês.
export function snapshotCampanhaAtual(campanhaId: string): Promise<SnapshotCampanha> {
  const hoje = new Date();
  const inicioMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const daquiUmAno = new Date(Date.UTC(hoje.getUTCFullYear() + 1, hoje.getUTCMonth(), 1));
  return snapshotCampanhaNoPeriodo(campanhaId, inicioMes, daquiUmAno);
}

// Atalho pra tela de Finalizadas: soma o histórico inteiro da campanha (todos os
// meses), não só o mês corrente — é o número "final" que faz sentido mostrar pra
// uma campanha que não está mais em acompanhamento ativo.
export function snapshotCampanhaTotal(campanhaId: string): Promise<SnapshotCampanha> {
  return snapshotCampanhaNoPeriodo(campanhaId, new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2100, 0, 1)));
}

// ───────────────────────────── Verba e saldo do cliente ─────────────────────────────
export type ResumoSaldoCliente = {
  temVerbaCadastrada: boolean;
  saldoInicial: number;
  totalAportes: number;
  totalDevolucoes: number;
  totalAjustes: number;
  totalSaldoTransportado: number;
  gastoAcumulado: number;
  saldoRestante: number;
};

// Soma o gasto acumulado (ver acima) de TODAS as campanhas de mídia paga do cliente,
// independente de statusInterno — arquivar/finalizar uma campanha nunca tira o gasto
// dela dessa conta.
export async function calcularSaldoCliente(clienteId: string): Promise<ResumoSaldoCliente> {
  const [verba, campanhas] = await Promise.all([
    prisma.verbaTrafego.findUnique({
      where: { clienteId },
      include: { movimentacoes: { orderBy: { dataMovimento: "desc" } } },
    }),
    prisma.campanha.findMany({ where: { clienteId }, select: { id: true } }),
  ]);

  const gastos = await Promise.all(campanhas.map((c: any) => gastoAcumuladoTotalCampanha(c.id)));
  const gastoAcumulado = gastos.reduce((s: number, v: number) => s + v, 0);

  const movimentacoes = verba?.movimentacoes || [];
  const somaPorTipo = (tipo: string) =>
    movimentacoes.filter((m: any) => m.tipo === tipo).reduce((s: number, m: any) => s + Number(m.valor), 0);

  const saldoInicial = verba ? Number(verba.saldoInicial) : 0;
  const totalAportes = somaPorTipo("aporte");
  const totalDevolucoes = somaPorTipo("devolucao");
  const totalAjustes = somaPorTipo("ajuste");
  const totalSaldoTransportado = somaPorTipo("saldo_transportado");
  // Fórmula exatamente como pedida: "saldo inicial + aportes − gasto acumulado −
  // devoluções ou outros ajustes identificados". Cada movimentação é lançada com
  // valor sempre positivo (a magnitude) — o TIPO decide se soma ou subtrai aqui,
  // não o sinal que a pessoa digitou. Saldo transportado soma, como um aporte
  // (é o saldo do mês anterior entrando de novo no controle do mês novo).
  const saldoRestante =
    saldoInicial + totalAportes + totalSaldoTransportado - totalDevolucoes - totalAjustes - gastoAcumulado;

  return {
    temVerbaCadastrada: !!verba,
    saldoInicial,
    totalAportes,
    totalDevolucoes,
    totalAjustes,
    totalSaldoTransportado,
    gastoAcumulado,
    saldoRestante,
  };
}

// ───────────────────────────── Conciliação de identidade ─────────────────────────────
// Chave usada quando o CSV não tem ID de campanha: nome + configuração de atribuição,
// normalizados. Sozinho o nome não basta (o mesmo nome pode aparecer 2x com atribuições
// diferentes — ver AQUISICAO no CSV de exemplo); essa dupla já resolve esse caso, mas
// quando mesmo assim colidir (2 campanhas com nome E atribuição iguais), cai pra
// conferência manual — nunca é decidido sozinho.
export function normalizarTextoChave(texto: string | null | undefined): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function gerarChaveCorrespondencia(nome: string, configAtribuicao: string | null | undefined): string {
  return `${normalizarTextoChave(nome)}||${normalizarTextoChave(configAtribuicao)}`;
}

// ───────────────────────────── Relatórios ─────────────────────────────
// Cálculo compartilhado entre a prévia (nunca grava nada) e a geração de verdade
// (grava uma versão nova e preservada) — pra nunca existir dois jeitos de calcular o
// mesmo número. Selecionar campanhas aqui é só leitura: não muda o saldo do cliente.
export type CampanhaSnapshotRelatorio = {
  campanhaId: string;
  nome: string;
  objetivo: string | null;
  statusInterno: string;
  avaliacao: string;
  avaliacaoObjetivo: string | null;
  avaliacaoMeta: string | null;
  avaliacaoObservacoes: string | null;
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: GrupoResultado[];
  dataAtualizacao: string | null;
  temDados: boolean;
};

export type ResultadoSnapshotRelatorio = {
  porCampanha: CampanhaSnapshotRelatorio[];
  investimentoTotal: number;
  dataAtualizacaoDados: string;
  parcial: boolean;
};

export async function computarSnapshotRelatorio(
  clienteId: string,
  campanhaIds: string[],
  periodoInicio: Date,
  periodoFim: Date
): Promise<ResultadoSnapshotRelatorio> {
  const campanhas = await prisma.campanha.findMany({
    where: { id: { in: campanhaIds }, clienteId },
    select: {
      id: true,
      nome: true,
      objetivo: true,
      statusInterno: true,
      status: true,
      avaliacao: true,
      avaliacaoObjetivo: true,
      avaliacaoMeta: true,
      avaliacaoObservacoes: true,
    },
  });

  const porCampanha: CampanhaSnapshotRelatorio[] = await Promise.all(
    campanhas.map(async (c: any) => {
      const snap = await snapshotCampanhaNoPeriodo(c.id, periodoInicio, periodoFim);
      return {
        campanhaId: c.id,
        nome: c.nome,
        objetivo: c.objetivo,
        statusInterno: statusInternoEfetivo(c),
        avaliacao: c.avaliacao,
        avaliacaoObjetivo: c.avaliacaoObjetivo,
        avaliacaoMeta: c.avaliacaoMeta,
        avaliacaoObservacoes: c.avaliacaoObservacoes,
        gasto: snap.gasto,
        impressoes: snap.impressoes,
        alcance: snap.alcance,
        resultadosPorIndicador: snap.resultadosPorIndicador,
        dataAtualizacao: snap.dataAtualizacao ? snap.dataAtualizacao.toISOString() : null,
        temDados: snap.temDados,
      };
    })
  );

  const investimentoTotal = porCampanha.reduce((s, c) => s + c.gasto, 0);
  const datasAtualizacao = porCampanha.map((c) => c.dataAtualizacao).filter((d): d is string => !!d);
  const dataAtualizacaoDados =
    datasAtualizacao.length > 0 ? datasAtualizacao.sort().reverse()[0] : new Date().toISOString();
  // Parcial = alguma campanha selecionada não tem nenhum dado no período, ou os dados
  // disponíveis não chegam até o fim do período pedido (spec §6).
  const parcial = porCampanha.some((c) => !c.temDados) || !datasAtualizacao.every((d) => new Date(d) >= periodoFim);

  return { porCampanha, investimentoTotal, dataAtualizacaoDados, parcial };
}
