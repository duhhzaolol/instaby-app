import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Marcar como lida/não lida ou adiar (Etapa 1 item 8) — só o próprio destinatário
// mexe na notificação dele (checado aqui, não só escondido na interface).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const existente = await prisma.notificacao.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (existente.usuarioId !== usuario.id) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const data: { lidaEm?: Date | null; adiadaAte?: Date | null } = {};

  if (body.lida !== undefined) data.lidaEm = body.lida ? new Date() : null;
  if (body.adiarAte !== undefined) {
    if (body.adiarAte === null) {
      data.adiadaAte = null;
    } else {
      const ate = new Date(body.adiarAte);
      if (isNaN(ate.getTime()) || ate.getTime() <= Date.now()) {
        return NextResponse.json({ erro: "Data de adiamento inválida." }, { status: 400 });
      }
      data.adiadaAte = ate;
    }
  }

  const notificacao = await prisma.notificacao.update({ where: { id: params.id }, data });
  return NextResponse.json(notificacao);
}

// "Marcar todas como lidas" chama isso em lote pelo lado do cliente (um PATCH por
// id) — sem rota de bulk separada de propósito, pra manter uma única checagem de
// posse (usuarioId === sessão) em um lugar só.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const existente = await prisma.notificacao.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ ok: true });
  if (existente.usuarioId !== usuario.id) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.notificacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
