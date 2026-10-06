import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { formaPagamentoTrafegoValida } from "@/lib/pagamentoTrafego";

// Configuração da mídia do cliente; não registra aportes ou cobranças da agência.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const forma = body?.formaPagamentoTrafego;
  if (forma !== null && !formaPagamentoTrafegoValida(forma)) {
    return NextResponse.json({ erro: "Escolha cartão de crédito, Pix ou boleto" }, { status: 400 });
  }
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  const atualizado = await prisma.cliente.update({
    where: { id: params.id }, data: { formaPagamentoTrafego: forma }, select: { formaPagamentoTrafego: true },
  });
  return NextResponse.json(atualizado);
}
