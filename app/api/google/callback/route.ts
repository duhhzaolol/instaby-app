import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { trocarCodigoPorTokens } from "@/lib/google";

// O Google volta pra cá depois da pessoa autorizar (ou cancelar). O endereço
// completo dessa rota (ex: https://instaby-app.vercel.app/api/google/callback)
// tem que estar cadastrado em "URIs de redirecionamento autorizados" lá no
// Google Cloud — se o domínio mudar, precisa cadastrar o novo lá também.
export async function GET(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !permissoesDe(usuario).gerenciarConfiguracoes) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const erroGoogle = request.nextUrl.searchParams.get("error");
  if (erroGoogle || !code) {
    // "access_denied" acontece quando a pessoa clica em cancelar na tela do Google
    return NextResponse.redirect(
      new URL("/dashboard/configuracoes?google=cancelado", request.url)
    );
  }

  try {
    const origin = request.nextUrl.origin;
    const tokens = await trocarCodigoPorTokens(origin, code);

    // Sem refresh_token não dá pra manter a conexão funcionando depois que o
    // access_token (curta duração) expirar — isso só aconteceria se o Google
    // não tivesse pedido consentimento de novo, o que não deveria ocorrer já
    // que /conectar sempre manda prompt=consent.
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/configuracoes?google=sem_refresh_token", request.url)
      );
    }

    await prisma.configuracao.upsert({
      where: { id: "config" },
      update: { googleDriveRefreshToken: tokens.refresh_token, googleDriveConectadoEm: new Date() },
      create: {
        id: "config",
        googleDriveRefreshToken: tokens.refresh_token,
        googleDriveConectadoEm: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/dashboard/configuracoes?google=conectado", request.url));
  } catch (e) {
    console.error("Erro ao trocar código do Google por tokens:", e);
    return NextResponse.redirect(new URL("/dashboard/configuracoes?google=erro", request.url));
  }
}
