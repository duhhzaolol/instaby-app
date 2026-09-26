import { NextRequest, NextResponse } from "next/server";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { urlDeAutorizacao } from "@/lib/google";

// Início da conexão: manda a pessoa pra tela do Google pedindo autorização.
// Só quem administra Configurações pode iniciar isso — é uma conexão única
// pra agência inteira, não algo que qualquer membro da equipe deveria disparar.
export async function GET(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarConfiguracoes) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/dashboard/configuracoes?google=faltam_chaves", request.url)
    );
  }

  const origin = request.nextUrl.origin;
  return NextResponse.redirect(urlDeAutorizacao(origin));
}
