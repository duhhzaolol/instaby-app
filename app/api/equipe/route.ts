import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const equipe = await prisma.usuario.findMany({
    orderBy: [{ master: "desc" }, { createdAt: "asc" }],
    include: { clientesPermitidos: { include: { cliente: { select: { id: true, nome: true } } } } },
  });

  // Nunca devolve o hash da senha pro navegador
  return NextResponse.json(equipe.map(({ senha, ...resto }) => resto));
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarEquipe) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.nome || !body.email || !body.senha) {
    return NextResponse.json({ erro: "Nome, e-mail e senha são obrigatórios" }, { status: 400 });
  }
  if (body.senha.length < 6) {
    return NextResponse.json({ erro: "Senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
  }

  const existe = await prisma.usuario.findUnique({ where: { email: body.email } });
  if (existe) {
    return NextResponse.json({ erro: "Já existe um login com esse e-mail" }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(body.senha, 10);
  const clienteIds: string[] = Array.isArray(body.clienteIds) ? body.clienteIds : [];

  const novo = await prisma.usuario.create({
    data: {
      nome: body.nome,
      email: body.email,
      senha: senhaHash,
      cargo: body.cargo || "Membro da equipe",
      // Nunca criado como master por aqui — só você tem esse acesso total, e só
      // fica assim porque já era o único usuário antes de existir multiusuário.
      master: false,
      verFinanceiro: !!body.verFinanceiro,
      gerenciarFinanceiro: !!body.gerenciarFinanceiro,
      verComercial: !!body.verComercial,
      gerenciarTrafego: !!body.gerenciarTrafego,
      gerenciarEquipe: !!body.gerenciarEquipe,
      gerenciarConfiguracoes: !!body.gerenciarConfiguracoes,
      todosClientes: !!body.todosClientes,
      clientesPermitidos: !body.todosClientes && clienteIds.length
        ? { create: clienteIds.map((clienteId) => ({ clienteId })) }
        : undefined,
    },
  });

  const { senha, ...resto } = novo;
  return NextResponse.json(resto, { status: 201 });
}
