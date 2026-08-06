"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      <div className="w-full max-w-sm rounded-2xl bg-base p-10">
        <div className="mb-8 text-center">
          <span className="inline-block border border-white px-3 py-1 text-lg font-medium tracking-wide">
            <span className="text-white">insta</span>
            <span className="text-accent">by</span>
          </span>
          <p className="mt-4 text-lg font-medium text-white">Bem-vindo de volta</p>
          <p className="mt-1 text-sm text-muted">Entre para acessar o painel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="text-xs text-muted">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="mb-4 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
          />

          <label className="text-xs text-muted">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="mb-6 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
          />

          {erro && <p className="mb-4 text-xs text-accent">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="h-11 w-full rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
