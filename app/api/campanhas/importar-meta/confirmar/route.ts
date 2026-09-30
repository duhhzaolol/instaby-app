import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { montarPrevia } from "@/lib/importacaoMeta";
import { gerarChaveCorrespondencia } from "@/lib/trafego";

// Grava tudo de uma vez, numa transação: campanhas novas, atualização das já
// existentes (aprendizado de nome/ID pra próxima importação), o lote e um item por
// linha — mais o espelho em ResultadoCampanha (compatibilidade com o Início do gestor
// de tráfego, que já existia antes desse módulo). Reprocessa o arquivo de novo aqui
// (nunca confia nos números que a prévia devolveu pro navegador).
export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();
  const clienteId: string | undefined = body.clienteId;
  const nomeArquivo: string | undefined = body.nomeArquivo;
  const conteudoBase64: string | undefined = body.conteudoBase64;
  const resolucoesManuais: Record<number, string> = body.resolucoesManuais || {};
  const forcarArquivoAntigo: boolean = !!body.forcarArquivoAntigo;

  if (!clienteId || !nomeArquivo || !conteudoBase64) {
    return NextResponse.json({ erro: "Cliente e arquivo são obrigatórios" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const montado = await montarPrevia(clienteId, nomeArquivo, conteudoBase64, resolucoesManuais);
  if ("erro" in montado) {
    return NextResponse.json({ erro: montado.erro }, { status: 400 });
  }
  const { previa, resultado: resultadoArquivo } = montado;

  if (previa.pendentes > 0) {
    return NextResponse.json(
      { erro: "Ainda há linhas pendentes de conferência manual — resolva todas antes de confirmar.", previa },
      { status: 400 }
    );
  }
  if (previa.arquivoAntigo && !forcarArquivoAntigo) {
    return NextResponse.json(
      {
        erro:
          "Esse arquivo cobre um período mais antigo que a última importação já confirmada desse cliente. Nada foi alterado — confirme explicitamente se ainda assim quer aplicar isso como correção.",
        previa,
        precisaConfirmarArquivoAntigo: true,
      },
      { status: 409 }
    );
  }

  // Sobe o arquivo original antes de gravar qualquer coisa no banco — se isso falhar,
  // nada foi persistido ainda (mesmo padrão de upload-contrato/upload-logo).
  const buffer = Buffer.from(conteudoBase64, "base64");
  const nomeUnico = `importacoes-trafego/${clienteId}/${Date.now()}-${nomeArquivo.replace(/[^a-zA-Z0-9.]/g, "-")}`;
  const blob = await put(nomeUnico, buffer, { access: "public" });

  const resultado = await prisma.$transaction(async (tx) => {
    const idsPorLinha = new Map<number, string>();

    // 1) Campanhas novas primeiro, pra já ter o id na hora de gravar os itens.
    for (const linha of previa.linhas) {
      if (linha.resolucao !== "nova_campanha") continue;
      const chave = gerarChaveCorrespondencia(linha.linha.nome, linha.linha.configAtribuicao);
      const nova = await tx.campanha.create({
        data: {
          clienteId,
          nome: linha.linha.nome,
          plataforma: "meta_ads",
          status: "ativa",
          statusInterno: "em_acompanhamento",
          dataInicio: new Date(linha.linha.inicio),
          idExternoMeta: linha.linha.idExterno || undefined,
          chaveCorrespondencia: chave,
          nomesOriginaisMeta: [linha.linha.nome],
          ultimoStatusMeta: linha.linha.status,
          ultimoStatusMetaEm: new Date(),
          orcamentoConjunto: linha.linha.orcamentoConjunto ?? undefined,
          tipoOrcamento: linha.linha.tipoOrcamento ?? undefined,
          observacoes: "Criada automaticamente por importação do Meta Ads.",
        },
      });
      idsPorLinha.set(linha.linhaIndex, nova.id);
    }

    // 2) Campanhas já existentes: aprende nome/ID novos e atualiza os "últimos
    // valores conhecidos" (só informativos, nunca decidem status/saldo sozinhos).
    for (const linha of previa.linhas) {
      if (linha.resolucao === "nova_campanha") continue;
      const campanhaId = linha.campanhaId as string;
      idsPorLinha.set(linha.linhaIndex, campanhaId);

      const atual = await tx.campanha.findUnique({
        where: { id: campanhaId },
        select: { nomesOriginaisMeta: true, chaveCorrespondencia: true, idExternoMeta: true },
      });
      if (!atual) continue;

      const nomesAtualizados = atual.nomesOriginaisMeta.includes(linha.linha.nome)
        ? atual.nomesOriginaisMeta
        : [...atual.nomesOriginaisMeta, linha.linha.nome];

      await tx.campanha.update({
        where: { id: campanhaId },
        data: {
          nomesOriginaisMeta: nomesAtualizados,
          chaveCorrespondencia:
            atual.chaveCorrespondencia || gerarChaveCorrespondencia(linha.linha.nome, linha.linha.configAtribuicao),
          idExternoMeta: atual.idExternoMeta || linha.linha.idExterno || undefined,
          ultimoStatusMeta: linha.linha.status,
          ultimoStatusMetaEm: new Date(),
          orcamentoConjunto: linha.linha.orcamentoConjunto ?? undefined,
          tipoOrcamento: linha.linha.tipoOrcamento ?? undefined,
        },
      });
    }

    // 3) O lote em si.
    const lote = await tx.loteImportacao.create({
      data: {
        clienteId,
        nomeArquivo,
        contaAnuncios: resultadoArquivo.contaAnuncios || undefined,
        arquivoUrl: blob.url,
        periodoInicio: new Date(previa.periodoInicio),
        periodoFim: new Date(previa.periodoFim),
        arquivoAntigo: previa.arquivoAntigo,
        linhasTotal: previa.linhasTotal,
        linhasComGasto: previa.linhasComGasto,
        gastoTotalArquivo: previa.gastoTotalArquivo,
        criadoPorId: usuario.id,
      },
    });

    // 4) Um ItemImportacao por linha (o histórico/ledger de verdade) + espelho em
    // ResultadoCampanha (pro Início do gestor de tráfego e o painel por campanha,
    // que já existiam antes desse módulo e continuam lendo dali).
    let campanhasCriadas = 0;
    let campanhasAtualizadas = 0;
    for (const linha of previa.linhas) {
      const campanhaId = idsPorLinha.get(linha.linhaIndex);
      if (!campanhaId) continue;
      if (linha.resolucao === "nova_campanha") campanhasCriadas++;
      else campanhasAtualizadas++;

      await tx.itemImportacao.create({
        data: {
          loteId: lote.id,
          campanhaId,
          nomeOriginal: linha.linha.nome,
          idExternoOriginal: linha.linha.idExterno,
          statusMetaOriginal: linha.linha.status,
          configAtribuicao: linha.linha.configAtribuicao,
          gastoAcumuladoArquivo: linha.linha.valorGasto,
          gastoAnterior: linha.gastoAnterior,
          gastoIncremental: linha.gastoIncremental,
          impressoes: linha.linha.impressoes,
          alcance: linha.linha.alcance,
          resultados: linha.linha.resultados,
          indicadorResultado: linha.linha.indicadorResultado,
          custoPorResultado: linha.linha.custoPorResultado,
          orcamentoConjunto: linha.linha.orcamentoConjunto,
          tipoOrcamento: linha.linha.tipoOrcamento,
          termino: linha.linha.termino ? new Date(linha.linha.termino) : null,
          resolucao: linha.resolucao,
        },
      });

      await tx.resultadoCampanha.upsert({
        where: {
          campanhaId_inicio_fim: {
            campanhaId,
            inicio: new Date(linha.linha.inicio),
            fim: new Date(linha.linha.fim),
          },
        },
        update: {
          verbaInvestida: linha.linha.valorGasto,
          impressoes: linha.linha.impressoes,
          alcance: linha.linha.alcance,
          resultados: linha.linha.resultados,
          indicadorResultado: linha.linha.indicadorResultado,
          origem: "meta_import",
        },
        create: {
          campanhaId,
          inicio: new Date(linha.linha.inicio),
          fim: new Date(linha.linha.fim),
          verbaInvestida: linha.linha.valorGasto,
          impressoes: linha.linha.impressoes,
          alcance: linha.linha.alcance,
          resultados: linha.linha.resultados,
          indicadorResultado: linha.linha.indicadorResultado,
          origem: "meta_import",
        },
      });
    }

    return { loteId: lote.id, campanhasCriadas, campanhasAtualizadas, itensGravados: previa.linhas.length };
  });

  return NextResponse.json(resultado, { status: 201 });
}
