import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
  if (erro) return erro;

  const body = await request.json();

  // Etapa 4 (v158) — quando `etapas` vem no corpo, substitui a lista inteira (mais
  // simples e seguro do que tentar "casar" edição por edição — nada mais referencia
  // o id de uma TemplateEtapa individualmente, então recriar não perde vínculo
  // nenhum). Quando `etapas` não vem (PATCH só de nome/itens, uso antigo), as
  // etapas que já existiam continuam intactas.
  if (Array.isArray(body.etapas)) {
    await prisma.templateEtapa.deleteMany({ where: { templateId: params.id } });
  }

  const template = await prisma.templateTarefas.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.itens !== undefined && { itens: body.itens }),
      ...(Array.isArray(body.etapas) && {
        etapas: {
          create: body.etapas
            .filter((e: { titulo?: string }) => e.titulo?.trim())
            .map((e: { titulo: string; categoria?: string | null; diasRelativos?: number; estimativaHoras?: number | null }, i: number) => ({
              ordem: i,
              titulo: e.titulo.trim(),
              categoria: e.categoria || null,
              diasRelativos: Number.isFinite(e.diasRelativos) ? e.diasRelativos : 0,
              estimativaHoras: e.estimativaHoras != null ? Number(e.estimativaHoras) : null,
            })),
        },
      }),
    },
    include: { etapas: { orderBy: { ordem: "asc" } } },
  });
  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarConfiguracoes");
  if (erro) return erro;

  // Etapa 4 (v158) — sem essa checagem, excluir um template que já gerou rotina
  // automática (RotinaGerada.templateId é obrigatório, sem onDelete próprio —
  // Restrict por padrão do Prisma) quebraria com um erro cru de banco em vez de
  // uma mensagem clara. Serviço ligado ao template (Servico.templateRotinaId) não
  // precisa dessa checagem — essa relação é opcional e some sozinha (SetNull).
  const rotinasGeradas = await prisma.rotinaGerada.count({ where: { templateId: params.id } });
  if (rotinasGeradas > 0) {
    return NextResponse.json(
      {
        erro: `Esse template já gerou ${rotinasGeradas} rotina(s) automática(s) e não pode ser excluído — edite o nome/etapas em vez de apagar, ou desvincule-o dos serviços primeiro.`,
      },
      { status: 409 }
    );
  }

  await prisma.templateTarefas.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
