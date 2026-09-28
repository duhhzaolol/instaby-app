import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Devolve o registro de tempo em aberto (sem "fim") da PESSOA LOGADA, se
// houver — usado pelo cronômetro da barra do topo (redesign v144, Parte 1)
// pra saber, ao carregar qualquer página, se já tem algo rodando.
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const registro = await prisma.registroTempo.findFirst({
    where: { usuarioId: usuario.id, fim: null },
    include: { cliente: { select: { nome: true } } },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json(registro);
}
