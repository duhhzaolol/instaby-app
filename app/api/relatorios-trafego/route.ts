import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { computarSnapshotRelatorio } from "@/lib/trafego";

// Lista as versões já geradas de um cliente (spec §6: "preserve versões dos
// relatórios gerados") — nunca sobrescreve, só lista o histórico.
export async function GET(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  const clienteId = request.nextUrl.searchParams.get("clienteId");
  if (!clienteId) return NextResponse.json({ erro: "Informe o cliente" }, { status: 400 });
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const relatorios = await prisma.relatorioTrafego.findMany({
    where: { clienteId },
    orderBy: { versao: "desc" },
    include: { geradoPor: { select: { nome: true } } },
  });
  return NextResponse.json(
    relatorios.map((r: any) => ({
      id: r.id,
      versao: r.versao,
      periodoInicio: r.periodoInicio.toISOString(),
      periodoFim: r.periodoFim.toISOString(),
      parcial: r.parcial,
      geradoPorNome: r.geradoPor?.nome || null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

// Gera uma NOVA versão — nunca recalcula nem substitui uma já existente. Selecionar
// campanhas pro relatório é só leitura: não mexe no saldo geral do cliente (spec §6).
export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();
  const { clienteId, periodoInicio, periodoFim, campanhaIds, avaliacaoGeral, observacoes, proximosPassos } = body;
  if (!clienteId || !periodoInicio || !periodoFim || !Array.isArray(campanhaIds) || campanhaIds.length === 0) {
    return NextResponse.json({ erro: "Cliente, período e ao menos uma campanha são obrigatórios" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const inicio = new Date(periodoInicio);
  const fim = new Date(periodoFim);

  const { porCampanha, investimentoTotal, dataAtualizacaoDados, parcial } = await computarSnapshotRelatorio(
    clienteId,
    campanhaIds,
    inicio,
    fim
  );

  const ultimo = await prisma.relatorioTrafego.findFirst({ where: { clienteId }, orderBy: { versao: "desc" } });
  const versao = (ultimo?.versao || 0) + 1;

  const relatorio = await prisma.relatorioTrafego.create({
    data: {
      clienteId,
      periodoInicio: inicio,
      periodoFim: fim,
      parcial,
      campanhaIds,
      dadosSnapshot: { investimentoTotal, porCampanha },
      avaliacaoGeral: avaliacaoGeral || null,
      observacoes: observacoes || null,
      proximosPassos: proximosPassos || null,
      dataAtualizacaoDados: new Date(dataAtualizacaoDados),
      versao,
      geradoPorId: usuario.id,
    },
  });

  return NextResponse.json({ id: relatorio.id, versao: relatorio.versao }, { status: 201 });
}
