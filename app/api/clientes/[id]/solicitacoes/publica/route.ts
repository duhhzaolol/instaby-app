import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usuariosComAcessoAoCliente } from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";

// Formulário público de solicitação do cliente (Etapa 3 v157) — sem login, mesmo
// espírito de /api/orcamento/[slug]/aceitar e do PATCH público de
// /api/relatorios/[id]: rota SEPARADA da interna (POST em
// /api/clientes/[id]/solicitacoes, que exige sessão+permissão), liberada no
// middleware só pra esse caminho+método específico. Nunca reaproveita a rota
// interna porque uma exige sessão e a outra não pode exigir — não dá pra ter as
// duas coisas na mesma rota.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });

  const body = await request.json();

  if (!body.descricao || !body.descricao.trim()) {
    return NextResponse.json({ erro: "Descreva o que você precisa." }, { status: 400 });
  }
  if (!body.categoria || !CATEGORIAS_TAREFA.some((c) => c.valor === body.categoria)) {
    return NextResponse.json({ erro: "Escolha o tipo do pedido." }, { status: 400 });
  }
  const solicitanteContatoId = typeof body.solicitanteContatoId === "string" ? body.solicitanteContatoId : null;
  const solicitanteNomeLivre = typeof body.solicitanteNomeLivre === "string" ? body.solicitanteNomeLivre.trim() : "";
  if (!solicitanteContatoId && !solicitanteNomeLivre) {
    return NextResponse.json({ erro: "Diz pra gente quem está pedindo." }, { status: 400 });
  }
  if (solicitanteContatoId) {
    const contatoValido = await prisma.contato.findFirst({ where: { id: solicitanteContatoId, clienteId: params.id } });
    if (!contatoValido) return NextResponse.json({ erro: "Contato inválido." }, { status: 400 });
  }

  const respostas: Record<string, string> =
    body.respostas && typeof body.respostas === "object" && !Array.isArray(body.respostas)
      ? Object.fromEntries(
          Object.entries(body.respostas)
            .filter(([, v]) => typeof v === "string" && (v as string).trim())
            .map(([k, v]) => [String(k), (v as string).trim()])
        )
      : {};

  const anexos: string[] = Array.isArray(body.anexos) ? body.anexos.filter((a: unknown) => typeof a === "string") : [];

  const solicitacao = await prisma.solicitacao.create({
    data: {
      clienteId: params.id,
      descricao: body.descricao.trim(),
      origem: "cliente",
      categoria: body.categoria,
      respostas,
      anexos,
      prazoDesejado: body.prazoDesejado ? new Date(body.prazoDesejado) : null,
      solicitanteContatoId: solicitanteContatoId || null,
      solicitanteNomeLivre: solicitanteContatoId ? null : solicitanteNomeLivre,
      // extra/prioridade ficam no padrão (false/"media") — quem avalia se é fora
      // do escopo e a urgência de verdade é a equipe, não o próprio formulário.
    },
  });

  // Notificação (Etapa 1 item 6, reaproveitada aqui) — nunca trava a resposta se
  // falhar (criarNotificacao já engole erro sozinho). Filtra por
  // acessoClienteCompleto igual ao PATCH de /api/relatorios/[id] e a
  // usuariosParaNotificarRevisao: usuariosComAcessoAoCliente() sozinho inclui
  // Gestor de Tráfego (acesso só à verba de mídia daquele cliente) — sem esse
  // filtro, o título do pedido (que pode conter qualquer assunto operacional)
  // vazaria pra um perfil que nem consegue abrir a aba Solicitações pra ler o
  // resto. Corrigido antes de entregar a etapa (não fazia parte do código
  // existente — é um descuido desta própria implementação, pego na revisão final).
  const destinatarios = (await usuariosComAcessoAoCliente(params.id)).filter(
    (u) => u.master || u.acessoClienteCompleto
  );
  await notificarVarios(
    destinatarios.map((u) => u.id),
    {
      tipo: "solicitacao_cliente",
      titulo: `Novo pedido do cliente: ${body.descricao.trim().slice(0, 80)}`,
      clienteId: params.id,
      link: `/dashboard/clientes/${params.id}?aba=solicitacoes`,
      agrupadorChave: `solicitacao_cliente:${solicitacao.id}`,
    }
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
