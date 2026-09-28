import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Cronômetro da barra do topo (redesign fase 1): devolve o registro de horas
// "em andamento" (sem fim) da pessoa logada, ou null. Usa o mesmo RegistroTempo
// de sempre — iniciar o cronômetro é só um POST sem `fim`, e parar é um PATCH
// com `fim` = agora, nas rotas que já existiam.
//
// Só olha as últimas 24h: um registro antigo que ficou sem fim (lançado à mão
// e esquecido) não deve aparecer como "rodando" na barra de todo mundo.
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const registro = await prisma.registroTempo.findFirst({
    where: {
      usuarioId: usuario.id,
      fim: null,
      inicio: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: { cliente: { select: { nome: true, cor: true } } },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json(registro);
}
