import { NextRequest, NextResponse } from "next/server";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { centavosFinanceiros, dataFinanceira, dataFinanceiraValida } from "@/lib/datasFinanceiro";
import { ErroFinanceiro, registrarPagamentoFinanceiro } from "@/lib/lancamentosFinanceiros";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const centavos = centavosFinanceiros(body.valor, true);
  if (centavos === null) return NextResponse.json({ erro: "Informe um valor positivo e com até duas casas decimais." }, { status: 400 });
  if (!dataFinanceiraValida(body.data)) return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  try {
    const pagamento = await registrarPagamentoFinanceiro("despesa", params.id, centavos / 100, dataFinanceira(body.data) || new Date());
    return NextResponse.json(pagamento, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: erro instanceof ErroFinanceiro ? erro.message : "Não consegui registrar o pagamento. Tente novamente." }, { status: erro instanceof ErroFinanceiro ? erro.status : 500 });
  }
}
