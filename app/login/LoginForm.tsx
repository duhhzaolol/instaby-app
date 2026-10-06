"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { destinoLogin } from "@/lib/destinoLogin";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setErro("");
    setCarregando(true);

    try {
      const destino = destinoLogin(searchParams.get("callbackUrl"));
      const resultado = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        senha,
        redirect: false,
        callbackUrl: destino,
      });

      if (resultado?.error === "CredentialsSignin") {
        setErro("E-mail ou senha incorretos. Confira os dados e tente novamente.");
        return;
      }
      if (!resultado?.ok || resultado.error) {
        setErro("Não foi possível entrar agora. Tente novamente em instantes.");
        return;
      }

      // Reabre pelo servidor com o cookie recém-criado e permite ao gerenciador
      // de senhas reconhecer a conclusão do formulário de login.
      window.location.assign(destino);
    } catch {
      setErro("Não foi possível conectar. Confira sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Instaby" className="mx-auto h-8 w-auto" />
          <p className="mt-5 text-lg font-medium text-text">Bem-vindo de volta</p>
          <p className="mt-1 text-sm text-muted">Entre para acessar o painel</p>
        </div>

        <Card hoverable={false} className="p-6">
          <form onSubmit={handleSubmit} autoComplete="on">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mb-4"
            />

            <Label htmlFor="login-senha">Senha</Label>
            <Input
              id="login-senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="mb-6"
              aria-describedby={erro ? "login-erro" : undefined}
            />

            {erro && <p id="login-erro" role="alert" className="mb-4 text-xs text-red-400">{erro}</p>}

            <Button type="submit" disabled={carregando} className="w-full">
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <details className="mt-5 border-t border-border pt-4 text-xs text-muted">
            <summary className="cursor-pointer font-medium text-text">Usar Senhas e Face ID no iPhone</summary>
            <p className="mt-3 leading-relaxed">
              No iPhone, ative o preenchimento automático de senhas nos Ajustes. Ao tocar em um campo,
              escolha a senha salva para instaby-app.vercel.app e confirme com Face ID, se disponível.
            </p>
            <p className="mt-2 leading-relaxed">
              Depois de entrar, o acesso fica salvo por até 30 dias. Se o iPhone pedir novamente,
              você pode preencher os dados usando o app Senhas.
            </p>
          </details>
        </Card>
      </motion.div>
    </div>
  );
}
