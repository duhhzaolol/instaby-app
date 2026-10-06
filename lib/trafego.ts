// Lógica compartilhada do módulo de Tráfego Pago (v151) — status interno, avaliação,
// saldo/verba por cliente e agregação de métricas sem misturar indicadores diferentes.
// Usado pelas rotas de API e pelas telas novas (Visão Geral, Campanhas, Finalizadas,
// Verba e Movimentações, Histórico de Importações, Relatórios).
import { agruparPorMes } from "@/lib/agregarResultadosCampanha";
import { prisma } from "@/lib/prisma";
import { labelIndicador } from "@/lib/indicadoresMeta";

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
export { INDICADOR_LABEL, labelIndicador } from "@/lib/indicadoresMeta";

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
  const legado = await prisma.resultadoCampanha.findMany({
    where: { campanhaId, origem: "meta_import" },
    select: { inicio: true, fim: true, verbaInvestida: true, createdAt: true },
  });
  const linhas = [
    ...legado.map((r) => ({ ...r, campanhaId, verbaInvestida: Number(r.verbaInvestida || 0), impressoes: null, alcance: null, resultados: null, planosFechados: null, valorRetorno: null })),
    ...itens.map((item) => ({ campanhaId, inicio: item.lote.periodoInicio, fim: item.lote.periodoFim, createdAt: item.createdAt, verbaInvestida: Number(item.gastoAcumuladoArquivo), impressoes: null, alcance: null, resultados: null, planosFechados: null, valorRetorno: null })),
  ];
  return agruparPorMes(linhas).reduce((total, r) => total + r.verbaInvestida, 0);
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
  return (await snapshotsCampanhasNoPeriodo([campanhaId], desde, ateData)).get(campanhaId)!;
}

// Carrega o período em lote, também para filtrar a seleção do relatório antes
// da prévia. O histórico legado é ponte somente onde ainda não existe ledger.
export async function snapshotsCampanhasNoPeriodo(ids: string[], desde: Date, ateData: Date): Promise<Map<string, SnapshotCampanha>> {
  const vazio = (): SnapshotCampanha => ({ gasto: 0, impressoes: null, alcance: null, resultadosPorIndicador: [], dataAtualizacao: null, temDados: false });
  const mapa = new Map(ids.map((id) => [id, vazio()]));
  if (!ids.length) return mapa;
  const [itens, legado] = await Promise.all([
    prisma.itemImportacao.findMany({ where: { campanhaId: { in: ids }, lote: { periodoInicio: { gte: desde }, periodoFim: { lte: ateData } } }, include: { lote: { select: { periodoInicio: true, periodoFim: true } } } }),
    prisma.resultadoCampanha.findMany({ where: { campanhaId: { in: ids }, origem: "meta_import", inicio: { gte: desde }, fim: { lte: ateData } } }),
  ]);
  const ultimoFimLedger = new Map<string, Date>();
  for (const i of itens) {
    const chave = `${i.campanhaId}|${i.lote.periodoInicio.toISOString().slice(0,7)}`;
    const anterior = ultimoFimLedger.get(chave);
    if (!anterior || i.lote.periodoFim > anterior) ultimoFimLedger.set(chave, i.lote.periodoFim);
  }
  const linhas = [
    ...itens.map((i) => ({ campanhaId: i.campanhaId!, inicio: i.lote.periodoInicio, fim: i.lote.periodoFim, createdAt: i.createdAt, verbaInvestida: Number(i.gastoAcumuladoArquivo), impressoes: i.impressoes, alcance: i.alcance, resultados: i.resultados, indicadorResultado: i.indicadorResultado, planosFechados: null, valorRetorno: null })),
    ...legado.filter((r) => { const ultimo = ultimoFimLedger.get(`${r.campanhaId}|${r.inicio.toISOString().slice(0,7)}`); return !ultimo || r.fim > ultimo; }).map((r) => ({ ...r, verbaInvestida: Number(r.verbaInvestida || 0), valorRetorno: r.valorRetorno == null ? null : Number(r.valorRetorno) })),
  ];
  const porCampanha = new Map<string, typeof linhas>();
  for (const r of agruparPorMes(linhas)) {
    const grupo = porCampanha.get(r.campanhaId) || [];
    grupo.push(r); porCampanha.set(r.campanhaId, grupo);
  }
  for (const [id, rows] of Array.from(porCampanha)) {
    mapa.set(id, { gasto: rows.reduce((t,r) => t + r.verbaInvestida,0), impressoes: rows.some((r) => r.impressoes != null) ? rows.reduce((t,r) => t + (r.impressoes || 0),0) : null, alcance: rows.length === 1 ? rows[0].alcance : null,
      resultadosPorIndicador: agruparResultadosPorIndicador(rows), dataAtualizacao: rows.reduce((d,r) => r.fim > d ? r.fim : d, rows[0].fim), temDados: true });
  }
  return mapa;
}

// Atalho pras telas de estado ATUAL (Visão Geral, Campanhas): mês corrente, sem
// limite superior de data — a leitura mais recente que existir esse mês.
export async function snapshotCampanhaAtual(campanhaId: string): Promise<SnapshotCampanha> {
  const ultimo = await prisma.itemImportacao.findFirst({ where: { campanhaId }, orderBy: [{ lote: { periodoFim: "desc" } }, { createdAt: "desc" }], include: { lote: { select: { periodoInicio: true, periodoFim: true } } } });
  if (!ultimo) return { gasto: 0, impressoes: null, alcance: null, resultadosPorIndicador: [], dataAtualizacao: null, temDados: false };
  const d = ultimo.lote.periodoFim;
  return snapshotCampanhaNoPeriodo(campanhaId, new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)), new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)));
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
  gastosPorMes: { mes: string; gasto: number }[];
  gastoHistorico: number;
  inicioControle: string | null;
  saldoRestante: number;
};

// Soma o gasto acumulado (ver acima) de TODAS as campanhas de mídia paga do cliente,
// independente de statusInterno — arquivar/finalizar uma campanha nunca tira o gasto
// dela dessa conta.
export async function calcularSaldoCliente(clienteId: string): Promise<ResumoSaldoCliente> {
  const [verba, legado, itens] = await Promise.all([
    prisma.verbaTrafego.findUnique({ where: { clienteId }, include: { movimentacoes: { orderBy: { dataMovimento: "desc" } } } }),
    prisma.resultadoCampanha.findMany({ where: { campanha: { clienteId }, origem: "meta_import" }, select: { campanhaId: true, inicio: true, fim: true, verbaInvestida: true, createdAt: true } }),
    prisma.itemImportacao.findMany({ where: { lote: { clienteId }, campanhaId: { not: null } }, include: { lote: { select: { periodoInicio: true, periodoFim: true } } } }),
  ]);
  const linhas = [
    ...legado.map((r) => ({ ...r, verbaInvestida: Number(r.verbaInvestida || 0), impressoes: null, alcance: null, resultados: null, planosFechados: null, valorRetorno: null })),
    ...itens.map((i) => ({ campanhaId: i.campanhaId!, inicio: i.lote.periodoInicio, fim: i.lote.periodoFim, createdAt: i.createdAt, verbaInvestida: Number(i.gastoAcumuladoArquivo), impressoes: null, alcance: null, resultados: null, planosFechados: null, valorRetorno: null })),
  ];
  const porMes = new Map<string, number>();
  for (const r of agruparPorMes(linhas)) {
    const mes = new Date(r.fim).toISOString().slice(0,7);
    porMes.set(mes, (porMes.get(mes) || 0) + r.verbaInvestida);
  }
  const gastosPorMes = Array.from(porMes, ([mes, gasto]) => ({ mes, gasto: Math.round(gasto * 100) / 100 })).sort((a,b) => b.mes.localeCompare(a.mes));
  const gastoHistorico = gastosPorMes.reduce((t, r) => t + r.gasto, 0);
  const inicioControle = verba?.inicioControle?.toISOString().slice(0,10) || null;
  const gastoAcumulado = gastosPorMes.filter((r) => !inicioControle || r.mes >= inicioControle.slice(0,7)).reduce((t,r) => t+r.gasto,0);

  const movimentacoes = (verba?.movimentacoes || []).filter((m) => !verba?.inicioControle || m.dataMovimento >= verba.inicioControle);
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
  const saldoRestante = Math.round((saldoInicial + totalAportes + totalSaldoTransportado - totalDevolucoes - totalAjustes - gastoAcumulado) * 100) / 100;

  return {
    temVerbaCadastrada: !!verba,
    saldoInicial,
    totalAportes,
    totalDevolucoes,
    totalAjustes,
    totalSaldoTransportado,
    gastoAcumulado,
    gastosPorMes,
    gastoHistorico,
    inicioControle,
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

  const snapshots = await snapshotsCampanhasNoPeriodo(campanhas.map((c) => c.id), periodoInicio, periodoFim);
  const porCampanha: CampanhaSnapshotRelatorio[] = await Promise.all(
    campanhas.map(async (c: any) => {
      const snap = snapshots.get(c.id)!;
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
