import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { CATEGORIAS_FINANCEIRAS } from "@/lib/categoriasFinanceiras";
import { centavosFinanceiros, dataFinanceira, dataFinanceiraValida } from "@/lib/datasFinanceiro";
import { criarLancamentoFinanceiro, ErroFinanceiro } from "@/lib/lancamentosFinanceiros";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Cadastro revisado na tela, com a sessão habitual do usuário. Abrir ou fechar
// a página não passa por esta rota. O id é estável por usuário e tentativa,
// inclusive se a resposta se perder: despesa e baixa nascem na mesma transação.
export async function POST(request: NextRequest) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  const centavos = centavosFinanceiros(body.valor, true);
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  if (typeof body.idempotenciaId !== "string" || !UUID.test(body.idempotenciaId) ||
      !descricao || descricao.length > 500 || centavos === null) {
    return NextResponse.json({ erro: "Informe a descrição e um valor positivo com até duas casas decimais." }, { status: 400 });
  }
  if (typeof body.data !== "string" || !body.data || !dataFinanceiraValida(body.data)) {
    return NextResponse.json({ erro: "Informe uma data válida para a compra." }, { status: 400 });
  }
  const data = dataFinanceira(body.data)!;
  const classificacao = body.categoriaFinanceira || "despesa_variavel";
  if (!CATEGORIAS_FINANCEIRAS.some(c => c.valor === classificacao) ||
      (body.categoria != null && (typeof body.categoria !== "string" || body.categoria.trim().length > 100)) ||
      (body.clienteId != null && (typeof body.clienteId !== "string" || body.clienteId.length > 100))) {
    return NextResponse.json({ erro: "Classificação ou cliente inválido." }, { status: 400 });
  }
  const clienteId = body.clienteId || null;
  if (clienteId) {
    if (!await podeVerCliente(usuario, clienteId)) {
      return NextResponse.json({ erro: "Você não tem acesso a esse cliente." }, { status: 403 });
    }
    if (!await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } })) {
      return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
    }
  }
  const id = `debito_${createHash("sha256").update(`${usuario.id}:${body.idempotenciaId.toLowerCase()}`).digest("hex")}`;
  const categoria = body.categoria?.trim() || null;
  const dados = {
    id, descricao, valor: centavos / 100, clienteId, data,
    tipo: "flexivel", status: "pago", categoriaFinanceira: classificacao,
    categoria, subcategoria: null, recorrente: false,
    vencimento: null, dataPagamento: data,
  };
  const buscarExistente = () => prisma.despesa.findUnique({ where: { id }, include: { pagamentos: true } });
  function respostaExistente(existente: NonNullable<Awaited<ReturnType<typeof buscarExistente>>>) {
    const totalPago = existente.pagamentos.reduce((total, p) => total + Math.round(Number(p.valor) * 100), 0);
    const mesmosDados = existente.descricao === descricao &&
      Math.round(Number(existente.valor) * 100) === centavos && existente.clienteId === clienteId &&
      existente.data.getTime() === data.getTime() && existente.categoriaFinanceira === classificacao &&
      existente.categoria === categoria && existente.tipo === "flexivel" && !existente.recorrente &&
      existente.dataPagamento?.getTime() === data.getTime() &&
      existente.pagamentos.every(p => p.data.getTime() === data.getTime());
    if (!mesmosDados || existente.status !== "pago" || totalPago !== centavos) {
      return NextResponse.json({ erro: "Esse gasto já foi registrado. Confira o Financeiro antes de cadastrar outro; nenhum valor foi alterado." }, { status: 409 });
    }
    return NextResponse.json({ id, descricao, valor: centavos! / 100, data: body.data, reutilizado: true });
  }
  try {
    const existente = await buscarExistente();
    if (existente) return respostaExistente(existente);
    await criarLancamentoFinanceiro("despesa", dados);
    return NextResponse.json({ id, descricao, valor: centavos / 100, data: body.data, reutilizado: false }, { status: 201 });
  } catch (erro) {
    if ((erro as { code?: string })?.code === "P2002") {
      // Dois cliques/reenvios simultâneos: a chave primária resolve a disputa.
      // A transação perdedora não registra nenhuma segunda saída no caixa.
      try {
        const existente = await buscarExistente();
        if (existente) return respostaExistente(existente);
      } catch { /* A resposta abaixo permite repetir a mesma tentativa. */ }
    }
    return NextResponse.json({ erro: erro instanceof ErroFinanceiro ? erro.message : "Não consegui confirmar o registro. Tente novamente com os mesmos dados ou confira o Financeiro." }, { status: erro instanceof ErroFinanceiro ? erro.status : 500 });
  }
}
