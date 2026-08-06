import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get("secret");
  const email = params.get("email");
  const senha = params.get("senha");
  const nome = params.get("nome") || "Duhzao";

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  if (!email || !senha) {
    return NextResponse.json(
      { erro: "Passe email e senha na URL, ex: ?secret=X&email=voce@x.com&senha=suasenha" },
      { status: 400 }
    );
  }

  const usuarioExistente = await prisma.usuario.count();
  if (usuarioExistente > 0) {
    return NextResponse.json(
      { erro: "Já existe um usuário criado. Essa rota só funciona uma vez, por segurança." },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.usuario.create({
    data: { email, senha: senhaHash, nome },
  });

  return NextResponse.json({
    ok: true,
    mensagem: "Usuário criado! Já pode fazer login em /login com esse e-mail e senha.",
  });
}
