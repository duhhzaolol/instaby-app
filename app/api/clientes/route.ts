import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { garantirPastasCliente } from "@/lib/google";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const clientes = await prisma.cliente.findMany({
    where: status && status !== "todos" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  let cliente = await prisma.cliente.create({
    data: {
      nome: body.nome,
      whatsapp: body.whatsapp || null,
      cnpj: body.cnpj || null,
      contatoNome: body.contatoNome || null,
      endereco: body.endereco || null,
      logoUrl: body.logoUrl || null,
      linkDrive: body.linkDrive || null,
      cor: body.cor || null,
      status: body.status || "lead",
    },
  });

  // Falhar no Drive não perde o cadastro. A aba Links permite retomar somente
  // as pastas que faltaram, preservando os IDs já gravados.
  if (permissoesDe(usuario).verArquivos) {
    try { const pastas = await garantirPastasCliente(cliente.id); if (pastas) cliente = { ...cliente, ...pastas }; }
    catch { console.error("Não foi possível preparar as pastas do novo cliente."); }
  }

  if (body.status === "ativo" && body.mensalidade && body.proximoVencimento) {
    await prisma.cobranca.create({
      data: {
        clienteId: cliente.id,
        valor: parseFloat(body.mensalidade),
        tipo: "recorrente",
        status: "pendente",
        vencimento: new Date(body.proximoVencimento),
      },
    });
  }

  return NextResponse.json(cliente, { status: 201 });
}
