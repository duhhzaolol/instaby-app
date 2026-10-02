import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { centavosFinanceiros, dataFinanceira, dataFinanceiraValida, STATUS_FINANCEIROS } from "@/lib/datasFinanceiro";
import { criarLancamentoFinanceiro, ErroFinanceiro } from "@/lib/lancamentosFinanceiros";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const centavos = centavosFinanceiros(body.valor);
  if (centavos === null) return NextResponse.json({ erro: "Informe um valor válido, não negativo e com até duas casas decimais." }, { status: 400 });
  const tipo = body.tipo || "unica";
  const status = body.status || "pendente";
  if (!STATUS_FINANCEIROS.includes(status) || !["recorrente", "unica"].includes(tipo)) return NextResponse.json({ erro: "Tipo ou status inválido." }, { status: 400 });
  if (["vencimento", "data", "dataCompetencia", "dataRecebimento"].some(c => !dataFinanceiraValida(body[c]))) return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  const vencimento = dataFinanceira(body.vencimento);
  const data = dataFinanceira(body.data);
  try {
    const cobranca = await criarLancamentoFinanceiro("cobranca", {
      clienteId: params.id, valor: centavos / 100, tipo, categoria: body.categoria || null, status, vencimento,
      dataCompetencia: dataFinanceira(body.dataCompetencia) || data || vencimento,
      dataRecebimento: status === "pago" ? dataFinanceira(body.dataRecebimento) || data || new Date() : dataFinanceira(body.dataRecebimento),
    });
    return NextResponse.json(cobranca, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: erro instanceof ErroFinanceiro ? erro.message : "Não consegui criar a cobrança. Tente novamente." }, { status: erro instanceof ErroFinanceiro ? erro.status : 500 });
  }
}
