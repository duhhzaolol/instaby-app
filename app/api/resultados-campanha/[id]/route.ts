import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

async function carregarComPermissao(usuario: any, id: string) {
  const resultado = await prisma.resultadoCampanha.findUnique({
    where: { id },
    include: { campanha: { select: { clienteId: true } } },
  });
  if (!resultado) return { erro: NextResponse.json({ erro: "Não encontrado" }, { status: 404 }) };
  if (!(await podeVerCliente(usuario, resultado.campanha.clienteId))) {
    return { erro: NextResponse.json({ erro: "Não autorizado" }, { status: 403 }) };
  }
  return { resultado };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const { erro: erroPermissao } = await carregarComPermissao(usuario, params.id);
  if (erroPermissao) return erroPermissao;

  const body = await request.json();
  const numOuNulo = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));

  const resultado = await prisma.resultadoCampanha.update({
    where: { id: params.id },
    data: {
      ...(body.inicio !== undefined && { inicio: new Date(body.inicio) }),
      ...(body.fim !== undefined && { fim: new Date(body.fim) }),
      ...(body.verbaInvestida !== undefined && { verbaInvestida: numOuNulo(body.verbaInvestida) }),
      ...(body.impressoes !== undefined && { impressoes: numOuNulo(body.impressoes) }),
      ...(body.cliques !== undefined && { cliques: numOuNulo(body.cliques) }),
      ...(body.resultados !== undefined && { resultados: numOuNulo(body.resultados) }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
    },
  });

  return NextResponse.json(resultado);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const { erro: erroPermissao } = await carregarComPermissao(usuario, params.id);
  if (erroPermissao) return erroPermissao;

  await prisma.resultadoCampanha.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
