import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { montarPrevia } from "@/lib/importacaoMeta";
import { gravarImportacaoMeta } from "@/lib/gravarImportacaoMeta";

export const maxDuration = 60;

// Grava tudo de uma vez, numa transação: campanhas novas, atualização das já
// existentes (aprendizado de nome/ID pra próxima importação), o lote e um item por
// linha — mais o espelho em ResultadoCampanha (compatibilidade com o Início do gestor
// de tráfego, que já existia antes desse módulo). Reprocessa o arquivo de novo aqui
// (nunca confia nos números que a prévia devolveu pro navegador).
async function confirmar(request: NextRequest) {
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

  const resultado = await prisma.$transaction(
    (tx) => gravarImportacaoMeta(tx, {
      clienteId, nomeArquivo, arquivoUrl: blob.url,
      contaAnuncios: resultadoArquivo.contaAnuncios || null,
      criadoPorId: usuario.id, previa,
    }),
    { maxWait: 10000, timeout: 45000 }
  );

  return NextResponse.json(resultado, { status: 201 });
}

export async function POST(request: NextRequest) {
  try {
    return await confirmar(request);
  } catch (erro) {
    const codigo = erro && typeof erro === "object" && "code" in erro ? String(erro.code) : "desconhecido";
    console.error("Falha na importação Meta:", codigo);
    const campanhaInvalida = erro instanceof Error && erro.message === "CAMPANHA_IMPORTACAO_INVALIDA";
    return NextResponse.json({
      erro: campanhaInvalida
        ? "Uma campanha selecionada não está mais disponível para esse cliente. Atualize a prévia antes de confirmar."
        : codigo === "P2028" || codigo === "P2024"
        ? "O banco demorou para salvar a importação. Nenhum dado desta tentativa foi gravado. Tente novamente em alguns instantes."
        : "Não foi possível concluir a importação. Nenhum dado desta tentativa foi gravado. Confira a conexão e tente novamente.",
    }, { status: campanhaInvalida ? 400 : 503 });
  }
}
