import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";

// Essa rota não tinha NENHUMA checagem de autenticação — qualquer um que soubesse
// o ID de um cliente conseguia criar tarefas nele, sem login. Corrigido (Etapa 1
// v152, mesma trava de /api/tarefas: autenticado + acesso a esse cliente
// especificamente), sem mudar o resto do comportamento.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      clienteId: params.id,
      titulo: body.titulo,
      tipo: body.tipo || "tarefa",
      categoria: body.categoria || null,
      link: body.link || null,
      prazo: body.prazo ? new Date(body.prazo) : null,
    },
  });

  // Checklist inicial (opcional) — mesmo mecanismo de /api/tarefas (preset ou
  // digitado na mão, redesign v144 Parte 3).
  if (Array.isArray(body.checklistItens) && body.checklistItens.length > 0) {
    const itensValidos: string[] = body.checklistItens
      .filter((i: unknown): i is string => typeof i === "string" && i.trim().length > 0)
      .map((i: string) => i.trim());
    if (itensValidos.length > 0) {
      await prisma.checklistItemTarefa.createMany({
        data: itensValidos.map((titulo, ordem) => ({ tarefaId: tarefa.id, titulo, ordem })),
      });
    }
  }

  return NextResponse.json(tarefa, { status: 201 });
}
