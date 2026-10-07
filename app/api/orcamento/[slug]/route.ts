import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";
import { validarApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: {
      cliente: true,
      itens: { include: { servico: true } },
    },
  });

  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { usuario, erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, "apresentacao")) {
    return NextResponse.json({ erro: "Envie apenas a apresentação da proposta." }, { status: 400 });
  }
  const validacao = validarApresentacaoOrcamento((body as Record<string, unknown>).apresentacao);
  if (validacao.erro) {
    return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  }
  const apresentacao = validacao.apresentacao;

  const autorizado = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    select: { id: true, clienteId: true },
  });
  if (!autorizado) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }
  if (!(await podeVerCliente(usuario, autorizado.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  return prisma.$transaction(async (tx) => {
    // A mesma trava usada no aceite impede salvar uma apresentação enquanto
    // outra requisição confirma e congela esta proposta.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`aceite-orcamento:${params.slug}`}))`;
    const orcamento = await tx.orcamento.findUnique({
      where: { slug: params.slug },
      select: { id: true, clienteId: true, status: true },
    });
    if (!orcamento) {
      return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
    }
    // O acesso foi conferido antes da transação para não ocupar uma segunda
    // conexão do pool. Confirme a identidade após a trava, antes de salvar.
    if (orcamento.id !== autorizado.id || orcamento.clienteId !== autorizado.clienteId) {
      return NextResponse.json({ erro: "O orçamento mudou. Atualize a página antes de editar." }, { status: 409 });
    }
    if (orcamento.status === "aceito") {
      return NextResponse.json({ erro: "Uma proposta aceita não pode ser alterada." }, { status: 409 });
    }

    const atualizado = await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { apresentacao },
      select: { apresentacao: true },
    });
    return NextResponse.json(atualizado);
  }, { maxWait: 15000, timeout: 20000 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;

  const orcamento = await prisma.orcamento.findUnique({ where: { slug: params.slug } });
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.itemOrcamento.deleteMany({ where: { orcamentoId: orcamento.id } }),
    prisma.contrato.updateMany({ where: { orcamentoId: orcamento.id }, data: { orcamentoId: null } }),
    prisma.cobranca.updateMany({ where: { orcamentoId: orcamento.id }, data: { orcamentoId: null } }),
    prisma.orcamento.delete({ where: { id: orcamento.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
