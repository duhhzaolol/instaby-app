import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, clienteIdsPermitidos, podeVerCliente } from "@/lib/permissoes";

export async function GET() {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const idsPermitidos = await clienteIdsPermitidos(usuario);

  const campanhas = await prisma.campanha.findMany({
    where: idsPermitidos ? { clienteId: { in: idsPermitidos } } : undefined,
    include: { cliente: { select: { id: true, nome: true, cor: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campanhas);
}

export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const body = await request.json();

  if (!body.clienteId || !body.nome || !body.plataforma) {
    return NextResponse.json({ erro: "Cliente, nome e plataforma são obrigatórios" }, { status: 400 });
  }
  if (!(await podeVerCliente(usuario, body.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const campanha = await prisma.campanha.create({
    data: {
      clienteId: body.clienteId,
      nome: body.nome,
      plataforma: body.plataforma,
      objetivo: body.objetivo || null,
      verbaMensal: body.verbaMensal || 0,
      status: body.status || "ativa",
      dataInicio: body.dataInicio ? new Date(body.dataInicio) : new Date(),
      dataFim: body.dataFim ? new Date(body.dataFim) : null,
      observacoes: body.observacoes || null,
    },
    include: { cliente: { select: { id: true, nome: true, cor: true } } },
  });

  return NextResponse.json(campanha, { status: 201 });
}
