import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/permissoes";
import { destinoLogin } from "@/lib/destinoLogin";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string | string[] };
}) {
  const usuario = await getUsuarioAtual();
  if (usuario) {
    const callbackUrl = typeof searchParams?.callbackUrl === "string" ? searchParams.callbackUrl : null;
    redirect(destinoLogin(callbackUrl));
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
