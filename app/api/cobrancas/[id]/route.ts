import { NextRequest, NextResponse } from "next/server";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { centavosFinanceiros, dataFinanceira, dataFinanceiraValida, STATUS_FINANCEIROS } from "@/lib/datasFinanceiro";
import { ErroFinanceiro, editarLancamentoFinanceiro, excluirLancamentoFinanceiro } from "@/lib/lancamentosFinanceiros";

function falha(erro: unknown) {
  return NextResponse.json({ erro: erro instanceof ErroFinanceiro ? erro.message : "Não consegui atualizar o lançamento. Tente novamente." }, { status: erro instanceof ErroFinanceiro ? erro.status : 500 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  if (body.valor !== undefined && centavosFinanceiros(body.valor) === null) return NextResponse.json({ erro: "Informe um valor válido, não negativo e com até duas casas decimais." }, { status: 400 });
  if (body.status !== undefined && !STATUS_FINANCEIROS.includes(body.status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  if (body.tipo !== undefined && !["recorrente", "unica"].includes(body.tipo)) return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
  const datas = ["vencimento", "dataCompetencia", "dataRecebimento"];
  if (datas.some(c => !dataFinanceiraValida(body[c]))) return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  const dados: Record<string, unknown> = {};
  for (const campo of ["valor", "tipo", "categoria", "status", "vencimento", "dataCompetencia", "dataRecebimento"]) {
    if (body[campo] === undefined) continue;
    dados[campo] = datas.includes(campo) ? dataFinanceira(body[campo]) : campo === "valor" ? centavosFinanceiros(body.valor)! / 100 : body[campo];
  }
  try { return NextResponse.json(await editarLancamentoFinanceiro("cobranca", params.id, dados)); } catch (erro) { return falha(erro); }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  try { await excluirLancamentoFinanceiro("cobranca", params.id); return NextResponse.json({ ok: true }); } catch (erro) { return falha(erro); }
}
