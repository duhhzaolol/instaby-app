import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Caixa de notificações da pessoa logada (Etapa 1 v152) — nunca de outra pessoa
// (usuarioId vem sempre da sessão, nunca de query param). Uma "adiada" some da
// lista (e da contagem de não lidas) até a hora marcada — é o que "adiar" quer
// dizer; não é a mesma coisa que "lida".
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const agora = new Date();
  const visveis = { usuarioId: usuario.id, OR: [{ adiadaAte: null }, { adiadaAte: { lte: agora } }] };

  const [notificacoes, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({
      where: visveis,
      orderBy: { atualizadoEm: "desc" },
      take: 40,
    }),
    prisma.notificacao.count({ where: { ...visveis, lidaEm: null } }),
  ]);

  return NextResponse.json({ notificacoes, naoLidas });
}
