import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaTarefa } from "@/lib/google";

// Gera a pasta própria da tarefa no Drive sob demanda (botão "Gerar pasta" /
// "Gerar pasta nova" no painel) — v155. Dois usos:
// 1) Tarefa que nunca teve driveFolderId (Drive não estava conectado na hora,
//    ou prazo/cliente foram definidos só depois do "ensure" automático já ter
//    rodado sem sucesso).
// 2) "Destravar" uma tarefa que ainda aponta pra pasta COMPARTILHADA da semana
//    (jeito de antes da v153/garantirPastaSemana) sem precisar editar o banco
//    na mão — zera o vínculo antigo aqui e deixa garantirPastaTarefa criar uma
//    subpasta nova, só dela, do zero.
//
// De propósito, NÃO move nenhum arquivo que já estivesse na pasta anterior —
// o front avisa disso antes de chamar essa rota quando já existia um vínculo.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (!tarefa.clienteId || !tarefa.prazo) {
    return NextResponse.json(
      { erro: "Defina cliente e prazo da tarefa antes de gerar a pasta." },
      { status: 400 }
    );
  }

  if (tarefa.driveFolderId) {
    await prisma.tarefa.update({ where: { id: tarefa.id }, data: { driveFolderId: null } });
  }

  const driveFolderId = await garantirPastaTarefa(tarefa.id);
  if (!driveFolderId) {
    return NextResponse.json(
      { erro: "Não consegui criar a pasta — confere se o Drive da agência está conectado em Configurações." },
      { status: 500 }
    );
  }

  return NextResponse.json({ driveFolderId });
}
