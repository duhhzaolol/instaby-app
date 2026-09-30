import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/permissoes";

// Tipo explícito pro retorno do Prisma (ver nota em app/dashboard/capacidade/
// page.tsx: o cliente gerado neste sandbox fica genérico sem "prisma generate",
// o que faz .map() encadeado direto no resultado perder o tipo do parâmetro).
type TemplateOpcaoRaw = { id: string; nome: string; itens: string[]; etapas: { id: string }[] };

// Lista mínima de templates pra popular o seletor de "Aplicar template" num
// cliente (Etapa 4 v158) — só nome e formato (ciclo completo x checklist
// simples), nunca os itens/etapas inteiros. Existe separada de GET
// /api/templates-tarefas (que exige gerenciarConfiguracoes e devolve o
// template inteiro, editável) pelo mesmo motivo do GET /api/usuarios vs GET
// /api/equipe (ver comentário lá): "aplicar" um template já usa a trava mais
// leve de criar uma tarefa comum (podeVerCliente, ver [id]/aplicar/route.ts)
// — sem essa lista, quem tem só essa permissão não teria como escolher QUAL
// template aplicar. Nome de template não é valor, contrato nem financeiro,
// então não fere a regra de permissões.
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const templates: TemplateOpcaoRaw[] = await prisma.templateTarefas.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, itens: true, etapas: { select: { id: true } } },
  });

  return NextResponse.json(
    templates.map((t) => ({
      id: t.id,
      nome: t.nome,
      temCiclo: t.etapas.length > 0,
      totalEtapas: t.etapas.length,
      totalItens: t.itens.length,
    }))
  );
}
