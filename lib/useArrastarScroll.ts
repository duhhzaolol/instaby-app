"use client";

// Hook genérico pra permitir arrastar com o MOUSE qualquer contêiner horizontal
// com overflow-x-auto (carrossel de Serviços no celular, carrossel do Processo...).
// O touch/trackpad já rola sozinho — isso só entra em ação quando o ponteiro é de
// fato um mouse (pointerType === "mouse"), então nunca atrapalha o swipe de toque.
//
// Resolve o problema relatado: testando no computador com a janela do navegador
// estreita (achando que ia se comportar como celular), arrastar com o mouse não
// rolava a lista — só funcionava tocando na tela (touch) ou usando o trackpad.
//
// Também cancela o clique se a pessoa realmente arrastou (moveu mais que alguns
// pixels), pra arrastar não "ativar" sem querer o link/serviço por baixo do mouse.

import { useCallback, useRef } from "react";

export function useArrastarScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const arrastando = useRef(false);
  const inicioX = useRef(0);
  const scrollInicio = useRef(0);
  const moveu = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    arrastando.current = true;
    moveu.current = false;
    inicioX.current = e.clientX;
    scrollInicio.current = el.scrollLeft;
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!arrastando.current || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const delta = e.clientX - inicioX.current;
    if (Math.abs(delta) > 3) moveu.current = true;
    el.scrollLeft = scrollInicio.current - delta;
  }, []);

  const pararArraste = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    arrastando.current = false;
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (moveu.current) {
      e.preventDefault();
      e.stopPropagation();
      moveu.current = false;
    }
  }, []);

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp: pararArraste,
    onPointerLeave: pararArraste,
    onClickCapture,
    // cursor de "mão" só como dica visual — não afeta touch
    className: "cursor-grab active:cursor-grabbing",
  };
}
