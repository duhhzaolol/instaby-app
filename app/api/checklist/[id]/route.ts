import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";

// Marca/desmarca ou apaga um sub-passo de uma tarefa (redesign v144, Parte 2).
// Mesma checagem de permissão da tarefa dona do item (via clienteId dela).
async function carregarComPermissao(id: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return { erro: NextResponse.json({ erro: "Não autenticado" }, { status: 401 }) } as const;

  const item = await prisma.checklistItemTarefa.findUnique({
    where: { id },
    include: { tarefa: { select: { clienteId: true } } },
  });
  if (!item) return { erro: NextResponse.json({ erro: "Não encontrado" }, { status: 404 }) } as const;
  if (item.tarefa.clienteId && !(await podeVerCliente(usuario, item.tarefa.clienteId))) {
    return { erro: NextResponse.json({ erro: "Não autorizado" }, { status: 403 }) } as const;
  }
  return { item } as const;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const carregado = await carregarComPermissao(params.id);
  if (carregado.erro) return carregado.erro;

  const body = await request.json();
  const item = await prisma.checklistItemTarefa.update({
    where: { id: params.id },
    data: {
      ...(body.feito !== undefined && { feito: !!body.feito }),
      ...(body.titulo !== undefined && { titulo: String(body.titulo).trim() }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const carregado = await carregarComPermissao(params.id);
  if (carregado.erro) return carregado.erro;

  await prisma.checklistItemTarefa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
