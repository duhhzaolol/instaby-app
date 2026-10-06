"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

// O formulário usa o contexto para atualizar os dados da própria sessão.
export function SessaoPerfil({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
