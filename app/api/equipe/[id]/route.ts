import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id: params.id } });
  if (!alvo) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (alvo.master) {
    return NextResponse.json({ erro: "Esse login tem acesso total e não pode ser alterado por aqui" }, { status: 400 });
  }

  const body = await request.json();
  const clienteIds: string[] | undefined = Array.isArray(body.clienteIds) ? body.clienteIds : undefined;

  const data: any = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.cargo !== undefined) data.cargo = body.cargo;
  if (body.ativo !== undefined) data.ativo = !!body.ativo;
  if (body.verFinanceiro !== undefined) data.verFinanceiro = !!body.verFinanceiro;
  if (body.gerenciarFinanceiro !== undefined) data.gerenciarFinanceiro = !!body.gerenciarFinanceiro;
  if (body.verComercial !== undefined) data.verComercial = !!body.verComercial;
  if (body.gerenciarTrafego !== undefined) data.gerenciarTrafego = !!body.gerenciarTrafego;
  if (body.gerenciarEquipe !== undefined) data.gerenciarEquipe = !!body.gerenciarEquipe;
  if (body.gerenciarConfiguracoes !== undefined) data.gerenciarConfiguracoes = !!body.gerenciarConfiguracoes;
  if (body.todosClientes !== undefined) data.todosClientes = !!body.todosClientes;

  // Nova senha é opcional na edição — só troca se vier preenchida
  if (body.senha) {
    if (body.senha.length < 6) {
      return NextResponse.json({ erro: "Senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
    }
    data.senha = await bcrypt.hash(body.senha, 10);
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: params.id }, data });
    if (clienteIds !== undefined) {
      await tx.clienteUsuario.deleteMany({ where: { usuarioId: params.id } });
      if (clienteIds.length) {
        await tx.clienteUsuario.createMany({
          data: clienteIds.map((clienteId) => ({ usuarioId: params.id, clienteId })),
        });
      }
    }
  });

  const atualizado = await prisma.usuario.findUnique({ where: { id: params.id } });
  const { senha, ...resto } = atualizado!;
  return NextResponse.json(resto);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id: params.id } });
  if (!alvo) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (alvo.master) {
    return NextResponse.json({ erro: "Esse login tem acesso total e não pode ser removido" }, { status: 400 });
  }

  await prisma.clienteUsuario.deleteMany({ where: { usuarioId: params.id } });
  await prisma.usuario.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
