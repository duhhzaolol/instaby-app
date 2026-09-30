import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";

// Etapa 3 (v157) — mesma correção de permissão do POST em
// /api/clientes/[id]/solicitacoes: antes só exigia sessão, agora exige
// acessoClienteCompleto + poder ver esse cliente específico (só dá pra saber o
// clienteId depois de buscar a solicitação, por isso o findUnique antes da
// checagem — mesmo padrão de PATCH /api/tarefas/[id]).
async function autorizar(id: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return { erro: NextResponse.json({ erro: "Não autenticado" }, { status: 401 }) };
  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
  if (!solicitacao) return { erro: NextResponse.json({ erro: "Não encontrada" }, { status: 404 }) };
  if (!(await podeVerCliente(usuario, solicitacao.clienteId)) || !permissoesDe(usuario).acessoClienteCompleto) {
    return { erro: NextResponse.json({ erro: "Não autorizado" }, { status: 403 }) };
  }
  return { usuario, solicitacao };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await autorizar(params.id);
  if (auth.erro) return auth.erro;

  const body = await request.json();
  const solicitacao = await prisma.solicitacao.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      ...(body.extra !== undefined && { extra: body.extra }),
      // Etapa 3 (v157) — "separar prazo desejado pelo cliente do prazo
      // confirmado pela agência": só esse campo aqui é editável pela equipe.
      ...(body.prazoConfirmado !== undefined && { prazoConfirmado: body.prazoConfirmado ? new Date(body.prazoConfirmado) : null }),
    },
  });
  return NextResponse.json(solicitacao);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await autorizar(params.id);
  if (auth.erro) return auth.erro;

  await prisma.solicitacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
