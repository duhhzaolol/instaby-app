// Motor de conciliação da importação do Meta (v151) — usado tanto pela prévia
// (/api/campanhas/importar-meta/preview, que não grava nada) quanto pela confirmação
// (/api/campanhas/importar-meta/confirmar, que grava tudo de uma vez). As duas rotas
// reprocessam o arquivo aqui — nunca confiam em números que o cliente (navegador) já
// tenha calculado, só na escolha humana de conciliação de linhas ambíguas.
import { prisma } from "@/lib/prisma";
import {
  processarTextoCsv,
  processarBufferXlsx,
  type LinhaCampanhaMeta,
  type ResultadoImportacaoMeta,
} from "@/lib/parseCampanhasMeta";
import { gerarChaveCorrespondencia, normalizarTextoChave, ultimoAcumuloDoMes } from "@/lib/trafego";

export type CandidatoCampanha = { id: string; nome: string; statusInterno: string };

export type ResolucaoLinha = "auto_id" | "auto_chave" | "manual" | "nova_campanha" | "pendente";

export type LinhaResolvida = {
  linhaIndex: number;
  linha: LinhaCampanhaMeta;
  campanhaId: string | null; // null enquanto "pendente" ou "nova_campanha" (ainda não criada)
  campanhaNomeAtual: string | null;
  resolucao: ResolucaoLinha;
  motivoAmbiguidade: string | null;
  candidatos: CandidatoCampanha[];
  gastoAnterior: number;
  gastoIncremental: number;
  correcaoNegativa: boolean; // gastoIncremental < 0 — o Meta reduziu um valor já reportado antes
};

export type PreviaImportacao = {
  clienteId: string;
  nomeArquivo: string;
  contaAnuncios: string | null;
  periodoInicio: string;
  periodoFim: string;
  arquivoAntigo: boolean;
  ultimoPeriodoFimConfirmado: string | null;
  linhasTotal: number;
  linhasIgnoradas: number;
  linhasComGasto: number;
  gastoTotalArquivo: number;
  colunasReconhecidas: string[];
  temIdExterno: boolean;
  linhas: LinhaResolvida[];
  pendentes: number;
};

function detectarConteudo(nomeArquivo: string, conteudoBase64: string): ResultadoImportacaoMeta | null {
  const buffer = Buffer.from(conteudoBase64, "base64");
  const nome = nomeArquivo.toLowerCase();
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) {
    return processarBufferXlsx(buffer);
  }
  return processarTextoCsv(buffer.toString("utf-8"));
}

// Resolve a identidade de cada linha contra as campanhas já cadastradas desse cliente.
// resolucoesManuais (linhaIndex -> campanhaId existente OU "nova") só é usado na
// confirmação, depois que o humano decidiu as linhas que a prévia marcou como pendentes.
async function resolverLinhas(
  clienteId: string,
  linhas: LinhaCampanhaMeta[],
  resolucoesManuais: Record<number, string>
): Promise<Omit<LinhaResolvida, "gastoAnterior" | "gastoIncremental" | "correcaoNegativa">[]> {
  const existentes = await prisma.campanha.findMany({
    where: { clienteId, plataforma: "meta_ads" },
    select: { id: true, nome: true, statusInterno: true, idExternoMeta: true, chaveCorrespondencia: true, nomesOriginaisMeta: true },
  });

  const porId = new Map<string, (typeof existentes)[number]>();
  const porChave = new Map<string, (typeof existentes)[number][]>();
  const porNomeNormalizado = new Map<string, (typeof existentes)[number][]>();
  existentes.forEach((c: any) => {
    if (c.idExternoMeta) porId.set(c.idExternoMeta, c);
    if (c.chaveCorrespondencia) {
      const lista = porChave.get(c.chaveCorrespondencia) || [];
      lista.push(c);
      porChave.set(c.chaveCorrespondencia, lista);
    }
    const chavesNome = new Set<string>([normalizarTextoChave(c.nome), ...c.nomesOriginaisMeta.map(normalizarTextoChave)]);
    Array.from(chavesNome).forEach((chaveNome) => {
      const lista = porNomeNormalizado.get(chaveNome) || [];
      lista.push(c);
      porNomeNormalizado.set(chaveNome, lista);
    });
  });

  // Conta ocorrências da mesma chave DENTRO deste arquivo — um nome duplicado no
  // próprio arquivo (ex: "AQUISICAO" com 2 atribuições diferentes) já gera chaves
  // diferentes e não cai aqui; mas se duas linhas do arquivo tiverem nome E atribuição
  // idênticos, não dá pra saber qual é qual — ambas ficam pendentes.
  const contagemChaveArquivo = new Map<string, number>();
  linhas.forEach((l) => {
    const chave = gerarChaveCorrespondencia(l.nome, l.configAtribuicao);
    contagemChaveArquivo.set(chave, (contagemChaveArquivo.get(chave) || 0) + 1);
  });

  return linhas.map((linha, linhaIndex) => {
    const escolhaManual = resolucoesManuais[linhaIndex];
    if (escolhaManual === "nova") {
      return {
        linhaIndex,
        linha,
        campanhaId: null,
        campanhaNomeAtual: null,
        resolucao: "nova_campanha" as const,
        motivoAmbiguidade: null,
        candidatos: [],
      };
    }
    if (escolhaManual) {
      const alvo = existentes.find((c: any) => c.id === escolhaManual);
      return {
        linhaIndex,
        linha,
        campanhaId: escolhaManual,
        campanhaNomeAtual: alvo?.nome || null,
        resolucao: "manual" as const,
        motivoAmbiguidade: null,
        candidatos: [],
      };
    }

    // 1) ID da campanha — identidade mais confiável que existe, quando o arquivo traz.
    if (linha.idExterno) {
      const porIdEncontrado = porId.get(linha.idExterno);
      if (porIdEncontrado) {
        return {
          linhaIndex,
          linha,
          campanhaId: porIdEncontrado.id,
          campanhaNomeAtual: porIdEncontrado.nome,
          resolucao: "auto_id" as const,
          motivoAmbiguidade: null,
          candidatos: [],
        };
      }
      // ID não bate com nada que já existe — é uma campanha nova de verdade, sem
      // ambiguidade possível (o ID não pode ser de outra campanha por engano).
      return {
        linhaIndex,
        linha,
        campanhaId: null,
        campanhaNomeAtual: null,
        resolucao: "nova_campanha" as const,
        motivoAmbiguidade: null,
        candidatos: [],
      };
    }

    // 2) Sem ID: nome + configuração de atribuição — só resolve sozinho quando bate
    // com EXATAMENTE uma campanha já existente.
    const chave = gerarChaveCorrespondencia(linha.nome, linha.configAtribuicao);
    const porChaveEncontrados = porChave.get(chave) || [];
    const duplicadoNoArquivo = (contagemChaveArquivo.get(chave) || 0) > 1;

    if (porChaveEncontrados.length === 1 && !duplicadoNoArquivo) {
      return {
        linhaIndex,
        linha,
        campanhaId: porChaveEncontrados[0].id,
        campanhaNomeAtual: porChaveEncontrados[0].nome,
        resolucao: "auto_chave" as const,
        motivoAmbiguidade: null,
        candidatos: [],
      };
    }

    // Ambíguo ou desconhecido — monta candidatos (por chave e por nome bruto/aprendido)
    // pra facilitar a escolha manual, mas nunca escolhe sozinho.
    const candidatosMap = new Map<string, CandidatoCampanha>();
    porChaveEncontrados.forEach((c: any) => candidatosMap.set(c.id, { id: c.id, nome: c.nome, statusInterno: c.statusInterno }));
    (porNomeNormalizado.get(normalizarTextoChave(linha.nome)) || []).forEach((c: any) =>
      candidatosMap.set(c.id, { id: c.id, nome: c.nome, statusInterno: c.statusInterno })
    );

    let motivo: string | null = null;
    if (duplicadoNoArquivo) motivo = "Esse nome (com essa mesma configuração de atribuição) aparece mais de uma vez neste arquivo.";
    else if (porChaveEncontrados.length > 1) motivo = "Mais de uma campanha cadastrada já usa esse nome e atribuição.";
    else if (candidatosMap.size > 0) motivo = "Nome parecido com campanha(s) já cadastrada(s), mas sem uma correspondência confiável (sem ID).";
    else motivo = "Nenhuma campanha correspondente encontrada — confirme se é uma campanha nova.";

    return {
      linhaIndex,
      linha,
      campanhaId: null,
      campanhaNomeAtual: null,
      resolucao: "pendente" as const,
      motivoAmbiguidade: motivo,
      candidatos: Array.from(candidatosMap.values()),
    };
  });
}

export async function montarPrevia(
  clienteId: string,
  nomeArquivo: string,
  conteudoBase64: string,
  resolucoesManuais: Record<number, string> = {}
): Promise<{ erro: string } | { previa: PreviaImportacao; resultado: ResultadoImportacaoMeta; loteId: string | null }> {
  const resultado = detectarConteudo(nomeArquivo, conteudoBase64);
  if (!resultado || resultado.linhas.length === 0) {
    if (resultado?.semDadosNoPeriodo) {
      return {
        erro:
          'O Meta não retornou nenhuma campanha pra esse período (o arquivo veio com "No data available.") — confira se o período do relatório exportado está certo antes de importar.',
      };
    }
    return { erro: "Não consegui reconhecer campanhas nesse arquivo — confere se é o export do Gerenciador de Anúncios do Meta." };
  }

  const datasInicio = resultado.linhas.map((l) => l.inicio).sort();
  const datasFim = resultado.linhas.map((l) => l.fim).sort();
  const periodoInicio = datasInicio[0];
  const periodoFim = datasFim[datasFim.length - 1];

  // A conciliação de gasto acumulado (ultimoAcumuloDoMes, lib/trafego.ts) usa o início de
  // cada linha pra decidir em qual mês aquele gasto entra. Num relatório CUMULATIVO (uma
  // linha por campanha cobrindo o período inteiro — diaADia === false), todas as linhas
  // compartilham o mesmo início/fim, e esse período precisa ser um mês calendário completo
  // começando no dia 1: senão o gasto do arquivo inteiro seria jogado no balde de um mês só,
  // mesmo quando o período realmente atravessa a virada do mês (ex: 25/ago a 23/set). Num
  // relatório dia a dia (diaADia === true) cada linha já traz sua própria data e cai no mês
  // certo sozinha, então essa checagem não se aplica.
  if (!resultado.diaADia) {
    const [anoInicio, mesInicio, diaInicio] = periodoInicio.split("-").map(Number);
    const [anoFim, mesFim] = periodoFim.split("-").map(Number);
    const mesmoMes = anoInicio === anoFim && mesInicio === mesFim;
    if (diaInicio !== 1 || !mesmoMes) {
      const inicioSugerido = `01/${String(mesInicio).padStart(2, "0")}/${anoInicio}`;
      return {
        erro:
          `Esse arquivo cobre de ${periodoInicio} até ${periodoFim}, período que não fica dentro de um único mês calendário começando no dia 1 — isso pode fazer o controle de gasto acumulado do mês ficar errado. ` +
          `Exporte de novo no Gerenciador de Anúncios do Meta com um período personalizado que comece em ${inicioSugerido} e não ultrapasse o fim desse mesmo mês, depois importe esse arquivo.`,
      };
    }
  }

  const ultimoLote = await prisma.loteImportacao.findFirst({
    where: { clienteId },
    orderBy: { periodoFim: "desc" },
  });
  const arquivoAntigo = !!ultimoLote && new Date(periodoFim) < ultimoLote.periodoFim;

  const resolvidasBase = await resolverLinhas(clienteId, resultado.linhas, resolucoesManuais);

  const linhas: LinhaResolvida[] = [];
  for (const base of resolvidasBase) {
    if (base.resolucao === "pendente" || base.resolucao === "nova_campanha") {
      linhas.push({ ...base, gastoAnterior: 0, gastoIncremental: base.linha.valorGasto, correcaoNegativa: false });
      continue;
    }
    const dataInicio = new Date(base.linha.inicio);
    const limiteAntesDe = arquivoAntigo ? new Date(periodoFim) : undefined;
    const acumulo = await ultimoAcumuloDoMes(base.campanhaId as string, dataInicio.getUTCFullYear(), dataInicio.getUTCMonth(), limiteAntesDe);
    const gastoIncremental = base.linha.valorGasto - acumulo.valor;
    linhas.push({ ...base, gastoAnterior: acumulo.valor, gastoIncremental, correcaoNegativa: gastoIncremental < 0 });
  }

  const linhasComGasto = resultado.linhas.filter((l) => l.valorGasto > 0).length;
  const gastoTotalArquivo = resultado.linhas.reduce((s, l) => s + l.valorGasto, 0);
  const pendentes = linhas.filter((l) => l.resolucao === "pendente").length;

  const previa: PreviaImportacao = {
    clienteId,
    nomeArquivo,
    contaAnuncios: resultado.contaAnuncios,
    periodoInicio,
    periodoFim,
    arquivoAntigo,
    ultimoPeriodoFimConfirmado: ultimoLote ? ultimoLote.periodoFim.toISOString().slice(0, 10) : null,
    linhasTotal: resultado.linhas.length,
    linhasIgnoradas: resultado.linhasIgnoradas,
    linhasComGasto,
    gastoTotalArquivo,
    colunasReconhecidas: resultado.colunasReconhecidas,
    temIdExterno: resultado.temIdExterno,
    linhas,
    pendentes,
  };

  return { previa, resultado, loteId: null };
}
