"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const CHAVE = "instaby:ocultar-valores";

export function useOcultarValores() {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    setOculto(localStorage.getItem(CHAVE) === "1");
  }, []);

  function alternar() {
    setOculto((atual) => {
      const novo = !atual;
      localStorage.setItem(CHAVE, novo ? "1" : "0");
      return novo;
    });
  }

  return { oculto, alternar };
}

export function BotaoOcultarValores({ oculto, onClick }: { oculto: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted transition-colors hover:bg-hover hover:text-text"
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
    >
      {oculto ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

export function ValorSensivel({ oculto, children }: { oculto: boolean; children: React.ReactNode }) {
  if (oculto) {
    return <span className="select-none tracking-widest text-muted">••••••</span>;
  }
  return <>{children}</>;
}
