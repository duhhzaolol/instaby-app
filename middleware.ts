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
  if ((method === "GET" || method === "POST") && /^\/api\/orcamento\/[^/]+\/pdf$/.test(pathname)) return true; // PDF da proposta pública, sem alterar o orçamento
  if (method === "POST" && /^\/api\/orcamento\/[^/]+\/aceitar$/.test(pathname)) return true; // cliente aceitando
  if (method === "PATCH" && /^\/api\/relatorios\/[^/]+$/.test(pathname)) return true; // cliente comentando o relatório
  // A página de revisão usa o próprio link da tarefa. Somente comentar e
  // decidir a versão são públicos; criar versões e editar tarefas exigem sessão.
  if (method === "POST" && /^\/api\/tarefas\/[^/]+\/versoes\/[^/]+\/comentarios$/.test(pathname)) return true;
  if (method === "PATCH" && /^\/api\/tarefas\/[^/]+\/versoes\/[^/]+$/.test(pathname)) return true;
  if (method === "GET" && /^\/api\/revisao\/[^/]+\/versoes\/[^/]+\/video$/.test(pathname)) return true;
  // Etapa 3 (v157) — cliente enviando o formulário público de solicitação
  // (/solicitar/[clienteId]), mesmo espírito das 3 linhas acima: rota específica
  // só pra esse método, tudo mais no mesmo caminho (se algum dia existir) continua
  // exigindo sessão.
  if (method === "POST" && /^\/api\/clientes\/[^/]+\/solicitacoes\/publica$/.test(pathname)) return true;
  // Link restrito ao cronograma: só comentários públicos neste caminho.
  if (method === "POST" && /^\/api\/cronograma\/[a-f0-9]{64}\/pautas\/[^/]+\/comentarios$/.test(pathname)) return true;
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
