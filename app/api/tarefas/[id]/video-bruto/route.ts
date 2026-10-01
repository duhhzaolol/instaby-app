import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { verificarVideoBrutoNoDrive } from "@/lib/google";

// Checagem sob demanda (botão "Verificar" na tarefa) — não roda sozinha em
// background nem numa lista inteira de tarefas, só quando alguém pede, pra não
// gastar chamada de API do Drive à toa.
export async function GET(
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
  if (!tarefa.driveFolderId) {
    return NextResponse.json({ temBruto: false, semPasta: true });
  }

  try { return NextResponse.json(await verificarVideoBrutoNoDrive(tarefa.driveFolderId)); }
  catch { return NextResponse.json({ erro: "Não consegui consultar a pasta do Drive. Confira a conexão e o acesso à pasta em Configurações." }, { status: 502 }); }
}
