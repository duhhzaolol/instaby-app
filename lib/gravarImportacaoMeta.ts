import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import type { PreviaImportacao } from "@/lib/importacaoMeta";
import { gerarChaveCorrespondencia } from "@/lib/trafego";

type DadosImportacao = {
  clienteId: string;
  nomeArquivo: string;
  arquivoUrl: string;
  contaAnuncios: string | null;
  criadoPorId: string;
  previa: PreviaImportacao;
};

// Executado dentro de uma única transação. Os IDs são definidos antes da gravação
// para inserir campanhas e itens em lote, sem uma ida ao banco por linha.
export async function gravarImportacaoMeta(tx: Prisma.TransactionClient, dados: DadosImportacao) {
  const { clienteId, previa } = dados;
  const agora = new Date();
  const idsPorLinha = new Map<number, string>();
  const novas: Prisma.CampanhaCreateManyInput[] = [];
  for (const { linha, linhaIndex, resolucao, campanhaId } of previa.linhas) {
    if (resolucao === "nova_campanha") {
      const id = randomUUID();
      idsPorLinha.set(linhaIndex, id);
      novas.push({
        id, clienteId, nome: linha.nome, plataforma: "meta_ads",
        status: "ativa", statusInterno: "em_acompanhamento",
        dataInicio: new Date(linha.inicio),
        dataFim: linha.termino ? new Date(linha.termino) : null,
        idExternoMeta: linha.idExterno,
        chaveCorrespondencia: gerarChaveCorrespondencia(linha.nome, linha.configAtribuicao),
        nomesOriginaisMeta: [linha.nome],
        ultimoStatusMeta: linha.status, ultimoStatusMetaEm: agora,
        orcamentoConjunto: linha.orcamentoConjunto, tipoOrcamento: linha.tipoOrcamento,
        observacoes: "Criada automaticamente por importação do Meta Ads.",
      });
    } else {
      if (!campanhaId || resolucao === "pendente") throw new Error("CAMPANHA_IMPORTACAO_INVALIDA");
      idsPorLinha.set(linhaIndex, campanhaId);
    }
  }

  const idsExistentes = Array.from(new Set(previa.linhas.filter((l) => l.resolucao !== "nova_campanha").map((l) => idsPorLinha.get(l.linhaIndex)!)));
  const existentes = idsExistentes.length ? await tx.campanha.findMany({
    where: { id: { in: idsExistentes }, clienteId, plataforma: "meta_ads" },
    select: {
      id: true, nomesOriginaisMeta: true, chaveCorrespondencia: true, idExternoMeta: true,
      orcamentoConjunto: true, tipoOrcamento: true, ultimoStatusMeta: true, dataFim: true,
    },
  }) : [];
  if (existentes.length !== idsExistentes.length) throw new Error("CAMPANHA_IMPORTACAO_INVALIDA");

  const atualizadas = new Map(existentes.map((c) => [c.id, { ...c, nomesOriginaisMeta: [...c.nomesOriginaisMeta] }]));
  for (const { linha, resolucao, campanhaId } of previa.linhas) {
    if (resolucao === "nova_campanha") continue;
    const atual = atualizadas.get(campanhaId!)!;
    if (!atual.nomesOriginaisMeta.includes(linha.nome)) atual.nomesOriginaisMeta.push(linha.nome);
    atual.chaveCorrespondencia ||= gerarChaveCorrespondencia(linha.nome, linha.configAtribuicao);
    atual.idExternoMeta ||= linha.idExterno;
    atual.ultimoStatusMeta = linha.status;
    if (!atual.dataFim && linha.termino) atual.dataFim = new Date(linha.termino);
    if (linha.orcamentoConjunto !== null) atual.orcamentoConjunto = new Prisma.Decimal(linha.orcamentoConjunto);
    if (linha.tipoOrcamento !== null) atual.tipoOrcamento = linha.tipoOrcamento;
  }

  if (novas.length) await tx.campanha.createMany({ data: novas });
  const metadados = Array.from(atualizadas.values());
  for (let i = 0; i < metadados.length; i += 500) {
    const valores = metadados.slice(i, i + 500).map((c) => Prisma.sql`(
      ${c.id}::text, ARRAY[${Prisma.join(c.nomesOriginaisMeta)}]::text[],
      ${c.chaveCorrespondencia}::text, ${c.idExternoMeta}::text,
      ${c.ultimoStatusMeta}::text, ${agora.toISOString()}::timestamp,
      ${c.orcamentoConjunto?.toString() ?? null}::numeric, ${c.tipoOrcamento}::text, ${c.dataFim?.toISOString() ?? null}::timestamp
    )`);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "Campanha" AS c SET
        "nomesOriginaisMeta" = v.nomes, "chaveCorrespondencia" = v.chave,
        "idExternoMeta" = v.id_meta, "ultimoStatusMeta" = v.status,
        "ultimoStatusMetaEm" = v.data, "orcamentoConjunto" = v.orcamento,
        "tipoOrcamento" = v.tipo, "dataFim" = COALESCE(c."dataFim", v.termino)
      FROM (VALUES ${Prisma.join(valores)}) AS v(id, nomes, chave, id_meta, status, data, orcamento, tipo, termino)
      WHERE c.id = v.id AND c."clienteId" = ${clienteId}
        AND NOT EXISTS (
          SELECT 1 FROM "ItemImportacao" i JOIN "LoteImportacao" l ON l.id = i."loteId"
          WHERE i."campanhaId" = c.id AND l."periodoFim" > ${new Date(previa.periodoFim).toISOString()}::timestamp
        )
        AND NOT EXISTS (
          SELECT 1 FROM "ResultadoCampanha" r
          WHERE r."campanhaId" = c.id AND r.fim > ${new Date(previa.periodoFim).toISOString()}::timestamp
        )
    `);
  }

  const lote = await tx.loteImportacao.create({ data: {
    clienteId, nomeArquivo: dados.nomeArquivo, arquivoUrl: dados.arquivoUrl,
    contaAnuncios: dados.contaAnuncios,
    periodoInicio: new Date(previa.periodoInicio), periodoFim: new Date(previa.periodoFim),
    arquivoAntigo: previa.arquivoAntigo, linhasTotal: previa.linhasTotal,
    linhasComGasto: previa.linhasComGasto, gastoTotalArquivo: previa.gastoTotalArquivo,
    criadoPorId: dados.criadoPorId,
  } });

  // O lote continua tendo uma linha de histórico por linha do arquivo. Diferenciar
  // os instantes dentro do lote preserva a ordem na escolha da última correção,
  // mesmo quando a inserção em massa daria o mesmo createdAt a todas as linhas.
  const inicioHistorico = Date.now() - previa.linhas.length;
  const itens = previa.linhas.map(({ linha, linhaIndex, gastoAnterior, gastoIncremental, resolucao }, indice) => ({
    createdAt: new Date(inicioHistorico + indice),
    loteId: lote.id, campanhaId: idsPorLinha.get(linhaIndex)!,
    nomeOriginal: linha.nome, idExternoOriginal: linha.idExterno, statusMetaOriginal: linha.status,
    configAtribuicao: linha.configAtribuicao,
    gastoAcumuladoArquivo: linha.valorGasto, gastoAnterior, gastoIncremental,
    impressoes: linha.impressoes, alcance: linha.alcance, resultados: linha.resultados,
    indicadorResultado: linha.indicadorResultado, custoPorResultado: linha.custoPorResultado,
    orcamentoConjunto: linha.orcamentoConjunto, tipoOrcamento: linha.tipoOrcamento,
    termino: linha.termino ? new Date(linha.termino) : null, resolucao,
  }));
  await tx.itemImportacao.createMany({ data: itens });

  // Em linhas repetidas para a mesma campanha/período, a última linha prevalece,
  // como no upsert sequencial anterior. Campos manuais de retorno ficam intactos.
  const resultados = new Map<string, { campanhaId: string; linha: PreviaImportacao["linhas"][number]["linha"] }>();
  for (const { linha, linhaIndex } of previa.linhas) {
    const campanhaId = idsPorLinha.get(linhaIndex)!;
    resultados.set(`${campanhaId}|${linha.inicio}|${linha.fim}`, { campanhaId, linha });
  }
  const unicos = Array.from(resultados.values());
  for (let i = 0; i < unicos.length; i += 500) {
    const valores = unicos.slice(i, i + 500).map(({ campanhaId, linha }) => Prisma.sql`(
      ${randomUUID()}::text, ${campanhaId}::text, ${new Date(linha.inicio).toISOString()}::timestamp,
      ${new Date(linha.fim).toISOString()}::timestamp, ${linha.valorGasto}::numeric,
      ${linha.impressoes}::integer, ${linha.alcance}::integer, ${linha.resultados}::integer,
      ${linha.indicadorResultado}::text, 'meta_import', ${agora.toISOString()}::timestamp
    )`);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "ResultadoCampanha" (
        id, "campanhaId", inicio, fim, "verbaInvestida", impressoes, alcance,
        resultados, "indicadorResultado", origem, "createdAt"
      ) VALUES ${Prisma.join(valores)}
      ON CONFLICT ("campanhaId", inicio, fim) DO UPDATE SET
        "verbaInvestida" = EXCLUDED."verbaInvestida", impressoes = EXCLUDED.impressoes,
        alcance = EXCLUDED.alcance, resultados = EXCLUDED.resultados,
        "indicadorResultado" = EXCLUDED."indicadorResultado", origem = EXCLUDED.origem
    `);
  }
  const campanhasCriadas = novas.length;
  return {
    loteId: lote.id, campanhasCriadas,
    campanhasAtualizadas: previa.linhas.length - campanhasCriadas,
    itensGravados: itens.length,
  };
}
