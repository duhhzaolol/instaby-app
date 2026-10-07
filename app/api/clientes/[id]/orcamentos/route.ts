import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarSlug } from "@/lib/slug";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { apresentacaoPadrao, validarApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;

  const orcamentos = await prisma.orcamento.findMany({
    where: { clienteId: params.id },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orcamentos);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  const validacao = Object.prototype.hasOwnProperty.call(body, "apresentacao")
    ? validarApresentacaoOrcamento(body.apresentacao)
    : undefined;
  if (validacao?.erro) {
    return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  }
  // body.itens = [{ servicoId, quantidade, valor }]

  if (!Array.isArray(body.itens) || body.itens.length === 0) {
    return NextResponse.json({ erro: "Selecione ao menos um serviço" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  const servicos = await prisma.servico.findMany({
    where: { id: { in: body.itens.map((i: any) => i.servicoId) } },
  });
  const servicoPorId = new Map(servicos.map((s) => [s.id, s]));

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId: params.id,
      slug: gerarSlug(cliente.nome),
      status: "pendente",
      enviadoEm: new Date(),
      apresentacao: validacao?.apresentacao ?? apresentacaoPadrao(cliente.nome, servicos.map((servico) => servico.unidade)),
      itens: {
        create: body.itens.map((item: { servicoId: string; quantidade: number; valor: number }) => ({
          servicoId: item.servicoId,
          quantidade: item.quantidade,
          valor: item.valor,
          nomeServico: servicoPorId.get(item.servicoId)?.nome || null,
          descricaoServico: servicoPorId.get(item.servicoId)?.descricao || null,
        })),
      },
    },
    include: { itens: true },
  });

  // Etapa 3 (v157) — "preparar orçamento adicional" a partir de um pedido fora do
  // escopo: liga esse orçamento de volta na solicitação de origem (pra tela não
  // deixar preparar dois orçamentos da mesma solicitação por engano) e avança o
  // status dela, se ainda estava "pendente". O ciclo de cobrança em si não muda
  // em nada — esse orçamento nasce "pendente" igual qualquer outro, só vira
  // cobrança se/quando o cliente aceitar (ver Orcamento.status), exatamente como
  // pedido: "sem cobrar automaticamente". Best-effort: nunca derruba a criação do
  // orçamento (que já aconteceu) se esse vínculo falhar por algum motivo.
  if (body.solicitacaoId) {
    try {
      const solicitacao = await prisma.solicitacao.findUnique({ where: { id: body.solicitacaoId } });
      if (solicitacao && solicitacao.clienteId === params.id && !solicitacao.orcamentoPreparadoId) {
        await prisma.solicitacao.update({
          where: { id: solicitacao.id },
          data: {
            orcamentoPreparadoId: orcamento.id,
            ...(solicitacao.status === "pendente" && { status: "em_andamento" }),
          },
        });
      }
    } catch (e) {
      console.error("Não consegui vincular o orçamento à solicitação de origem:", e);
    }
  }

  return NextResponse.json(orcamento, { status: 201 });
}
