import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { centavosFinanceiros, dataFinanceira, dataFinanceiraValida, STATUS_FINANCEIROS } from "@/lib/datasFinanceiro";
import { criarLancamentoFinanceiro, ErroFinanceiro } from "@/lib/lancamentosFinanceiros";

export async function GET() {
  const { erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;
  return NextResponse.json(await prisma.despesa.findMany({ orderBy: { data: "desc" }, include: { cliente: true }, take: 50 }));
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const centavos = centavosFinanceiros(body.valor);
  if (typeof body.descricao !== "string" || !body.descricao.trim() || centavos === null) return NextResponse.json({ erro: "Informe descrição e valor válido, não negativo e com até duas casas decimais." }, { status: 400 });
  const status = body.status || "pago";
  const tipo = body.tipo || "flexivel";
  if (!STATUS_FINANCEIROS.includes(status) || !["fixa", "flexivel"].includes(tipo)) return NextResponse.json({ erro: "Status ou tipo inválido." }, { status: 400 });
  if (["data", "vencimento", "dataPagamento"].some(c => !dataFinanceiraValida(body[c]))) return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  const data = dataFinanceira(body.data) || new Date();
  try {
    const despesa = await criarLancamentoFinanceiro("despesa", {
      descricao: body.descricao.trim(), valor: centavos / 100, clienteId: body.clienteId || null,
      tipo, categoriaFinanceira: body.categoriaFinanceira || null, categoria: body.categoria || null,
      subcategoria: body.subcategoria || null, recorrente: body.recorrente === true, status,
      vencimento: dataFinanceira(body.vencimento), data,
      dataPagamento: status === "pago" ? dataFinanceira(body.dataPagamento) || data : dataFinanceira(body.dataPagamento),
    }, body.categoriaFinanceira === "investimento" && body.adicionarAoPatrimonio ? async (tx, lancamento) => {
      await tx.patrimonio.create({ data: {
        nome: body.descricao.trim(), categoria: body.categoria || null,
        valorAquisicao: centavos / 100, valorAtual: centavos / 100,
        data: lancamento.data, despesaOrigemId: lancamento.id,
      } });
    } : undefined);
    return NextResponse.json(despesa, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: erro instanceof ErroFinanceiro ? erro.message : "Não consegui criar a despesa. Tente novamente." }, { status: erro instanceof ErroFinanceiro ? erro.status : 500 });
  }
}
