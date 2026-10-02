import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const body = await request.json().catch(() => ({ itens: [] }));
  const itens: { id: string; quantidade: number; valor: number }[] = body.itens || [];
  if (!Array.isArray(itens) || itens.some(i => !Number.isInteger(i.quantidade) || i.quantidade < 0 || !Number.isFinite(i.valor) || i.valor < 0)) {
    return NextResponse.json({ erro: "Confira os valores e quantidades da proposta." }, { status: 400 });
  }
  const resultado = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`aceite-orcamento:${params.slug}`}))`;
    const orcamento = await tx.orcamento.findUnique({ where: { slug: params.slug }, include: { itens: true } });
    if (!orcamento) return null;
    // Recarregar a página ou repetir a confirmação não cobra outra vez nem muda
    // os itens de uma proposta que já foi aceita.
    if (orcamento.status === "aceito") return orcamento;
    const idsValidos = new Set(orcamento.itens.map(i => i.id));
    for (const item of itens.filter(i => idsValidos.has(i.id))) {
      if (item.quantidade === 0) await tx.itemOrcamento.delete({ where: { id: item.id } });
      else {
        const original = orcamento.itens.find(i => i.id === item.id)!;
        const unitario = original.quantidade > 0 ? Number(original.valor) / original.quantidade : Number(original.valor);
        await tx.itemOrcamento.update({ where: { id: item.id }, data: { quantidade: item.quantidade, valor: Math.round(unitario * item.quantidade * 100) / 100 } });
      }
    }
    const itensFinais = await tx.itemOrcamento.findMany({ where: { orcamentoId: orcamento.id } });
    const total = itensFinais.reduce((soma, item) => soma + Math.round(Number(item.valor) * 100), 0) / 100;
    const atualizado = await tx.orcamento.update({ where: { id: orcamento.id }, data: { status: "aceito", dataAceite: new Date() } });
    const cobranca = await tx.cobranca.findFirst({ where: { orcamentoId: orcamento.id } });
    if (!cobranca && total > 0) await tx.cobranca.create({ data: {
      clienteId: orcamento.clienteId, orcamentoId: orcamento.id, valor: total,
      tipo: "unica", categoria: "Serviços", status: "pendente",
    } });
    await tx.cliente.update({ where: { id: orcamento.clienteId }, data: { status: "ativo" } });
    return atualizado;
  }, { maxWait: 15000, timeout: 20000 });
  if (!resultado) return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  return NextResponse.json(resultado);
}
