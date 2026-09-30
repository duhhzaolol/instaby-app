import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function GET() {
  const { erro } = await exigirPermissaoApi("verCatalogo");
  if (erro) return erro;

  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(servicos);
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("verCatalogo");
  if (erro) return erro;

  const body = await request.json();

  if (!body.nome || typeof body.valorUnitario !== "number" || isNaN(body.valorUnitario)) {
    return NextResponse.json({ erro: "Nome e um valor numérico válido são obrigatórios" }, { status: 400 });
  }

  try {
    const servico = await prisma.servico.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || "",
        categoria: body.categoria || "Outros",
        unidade: body.unidade || "mês",
        valorUnitario: body.valorUnitario,
        clausulaContrato: body.clausulaContrato || null,
        // Etapa 3 (v157) — liga esse serviço ao vocabulário de Tarefa.categoria,
        // pra alimentar o controle mensal de entregas (ver lib/entregas.ts).
        // Opcional: string vazia vira null (mesmo padrão de clausulaContrato).
        categoriaTarefa: body.categoriaTarefa || null,
        // Etapa 4 (v158) — liga esse serviço a um ciclo completo de tarefas
        // (TemplateTarefas com etapas), que passa a ser gerado automaticamente
        // todo mês pra cliente com esse serviço contratado — ver
        // garantirRotinasMensaisDoMes em lib/garantirRecorrentes.ts. Sem
        // validação extra aqui de propósito (mesmo padrão de categoriaTarefa
        // acima): um id inválido já é recusado pela constraint de chave
        // estrangeira do banco, capturada pelo catch abaixo.
        templateRotinaId: body.templateRotinaId || null,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não deu pra criar esse serviço." }, { status: 400 });
  }
}
