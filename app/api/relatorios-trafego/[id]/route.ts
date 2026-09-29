import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

// Uma versão específica, com os dados exatamente como foram congelados na geração —
// nunca recalculado. Usada pela prévia dentro da tela de Relatórios (a página de
// impressão em si consulta o Prisma direto, mesmo padrão de app/relatorio/[id]).
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const relatorio = await prisma.relatorioTrafego.findUnique({
    where: { id: params.id },
    include: { cliente: { select: { nome: true, cor: true } }, geradoPor: { select: { nome: true } } },
  });
  if (!relatorio) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (!(await podeVerCliente(usuario, relatorio.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json({
    id: relatorio.id,
    clienteNome: relatorio.cliente.nome,
    clienteCor: relatorio.cliente.cor,
    periodoInicio: relatorio.periodoInicio.toISOString(),
    periodoFim: relatorio.periodoFim.toISOString(),
    parcial: relatorio.parcial,
    dadosSnapshot: relatorio.dadosSnapshot,
    avaliacaoGeral: relatorio.avaliacaoGeral,
    observacoes: relatorio.observacoes,
    proximosPassos: relatorio.proximosPassos,
    dataAtualizacaoDados: relatorio.dataAtualizacaoDados.toISOString(),
    versao: relatorio.versao,
    geradoPorNome: relatorio.geradoPor?.nome || null,
    createdAt: relatorio.createdAt.toISOString(),
  });
}
