import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

// Falha de segurança corrigida de passagem (Etapa 4 v158, achada revisando este
// arquivo pra somar o modo "ciclo completo"): as 3 rotas de templates-tarefas
// (esta, [id] e [id]/aplicar) não tinham NENHUMA checagem de permissão além de
// "estar logado" — mesma classe de lacuna já fechada na Etapa 3 em
// servicos-contratados/solicitações. A seção "Templates de tarefas" só aparece na
// tela pra quem tem `gerenciarConfiguracoes` (ver app/dashboard/configuracoes/
// page.tsx) — agora a criação/edição/exclusão do TEMPLATE em si exige a mesma
// permissão no servidor. Já "aplicar" um template (gera tarefas) é tratado à
// parte, na própria rota de aplicar, com a MESMA trava de criar uma tarefa comum
// (podeVerCliente) — não gerenciarConfiguracoes, que seria restritivo demais pra
// uma ação do dia a dia.
export async function GET() {
  const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
  if (erro) return erro;

  const templates = await prisma.templateTarefas.findMany({
    orderBy: { nome: "asc" },
    include: { etapas: { orderBy: { ordem: "asc" } } },
  });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
  if (erro) return erro;

  const body = await request.json();
  const etapas = Array.isArray(body.etapas) ? body.etapas : [];
  const itens = Array.isArray(body.itens) ? body.itens : [];

  if (!body.nome || (etapas.length === 0 && itens.length === 0)) {
    return NextResponse.json({ erro: "Nome e ao menos um item ou etapa são obrigatórios" }, { status: 400 });
  }

  // Etapa 4 (v158) — modo "ciclo completo": só grava etapa com título preenchido,
  // recalcula `ordem` pela posição enviada (ignora qualquer ordem que venha do
  // corpo da requisição) pra nunca depender de o cliente mandar isso certo.
  const template = await prisma.templateTarefas.create({
    data: {
      nome: body.nome,
      itens,
      etapas: {
        create: etapas
          .filter((e: { titulo?: string }) => e.titulo?.trim())
          .map((e: { titulo: string; categoria?: string | null; diasRelativos?: number; estimativaHoras?: number | null }, i: number) => ({
            ordem: i,
            titulo: e.titulo.trim(),
            categoria: e.categoria || null,
            diasRelativos: Number.isFinite(e.diasRelativos) ? e.diasRelativos : 0,
            estimativaHoras: e.estimativaHoras != null ? Number(e.estimativaHoras) : null,
          })),
      },
    },
    include: { etapas: { orderBy: { ordem: "asc" } } },
  });

  return NextResponse.json(template, { status: 201 });
}
