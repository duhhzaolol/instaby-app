import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { calcularSaldoCliente } from "@/lib/trafego";

// GET: verba cadastrada + histórico de movimentações + saldo já calculado (spec §2).
// gerenciarTrafego dá acesso à verba de mídia/gasto/saldo dos clientes autorizados —
// nunca aos contratos/mensalidades/financeiro da agência, que vivem noutro módulo.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const [verba, saldo] = await Promise.all([
    prisma.verbaTrafego.findUnique({
      where: { clienteId: params.id },
      include: {
        movimentacoes: { orderBy: { dataMovimento: "desc" }, include: { criadoPor: { select: { nome: true } } } },
      },
    }),
    calcularSaldoCliente(params.id),
  ]);

  return NextResponse.json({
    saldoInicial: verba ? Number(verba.saldoInicial) : 0,
    observacoes: verba?.observacoes || null,
    movimentacoes: (verba?.movimentacoes || []).map((m: any) => ({
      id: m.id,
      tipo: m.tipo,
      valor: Number(m.valor),
      descricao: m.descricao,
      dataMovimento: m.dataMovimento.toISOString(),
      criadoPorNome: m.criadoPor?.nome || null,
    })),
    saldo,
  });
}

// PATCH: ajuste administrativo do saldo inicial (ponto de partida do controle, ex: ao
// migrar de uma planilha) — o dia a dia de aportes/devoluções passa por
// .../movimentacoes, que preserva histórico; isso aqui não gera linha de extrato.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const verba = await prisma.verbaTrafego.upsert({
    where: { clienteId: params.id },
    update: {
      ...(body.saldoInicial !== undefined && { saldoInicial: body.saldoInicial }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
    },
    create: {
      clienteId: params.id,
      saldoInicial: body.saldoInicial || 0,
      observacoes: body.observacoes || null,
    },
  });

  return NextResponse.json(verba);
}
