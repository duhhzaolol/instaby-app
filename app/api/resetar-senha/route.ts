import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get("secret");
  const novaSenha = params.get("senha");

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  if (!novaSenha) {
    return NextResponse.json(
      { erro: "Passe a nova senha na URL, ex: ?secret=X&senha=novasenha" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findFirst();
  if (!usuario) {
    return NextResponse.json({ erro: "Nenhum usuário encontrado — use /api/setup em vez dessa rota." }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senha: senhaHash } });

  return NextResponse.json({
    ok: true,
    mensagem: `Senha redefinida! Já pode fazer login em /login com o e-mail ${usuario.email} e a senha nova.`,
  });
}
