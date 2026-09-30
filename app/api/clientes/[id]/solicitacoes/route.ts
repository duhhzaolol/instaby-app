import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";

// Registro RÁPIDO INTERNO ("a equipe anota o que o cliente pediu por fora",
// comportamento original desse endpoint, preservado 100% — ver SolicitacoesTab).
// Etapa 3 (v157): antes essa rota só exigia estar logado (nenhuma pessoa
// específica, nenhum nível de acesso) — igual à lacuna já corrigida em
// /api/servicos-contratados; agora exige a mesma coisa que a aba "Solicitações"
// já exige na interface (acessoClienteCompleto + ver esse cliente específico).
// O pedido feito pelo PRÓPRIO cliente (sem login) usa a rota nova e pública
// /api/clientes/[id]/solicitacoes/publica, que não passa por aqui.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!(await podeVerCliente(usuario, params.id)) || !permissoesDe(usuario).acessoClienteCompleto) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.descricao) {
    return NextResponse.json({ erro: "Descrição é obrigatória" }, { status: 400 });
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      clienteId: params.id,
      descricao: body.descricao,
      prioridade: body.prioridade || "media",
      extra: !!body.extra,
      origem: "interno",
      // Categoria é opcional aqui (a equipe pode não saber/não precisar
      // classificar um recado rápido) — quando vem preenchida, alimenta o mesmo
      // fluxo de "transformar em tarefa"/"preparar orçamento" do pedido público.
      categoria: body.categoria || null,
    },
  });

  return NextResponse.json(solicitacao, { status: 201 });
}
