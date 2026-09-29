import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

// Histórico de importações do cliente (spec §3, tela "Histórico de importações") —
// cada lote com seus itens, pra poder revisar correções e abrir o arquivo original.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const lotes = await prisma.loteImportacao.findMany({
    where: { clienteId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      criadoPor: { select: { nome: true } },
      itens: {
        include: { campanha: { select: { nome: true } } },
        orderBy: { gastoIncremental: "desc" },
      },
    },
  });

  return NextResponse.json(
    lotes.map((l: any) => ({
      id: l.id,
      nomeArquivo: l.nomeArquivo,
      arquivoUrl: l.arquivoUrl,
      periodoInicio: l.periodoInicio.toISOString(),
      periodoFim: l.periodoFim.toISOString(),
      arquivoAntigo: l.arquivoAntigo,
      linhasTotal: l.linhasTotal,
      linhasComGasto: l.linhasComGasto,
      gastoTotalArquivo: Number(l.gastoTotalArquivo),
      criadoPorNome: l.criadoPor?.nome || null,
      createdAt: l.createdAt.toISOString(),
      itens: l.itens.map((i: any) => ({
        id: i.id,
        nomeOriginal: i.nomeOriginal,
        campanhaNomeAtual: i.campanha?.nome || null,
        gastoAcumuladoArquivo: Number(i.gastoAcumuladoArquivo),
        gastoAnterior: Number(i.gastoAnterior),
        gastoIncremental: Number(i.gastoIncremental),
        resolucao: i.resolucao,
      })),
    }))
  );
}
