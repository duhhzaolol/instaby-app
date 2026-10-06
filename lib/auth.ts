import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 dias
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const email = credentials.email.trim().toLowerCase();
        if (!email) return null;
        // Não escolhe uma conta arbitrária se dois cadastros antigos diferirem
        // só por maiúsculas. A senha continua sendo comparada sem alterações.
        const usuarios = await prisma.usuario.findMany({
          where: { email: { equals: email, mode: "insensitive" } },
          take: 2,
        });
        // Mesmo se o e-mail não existir, não revela isso pra quem tenta —
        // sempre "e-mail ou senha incorretos", nunca "esse e-mail não existe".
        if (usuarios.length !== 1 || !usuarios[0].ativo) return null;
        const usuario = usuarios[0];

        // Proteção contra força bruta: depois de 5 senhas erradas seguidas,
        // bloqueia esse login por 15 minutos, mesmo que a senha certa venha
        // em seguida — impede um script de ficar tentando milhares de senhas.
        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
          return null;
        }

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha);

        if (!senhaValida) {
          const tentativas = usuario.tentativasFalhas + 1;
          const LIMITE_TENTATIVAS = 5;
          const BLOQUEIO_MINUTOS = 15;
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              tentativasFalhas: tentativas >= LIMITE_TENTATIVAS ? 0 : tentativas,
              bloqueadoAte:
                tentativas >= LIMITE_TENTATIVAS
                  ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60 * 1000)
                  : usuario.bloqueadoAte,
            },
          });
          return null;
        }

        // Login certo — zera qualquer contador/bloqueio que tivesse acumulado.
        if (usuario.tentativasFalhas > 0 || usuario.bloqueadoAte) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { tentativasFalhas: 0, bloqueadoAte: null },
          });
        }

        return { id: usuario.id, email: usuario.email, name: usuario.nome };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub;
      return session;
    },
    // Depois de salvar o perfil, relê somente a conta identificada pelo token
    // assinado. Nome/e-mail enviados pelo navegador não definem a identidade.
    async jwt({ token, trigger }) {
      if (trigger === "update") {
        if (!token.sub) throw new Error("Sessão inválida");
        const usuario = await prisma.usuario.findUnique({
          where: { id: token.sub },
          select: { nome: true, email: true, ativo: true },
        });
        if (!usuario?.ativo) throw new Error("Sessão inválida");
        token.name = usuario.nome;
        token.email = usuario.email;
      }
      return token;
    },
  },
};
