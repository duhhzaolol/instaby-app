import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CAMPOS_TEXTO = [
  "titulo", "campanha", "formato", "objetivo", "pilar", "tipoVeiculacao",
  "briefing", "roteiro", "legenda", "cta", "referencias", "linkArquivos",
  "status", "urlPublicada", "clienteId",
];
const CAMPOS_DATA = ["dataCaptacao", "prazoEdicao", "prazoAprovacao", "dataPublicacao"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const data: Record<string, any> = {};

  CAMPOS_TEXTO.forEach((campo) => {
    if (body[campo] !== undefined) data[campo] = body[campo] || null;
  });
  CAMPOS_DATA.forEach((campo) => {
    if (body[campo] !== undefined) data[campo] = body[campo] ? new Date(body[campo]) : null;
  });
  if (body.redes !== undefined) data.redes = body.redes;

  const conteudo = await prisma.conteudo.update({ where: { id: params.id }, data });
  return NextResponse.json(conteudo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // desvincula as tarefas em vez de apagar elas junto
  await prisma.tarefa.updateMany({ where: { conteudoId: params.id }, data: { conteudoId: null } });
  await prisma.conteudo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
