"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";

const CHAVE = "instaby:tema";
type Tema = "escuro" | "cinza";

// Mesmo padrão do OcultarValores.tsx: um estado de verdade compartilhado
// entre todos os componentes (não cada um lendo o localStorage por conta
// própria), pra qualquer botão que exista no app refletir a troca na hora.
let valorAtual: Tema = "escuro";
let inicializado = false;
const escutadores = new Set<() => void>();

function aplicarNoHtml(tema: Tema) {
  if (typeof document === "undefined") return;
  if (tema === "cinza") document.documentElement.setAttribute("data-theme", "cinza");
  else document.documentElement.removeAttribute("data-theme");
}

function garantirInicializado() {
  if (inicializado || typeof window === "undefined") return;
  valorAtual = localStorage.getItem(CHAVE) === "cinza" ? "cinza" : "escuro";
  aplicarNoHtml(valorAtual); // cobre o caso do script de boot (app/layout.tsx) não ter rodado por algum motivo
  inicializado = true;
}

function definir(novo: Tema) {
  valorAtual = novo;
  if (typeof window !== "undefined") localStorage.setItem(CHAVE, novo);
  aplicarNoHtml(novo);
  escutadores.forEach((fn) => fn());
}

function inscrever(fn: () => void) {
  escutadores.add(fn);
  return () => escutadores.delete(fn);
}

function obterEstado(): Tema {
  garantirInicializado();
  return valorAtual;
}

export function useTema() {
  const tema = useSyncExternalStore(inscrever, obterEstado, () => "escuro" as Tema);

  function alternar() {
    definir(valorAtual === "cinza" ? "escuro" : "cinza");
  }

  return { tema, alternar };
}

export function BotaoTema() {
  const { tema, alternar } = useTema();
  return (
    <button
      onClick={alternar}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card/60 text-muted transition-colors hover:bg-hover hover:text-text"
      title={tema === "cinza" ? "Usar o fundo escuro padrão" : "Usar o fundo cinza"}
    >
      <Palette size={15} />
    </button>
  );
}
