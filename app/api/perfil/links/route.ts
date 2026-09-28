import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Links pessoais de contato (Discord, WhatsApp etc.) — Configurações pessoais,
// redesign v144 Parte 3. Sempre grava em nome de quem está logado (usuario.id
// da sessão), nunca de um usuarioId vindo do corpo da requisição.
export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  if (!body.tipo || !body.url) {
    return NextResponse.json({ erro: "Tipo e link são obrigatórios" }, { status: 400 });
  }

  const link = await prisma.linkUsuario.create({
    data: {
      usuarioId: usuario.id,
      tipo: body.tipo,
      label: body.label || null,
      url: body.url,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
