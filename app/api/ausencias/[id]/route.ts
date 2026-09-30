import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";

// Sem PATCH de propósito (mesmo nível de app/api/perfil/links/[id]/route.ts) —
// corrigir uma ausência é apagar e cadastrar de novo; o volume aqui é baixo o
// bastante pra isso não pesar no dia a dia.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const ausencia = await prisma.ausencia.findUnique({ where: { id: params.id } });
  if (!ausencia) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (ausencia.usuarioId !== usuario.id && !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.ausencia.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
