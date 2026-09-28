import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const link = await prisma.linkUsuario.findUnique({ where: { id: params.id } });
  if (!link) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  // Só apaga o próprio link — nunca o de outra pessoa, mesmo sabendo o id.
  if (link.usuarioId !== usuario.id) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.linkUsuario.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
