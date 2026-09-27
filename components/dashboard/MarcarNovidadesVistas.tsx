"use client";

import { useEffect } from "react";

// Mesma chave usada em components/layout/Sidebar.tsx pra decidir se mostra a
// bolinha de "tem novidade" ao lado do item de menu.
const CHAVE_NOVIDADES_VISTAS = "instaby:novidades-vista";

// Componente "invisível" — só existe pra marcar, assim que a página de
// Novidades carrega, que a pessoa já viu até essa versão. Não renderiza nada.
export function MarcarNovidadesVistas({ versao }: { versao: number }) {
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_NOVIDADES_VISTAS, String(versao));
    } catch {
      // sem localStorage, sem bolinha — não é crítico
    }
  }, [versao]);

  return null;
}
