import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Endpoints de API que PRECISAM continuar acessíveis sem login — porque são
// parte de um fluxo público de verdade (cliente vendo/aceitando uma proposta,
// deixando um comentário no relatório) ou porque já têm seu próprio segredo na
// própria URL (rotas de setup/agenda, avaliadas dentro de cada rota). Qualquer
// combinação de caminho + método que não bater aqui, dentro de /api, exige
// sessão — inclusive um método diferente (ex: DELETE) numa dessas mesmas
// rotas, que fica de fora dessa lista de propósito.
function apiRotaPublica(pathname: string, method: string) {
  if (pathname.startsWith("/api/auth/")) return true; // login em si (NextAuth)
  if (pathname === "/api/agenda.ics") return true; // feed .ics, exige ?secret= próprio
  if (
    ["/api/setup", "/api/resetar-senha", "/api/reset-catalogo", "/api/reset-catalogo-total", "/api/seed-servicos"].includes(
      pathname
    )
  ) {
    return true; // rotas de manutenção, cada uma já exige ?secret= próprio
  }
  if (method === "GET" && /^\/api\/orcamento\/[^/]+$/.test(pathname)) return true; // cliente abrindo a proposta
  if (method === "POST" && /^\/api\/orcamento\/[^/]+\/aceitar$/.test(pathname)) return true; // cliente aceitando
  if (method === "PATCH" && /^\/api\/relatorios\/[^/]+$/.test(pathname)) return true; // cliente comentando o relatório
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protegeComoPagina = pathname.startsWith("/dashboard");
  const protegeComoApi = pathname.startsWith("/api/") && !apiRotaPublica(pathname, request.method);

  if (!protegeComoPagina && !protegeComoApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  if (protegeComoApi) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
