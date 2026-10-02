import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sincronizarMensalidadeCliente } from "@/lib/mensalidades";
import { exigirPermissaoApi } from "@/lib/permissoes";

// Etapa 3 (v157) — mesma lacuna e mesma correção de app/api/servicos-contratados/
// [id]/route.ts: essa rota lida com valor/quantidade de contrato (financeiro),
// então agora exige verFinanceiro no servidor, igual a aba já exigia na interface.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;

  const contratados = await prisma.servicoContratado.findMany({
    where: { clienteId: params.id, ativo: true },
    include: { servico: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(contratados);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;

  const body = await request.json();

  if (!body.servicoId || typeof body.valor !== "number" || !Number.isFinite(body.valor) || body.valor < 0 || (body.quantidade !== undefined && (!Number.isInteger(body.quantidade) || body.quantidade < 1))) {
    return NextResponse.json({ erro: "Serviço e um valor numérico válido são obrigatórios" }, { status: 400 });
  }

  try {
    // Etapa 3 (v157) — "remover" um serviço contratado agora desativa em vez de
    // apagar (ver DELETE em /api/servicos-contratados/[id]), pra manter o
    // histórico. Se esse mesmo par cliente+serviço já existiu antes e foi
    // removido, reativa a linha antiga (com os novos valores) em vez de criar uma
    // segunda linha solta — assim o histórico de "tinha, tirou, voltou a ter" fica
    // inteiro num lugar só. Só cria linha nova de verdade na primeira vez.
    const inativoExistente = await prisma.servicoContratado.findFirst({
      where: { clienteId: params.id, servicoId: body.servicoId, ativo: false },
      orderBy: { createdAt: "desc" },
    });

    if (inativoExistente) {
      const historico: { campo: string; valorAntigo: string | null; valorNovo: string | null }[] = [
        { campo: "ativo", valorAntigo: "Removido", valorNovo: "Ativo" },
      ];
      const novaQuantidade = body.quantidade || 1;
      if (novaQuantidade !== inativoExistente.quantidade) {
        historico.push({ campo: "quantidade", valorAntigo: String(inativoExistente.quantidade), valorNovo: String(novaQuantidade) });
      }
      if (Number(body.valor) !== Number(inativoExistente.valor)) {
        historico.push({ campo: "valor", valorAntigo: String(inativoExistente.valor), valorNovo: String(body.valor) });
      }

      const reativado = await prisma.servicoContratado.update({
        where: { id: inativoExistente.id },
        data: { ativo: true, quantidade: novaQuantidade, valor: body.valor },
        include: { servico: true },
      });
      await prisma.historicoServicoContratado.createMany({
        data: historico.map((h) => ({ servicoContratadoId: reativado.id, usuarioId: usuario!.id, ...h })),
      });
      await sincronizarMensalidadeCliente(params.id, undefined, true);
      return NextResponse.json(reativado, { status: 201 });
    }

    const contratado = await prisma.servicoContratado.create({
      data: {
        clienteId: params.id,
        servicoId: body.servicoId,
        quantidade: body.quantidade || 1,
        valor: body.valor,
      },
      include: { servico: true },
    });

    await sincronizarMensalidadeCliente(params.id, undefined, true);
    return NextResponse.json(contratado, { status: 201 });
  } catch {
    return NextResponse.json(
      { erro: "Não deu pra adicionar esse serviço — confere se ele ainda existe no catálogo e tem um valor válido." },
      { status: 400 }
    );
  }
}
