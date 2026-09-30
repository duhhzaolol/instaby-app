import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

// Etapa 3 (v157) — antes dessas duas rotas não tinham NENHUMA checagem de
// permissão própria (só a exigência genérica de "estar logado" do middleware):
// qualquer pessoa autenticada, mesmo sem verFinanceiro (ex: Gestor de Tráfego,
// Editor), conseguia mudar quantidade/valor de um serviço contratado ou removê-lo
// chamando a rota direto — mesmo a aba "Serviços" já sendo escondida da interface
// pra esse perfil. Corrigido aqui pra aplicar no servidor a mesma regra que a
// interface já sugeria (ver app/dashboard/clientes/[id]/page.tsx: aba "servicos"
// exige pode.verFinanceiro) — exatamente o tipo de lacuna que a regra geral
// "aplique permissões no servidor... além de esconder na interface" pede pra
// fechar. Reportado no changelog da v157.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;

  const existente = await prisma.servicoContratado.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const body = await request.json();

  // Histórico (Etapa 3 v157) — uma linha por campo que realmente mudou, mesmo
  // padrão de HistoricoTarefa em PATCH /api/tarefas/[id]: calculado ANTES do
  // update, comparando contra o que já existia.
  type LinhaHistorico = { campo: string; valorAntigo: string | null; valorNovo: string | null };
  const historico: LinhaHistorico[] = [];
  if (body.quantidade !== undefined && body.quantidade !== existente.quantidade) {
    historico.push({ campo: "quantidade", valorAntigo: String(existente.quantidade), valorNovo: String(body.quantidade) });
  }
  if (body.valor !== undefined && Number(body.valor) !== Number(existente.valor)) {
    historico.push({ campo: "valor", valorAntigo: String(existente.valor), valorNovo: String(body.valor) });
  }
  if (body.ativo !== undefined && !!body.ativo !== existente.ativo) {
    historico.push({ campo: "ativo", valorAntigo: existente.ativo ? "Ativo" : "Removido", valorNovo: body.ativo ? "Ativo" : "Removido" });
  }

  const contratado = await prisma.servicoContratado.update({
    where: { id: params.id },
    data: {
      ...(body.quantidade !== undefined && { quantidade: body.quantidade }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(body.rolloverPendencias !== undefined && { rolloverPendencias: !!body.rolloverPendencias }),
    },
    include: { servico: true },
  });

  if (historico.length > 0) {
    await prisma.historicoServicoContratado.createMany({
      data: historico.map((h) => ({ servicoContratadoId: contratado.id, usuarioId: usuario!.id, ...h })),
    });
  }

  return NextResponse.json(contratado);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;

  const existente = await prisma.servicoContratado.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  // Etapa 3 (v157) — "remover" virou desativar (ativo=false) em vez de apagar a
  // linha, pra "manter o histórico quando o pacote contratado mudar" mesmo pro
  // caso de remoção. Não muda nada visível: todo lugar que lê servicosContratados
  // já filtra ativo:true (Início, ficha do cliente, resumo de cobrança, geração
  // de contrato, orçamento novo — auditado na v157), então o item some da tela do
  // mesmo jeito que sumia antes. Só passa a existir uma linha de histórico
  // registrando quando e por quem foi removido, em vez de perder o registro.
  if (existente.ativo) {
    await prisma.historicoServicoContratado.create({
      data: { servicoContratadoId: existente.id, usuarioId: usuario!.id, campo: "ativo", valorAntigo: "Ativo", valorNovo: "Removido" },
    });
  }
  await prisma.servicoContratado.update({ where: { id: params.id }, data: { ativo: false } });

  return NextResponse.json({ ok: true });
}
