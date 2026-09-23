import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

const CAMPOS = [
  "nome", "contatoNome", "contatoWhatsapp", "origem", "interesse",
  "status", "proximaAcao", "observacoes", "motivoPerda",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verComercial");
  if (erro) return erro;

  const body = await request.json();
  const data: Record<string, any> = {};

  CAMPOS.forEach((c) => {
    if (body[c] !== undefined) data[c] = body[c] || null;
  });
  if (body.valorEstimado !== undefined) data.valorEstimado = body.valorEstimado || null;
  if (body.dataProximaAcao !== undefined) data.dataProximaAcao = body.dataProximaAcao ? new Date(body.dataProximaAcao) : null;

  const oportunidade = await prisma.oportunidade.update({ where: { id: params.id }, data });
  return NextResponse.json(oportunidade);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verComercial");
  if (erro) return erro;

  await prisma.oportunidade.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
