import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Busca o usuário logado sempre fresco do banco (nunca do JWT) — assim, se você
// mudar a permissão de alguém em Configurações > Equipe, o efeito é imediato na
// próxima página que essa pessoa abrir, sem precisar esperar a sessão expirar.
export async function getUsuarioAtual() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user.email } });
  if (!usuario || !usuario.ativo) return null;
  return usuario;
}

export type Usuario = NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>>;

// Objeto pronto de "o que essa pessoa pode" — master sempre true em tudo,
// pra nenhuma tela precisar ficar checando `usuario.master || usuario.xyz` na mão.
export function permissoesDe(usuario: Usuario) {
  // verComercial é o flag legado (compatibilidade: quem já tinha o antigo botão
  // único "Comercial" ligado continua com os 4 de baixo liberados, sem precisar
  // editar ninguém). Gente criada/editada pelo formulário novo usa só os 4
  // específicos — o formulário nem manda mais verComercial=true.
  return {
    master: usuario.master,
    verFinanceiro: usuario.master || usuario.verFinanceiro,
    gerenciarFinanceiro: usuario.master || usuario.gerenciarFinanceiro,
    verComercial: usuario.master || usuario.verComercial,
    verOportunidades: usuario.master || usuario.verComercial || usuario.verOportunidades,
    verOrcamentos: usuario.master || usuario.verComercial || usuario.verOrcamentos,
    verContratos: usuario.master || usuario.verComercial || usuario.verContratos,
    verCatalogo: usuario.master || usuario.verComercial || usuario.verCatalogo,
    gerenciarTrafego: usuario.master || usuario.gerenciarTrafego,
    gerenciarEquipe: usuario.master || usuario.gerenciarEquipe,
    gerenciarConfiguracoes: usuario.master || usuario.gerenciarConfiguracoes,
    todosClientes: usuario.master || usuario.todosClientes,
  };
}

// Usada nos layout.tsx de seção protegida (Financeiro, Comercial, Equipe...) —
// se a pessoa não tiver a capacidade, volta pra Visão Geral em vez de mostrar a tela.
export async function exigirPermissao(flag: keyof ReturnType<typeof permissoesDe>) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const pode = permissoesDe(usuario);
  if (!pode[flag]) redirect("/dashboard");
  return usuario;
}

// Versão pra rota de API — o middleware já garante que tem sessão válida, aqui
// só confere a capacidade específica. Devolve { erro } (responda com ele e pare)
// ou { usuario } pronto pra usar no resto da rota.
export async function exigirPermissaoApi(
  flag: keyof ReturnType<typeof permissoesDe>
): Promise<{ usuario: Usuario; erro?: undefined } | { usuario?: undefined; erro: NextResponse }> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { erro: NextResponse.json({ erro: "Não autenticado" }, { status: 401 }) };
  }
  const pode = permissoesDe(usuario);
  if (!pode[flag]) {
    return { erro: NextResponse.json({ erro: "Não autorizado" }, { status: 403 }) };
  }
  return { usuario };
}

// Lista de IDs de cliente que essa pessoa pode ver — null significa "todos"
// (master ou todosClientes=true), útil pra passar direto num `where: { id: { in } }`.
export async function clienteIdsPermitidos(usuario: Usuario): Promise<string[] | null> {
  if (usuario.master || usuario.todosClientes) return null;
  const permitidos = await prisma.clienteUsuario.findMany({
    where: { usuarioId: usuario.id },
    select: { clienteId: true },
  });
  return permitidos.map((p) => p.clienteId);
}

// Confere se essa pessoa pode ver ESSE cliente específico — usada nas páginas de
// detalhe de cliente (Tarefa, Cliente, Financeiro por cliente etc.) pra bloquear
// acesso direto por URL a um cliente que não é dela.
export async function podeVerCliente(usuario: Usuario, clienteId: string) {
  if (usuario.master || usuario.todosClientes) return true;
  const permitido = await prisma.clienteUsuario.findUnique({
    where: { usuarioId_clienteId: { usuarioId: usuario.id, clienteId } },
  });
  return !!permitido;
}
