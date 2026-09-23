import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
  return {
    master: usuario.master,
    verFinanceiro: usuario.master || usuario.verFinanceiro,
    gerenciarFinanceiro: usuario.master || usuario.gerenciarFinanceiro,
    verComercial: usuario.master || usuario.verComercial,
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
