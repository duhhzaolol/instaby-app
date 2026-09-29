import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { sincronizarStatus, avaliacaoValida } from "@/lib/trafego";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const existente = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  // Aceita tanto o form antigo (só `status`) quanto as telas novas (`statusInterno`) —
  // ver lib/trafego.ts. Sem nenhum dos dois no corpo, nenhum dos dois campos é tocado.
  const statusSincronizado = sincronizarStatus(body);
  if (statusSincronizado === "invalido") {
    return NextResponse.json({ erro: "Status interno inválido" }, { status: 400 });
  }

  if (body.avaliacao !== undefined && !avaliacaoValida(body.avaliacao)) {
    return NextResponse.json({ erro: "Avaliação inválida" }, { status: 400 });
  }
  // Avaliação registra quem mexeu e quando, igual RegistroTempo/Tarefa — só quando
  // algum campo de avaliação de fato veio no corpo (não em toda edição de campanha).
  const mexeuNaAvaliacao =
    body.avaliacao !== undefined ||
    body.avaliacaoObjetivo !== undefined ||
    body.avaliacaoMeta !== undefined ||
    body.avaliacaoObservacoes !== undefined;

  const campanha = await prisma.campanha.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.plataforma !== undefined && { plataforma: body.plataforma }),
      ...(body.objetivo !== undefined && { objetivo: body.objetivo || null }),
      ...(body.verbaMensal !== undefined && { verbaMensal: body.verbaMensal }),
      ...(statusSincronizado && { status: statusSincronizado.status, statusInterno: statusSincronizado.statusInterno }),
      ...(body.dataInicio !== undefined && { dataInicio: new Date(body.dataInicio) }),
      ...(body.dataFim !== undefined && { dataFim: body.dataFim ? new Date(body.dataFim) : null }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
      ...(body.avaliacao !== undefined && { avaliacao: body.avaliacao }),
      ...(body.avaliacaoObjetivo !== undefined && { avaliacaoObjetivo: body.avaliacaoObjetivo || null }),
      ...(body.avaliacaoMeta !== undefined && { avaliacaoMeta: body.avaliacaoMeta || null }),
      ...(body.avaliacaoObservacoes !== undefined && { avaliacaoObservacoes: body.avaliacaoObservacoes || null }),
      ...(mexeuNaAvaliacao && { avaliadoPorId: usuario.id, avaliadoEm: new Date() }),
    },
    include: { cliente: { select: { id: true, nome: true, cor: true } } },
  });

  return NextResponse.json(campanha);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const existente = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.campanha.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
