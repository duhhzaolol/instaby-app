import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import {
  snapshotsCampanhasNoPeriodo,
  statusInternoEfetivo,
} from "@/lib/trafego";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  const inicio = new Date(request.nextUrl.searchParams.get("inicio") || "");
  const fim = new Date(request.nextUrl.searchParams.get("fim") || "");
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || inicio > fim)
    return NextResponse.json({ erro: "Período inválido" }, { status: 400 });
  const campanhas = await prisma.campanha.findMany({
    where: { clienteId: params.id },
    orderBy: [{ dataInicio: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nome: true,
      status: true,
      statusInterno: true,
      dataInicio: true,
      dataFim: true,
      avaliacao: true,
      avaliacaoObjetivo: true,
      avaliacaoMeta: true,
      avaliacaoObservacoes: true,
    },
  });
  const snaps = await snapshotsCampanhasNoPeriodo(
    campanhas.map((c) => c.id),
    inicio,
    fim,
  );
  return NextResponse.json(
    campanhas
      .filter((c) => snaps.get(c.id)!.gasto > 0)
      .map((c) => ({
        ...c,
        statusInterno: statusInternoEfetivo(c),
        gasto: snaps.get(c.id)!.gasto,
      })),
  );
}
