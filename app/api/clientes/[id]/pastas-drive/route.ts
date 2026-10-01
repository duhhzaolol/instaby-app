import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUsuarioAtual,
  podeVerCliente,
  permissoesDe,
} from "@/lib/permissoes";
import { garantirPastasCliente } from "@/lib/google";

async function autorizado(clienteId: string) {
  const u = await getUsuarioAtual();
  if (!u)
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  if (!permissoesDe(u).verArquivos || !(await podeVerCliente(u, clienteId)))
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });
  if (!cliente)
    return NextResponse.json(
      { erro: "Cliente não encontrado." },
      { status: 404 },
    );
  return null;
}
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const erro = await autorizado(params.id);
  if (erro) return erro;
  try {
    const pastas = await garantirPastasCliente(params.id);
    if (!pastas)
      return NextResponse.json(
        {
          erro: "Conecte o Google Drive da agência em Configurações para criar as pastas.",
        },
        { status: 409 },
      );
    return NextResponse.json(pastas);
  } catch {
    return NextResponse.json(
      {
        erro: "Não consegui preparar as pastas. Confira a conexão do Google Drive e tente novamente.",
      },
      { status: 502 },
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const erro = await autorizado(params.id);
  if (erro) return erro;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.identidadeUrl !== "string")
    return NextResponse.json(
      { erro: "Informe o link da pasta de identidade." },
      { status: 400 },
    );
  let id: string | null = null;
  if (body.identidadeUrl.trim()) {
    try {
      const url = new URL(body.identidadeUrl.trim());
      id =
        /^\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,})\/?$/.exec(
          url.pathname,
        )?.[1] || null;
      if (
        url.hostname !== "drive.google.com" ||
        url.protocol !== "https:" ||
        !id
      )
        throw new Error();
    } catch {
      return NextResponse.json(
        {
          erro: "Cole o link de uma pasta do Google Drive, não o link de um arquivo.",
        },
        { status: 400 },
      );
    }
  }
  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: { driveLogotiposFolderId: id },
    select: {
      driveClienteFolderId: true,
      driveLogotiposFolderId: true,
      driveConteudoFolderId: true,
    },
  });
  return NextResponse.json(cliente);
}
