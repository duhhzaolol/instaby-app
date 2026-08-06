"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    setCarregando(false);

    if (resultado?.error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <span className="inline-block text-2xl font-semibold tracking-tight">
            <span className="text-text">insta</span>
            <span className="text-accent">by</span>
          </span>
          <p className="mt-5 text-lg font-medium text-text">Bem-vindo de volta</p>
          <p className="mt-1 text-sm text-muted">Entre para acessar o painel</p>
        </div>

        <Card hoverable={false} className="p-6">
          <form onSubmit={handleSubmit}>
            <Label>E-mail</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mb-4"
            />

            <Label>Senha</Label>
            <Input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="mb-6"
            />

            {erro && <p className="mb-4 text-xs text-red-400">{erro}</p>}

            <Button type="submit" disabled={carregando} className="w-full">
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
