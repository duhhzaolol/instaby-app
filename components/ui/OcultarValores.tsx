"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";

const CHAVE = "instaby:ocultar-valores";

// Estado compartilhado de verdade entre todos os componentes da página — antes cada
// um lia o localStorage só na hora de montar, então clicar o botão num lugar não
// atualizava os outros cartões já abertos na tela.
let valorAtual = false;
let inicializado = false;
const escutadores = new Set<() => void>();

function garantirInicializado() {
  if (inicializado || typeof window === "undefined") return;
  valorAtual = localStorage.getItem(CHAVE) === "1";
  inicializado = true;
}

function definir(novo: boolean) {
  valorAtual = novo;
  if (typeof window !== "undefined") localStorage.setItem(CHAVE, novo ? "1" : "0");
  escutadores.forEach((fn) => fn());
}

function inscrever(fn: () => void) {
  escutadores.add(fn);
  return () => escutadores.delete(fn);
}

function obterEstado() {
  garantirInicializado();
  return valorAtual;
}

export function useOcultarValores() {
  const oculto = useSyncExternalStore(inscrever, obterEstado, () => false);

  function alternar() {
    definir(!valorAtual);
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
