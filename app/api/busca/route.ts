import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Busca global do cabeçalho — clientes por nome, orçamentos por slug ou nome
// do cliente. Simples de propósito: sem paginação, resultado curto (6 de
// cada), pensado pra digitar 2-3 letras e já achar o que precisa.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ clientes: [], orcamentos: [] });
  }

  const [clientes, orcamentos] = await Promise.all([
    prisma.cliente.findMany({
      where: { nome: { contains: q, mode: "insensitive" } },
      select: { id: true, nome: true, cor: true, status: true },
      orderBy: { nome: "asc" },
      take: 6,
    }),
    prisma.orcamento.findMany({
      where: {
        OR: [
          { slug: { contains: q, mode: "insensitive" } },
          { cliente: { nome: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: { id: true, slug: true, status: true, cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return NextResponse.json({
    clientes,
    orcamentos: orcamentos.map((o: { id: string; slug: string; status: string; cliente: { nome: string } }) => ({
      id: o.id,
      slug: o.slug,
      status: o.status,
      clienteNome: o.cliente.nome,
    })),
  });
}
