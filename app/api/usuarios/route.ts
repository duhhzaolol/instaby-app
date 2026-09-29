import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Lista simples de pessoas ativas — só o essencial pra popular seletor de
// responsável/desbloqueio (painel lateral de tarefa, Etapa 1 v152). Diferente de
// GET /api/equipe (que exige gerenciarEquipe e devolve tudo, inclusive capacidades):
// aqui qualquer pessoa logada pode ver nome/foto dos colegas ativos, do jeito que
// já acontece hoje em "Equipe agora" e nos seletores de cliente do topo — não tem
// valor, contrato nem financeiro nenhum aqui, então não fere a regra de permissões
// da Etapa 1 (Editor/Gestor de tráfego não veem R$, mas nomes de colegas não são
// dado restrito).
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, cargo: true, fotoUrl: true, master: true, gerenciarTrafego: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(usuarios);
}
