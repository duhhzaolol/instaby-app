import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente, usuariosComAcessoAoCliente } from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";

const LIMITE_COMENTARIO = 2000;

// ATENÇÃO: antes da Etapa 1 v152 essa rota não checava autenticação NENHUMA —
// qualquer pessoa que soubesse (ou adivinhasse) o ID de um relatório conseguia
// tanto apagar o relatório (DELETE) quanto escrever um "comentário oficial da
// Instaby" nele (PATCH comentarioAgencia), que aparece pro cliente na página
// pública. Corrigido abaixo. O único uso legítimo sem login é o cliente
// comentando no próprio relatório público (comentarioCliente) — isso continua
// aberto de propósito, porque o cliente nunca teve conta no sistema.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existente = await prisma.relatorioPeriodo.findUnique({
    where: { id: params.id },
    include: { cliente: { select: { nome: true } } },
  });
  if (!existente) return NextResponse.json({ erro: "Relatório não encontrado" }, { status: 404 });

  const body = await request.json();
  const dados: { comentarioAgencia?: string | null; comentarioCliente?: string | null; comentarioClienteEm?: Date | null } = {};

  // Comentário da agência — mesma trava de quem pode mexer nesse cliente que já
  // protege a aba Relatórios (acessoClienteCompleto) em
  // app/dashboard/clientes/[id]/page.tsx.
  if (body.comentarioAgencia !== undefined) {
    const usuario = await getUsuarioAtual();
    if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    if (!permissoesDe(usuario).acessoClienteCompleto) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
    }
    if (!(await podeVerCliente(usuario, existente.clienteId))) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
    }
    dados.comentarioAgencia = body.comentarioAgencia ? String(body.comentarioAgencia).slice(0, LIMITE_COMENTARIO) : null;
  }

  // Comentário do cliente — enviado sem login pela página pública do relatório
  // (ComentarioCliente em app/relatorio/[id]/RelatorioInterativo.tsx). Sana o
  // texto (nunca confia em tamanho/tipo vindo de fora) e marca comentarioClienteEm
  // só quando é de fato um texto novo, pra saber quando avisar a agência
  // (Etapa 1 item 7) sem precisar comparar strings.
  let avisarComentarioNovo = false;
  if (body.comentarioCliente !== undefined) {
    const texto = body.comentarioCliente ? String(body.comentarioCliente).trim().slice(0, LIMITE_COMENTARIO) : "";
    dados.comentarioCliente = texto || null;
    dados.comentarioClienteEm = texto ? new Date() : null;
    // Só avisa quando o texto realmente mudou — reenviar o mesmo comentário sem
    // querer (duplo clique, reabrir a página) não deve gerar notificação nova.
    avisarComentarioNovo = !!texto && texto !== (existente.comentarioCliente || "");
  }

  const relatorio = await prisma.relatorioPeriodo.update({
    where: { id: params.id },
    data: dados,
  });

  // Notifica quem tem acesso operacional completo a esse cliente — não só quem
  // criou o relatório, porque um comentário de cliente é do interesse de
  // qualquer um que atenda esse cliente por inteiro, não só de quem lançou
  // aquele período específico. Filtra por acessoClienteCompleto (a mesma trava
  // que já protege a aba Relatórios e o PATCH de comentarioAgencia acima) —
  // sem isso, um Gestor de Tráfego com acesso só à verba de mídia receberia uma
  // notificação de "comentário no relatório" que a própria aba não deixa ele
  // abrir nem responder.
  if (avisarComentarioNovo) {
    const pessoas = (await usuariosComAcessoAoCliente(existente.clienteId)).filter(
      (p) => p.master || p.acessoClienteCompleto
    );
    await notificarVarios(
      pessoas.map((p) => p.id),
      {
        tipo: "comentario_relatorio",
        titulo: `${existente.cliente.nome} comentou um relatório`,
        corpo: dados.comentarioCliente || undefined,
        clienteId: existente.clienteId,
        relatorioId: relatorio.id,
        link: `/dashboard/clientes/${existente.clienteId}?aba=relatorios`,
        // Chave explícita por relatório (não só por cliente) — comentários em
        // relatórios DIFERENTES do mesmo cliente não podem se agrupar num só;
        // só comentários repetidos NESSE MESMO relatório devem virar "2x, 3x...".
        agrupadorChave: `comentario_relatorio:${relatorio.id}`,
      }
    );
  }

  return NextResponse.json(relatorio);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const existente = await prisma.relatorioPeriodo.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Relatório não encontrado" }, { status: 404 });
  if (!permissoesDe(usuario).acessoClienteCompleto) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (!(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.relatorioPeriodo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
