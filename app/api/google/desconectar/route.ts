import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";

export async function POST() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarConfiguracoes) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.configuracao.upsert({
    where: { id: "config" },
    update: { googleDriveRefreshToken: null, googleDriveConectadoEm: null },
    create: { id: "config" },
  });

  return NextResponse.json({ ok: true });
}
